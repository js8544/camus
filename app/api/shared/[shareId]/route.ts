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

    return Response.json({
      id: artifact.id,
      name: artifact.name,
      content: artifact.content,
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
