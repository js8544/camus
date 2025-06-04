import { ConversationService } from "@/lib/db/conversation-service"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ shareId: string }> }) {
  try {
    const { shareId: slug } = await params

    if (!slug) {
      return new Response("Share slug is required", { status: 400 })
    }

    // Get the artifact by slug
    const artifact = await ConversationService.getArtifactBySlug(slug)

    if (!artifact) {
      return new Response("Shared artifact not found", { status: 404 })
    }

    // Increment view count
    await ConversationService.incrementArtifactViews(artifact.id)

    // Ensure HTML content is properly formatted for rendering
    let content = artifact.content;
    if (content &&
      (content.includes("<!DOCTYPE html>") ||
        content.includes("<html") ||
        content.includes("<head")) &&
      content.includes("</html>")) {
      // This is already HTML content, no need to modify
    } else {
      // Potentially wrap in HTML if it's not already HTML
      if (!content.trim().startsWith("<!DOCTYPE") && !content.trim().startsWith("<html")) {
        // Simple text content, wrap it in minimal HTML
        content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artifact.name}</title>
</head>
<body>
  ${content}
</body>
</html>`;
      }
    }

    return Response.json({
      id: artifact.id,
      name: artifact.name,
      content: content,
      createdAt: artifact.createdAt,
      slug: artifact.slug
    })

  } catch (error) {
    console.error("❌ Get Shared Artifact Error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to fetch shared artifact",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 
