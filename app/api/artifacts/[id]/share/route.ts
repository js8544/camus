import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Helper function to extract artifact from message content
const extractArtifactFromMessage = (content: string) => {
  const artifactMatch = content.match(/```artifact\n([\s\S]*?)\n```/)
  if (artifactMatch) {
    return artifactMatch[1]
  }
  return null
}

// Helper function to extract HTML title
const extractHtmlTitle = (html: string): string => {
  const titleMatch = html.match(/<title>(.*?)<\/title>/)
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1]
  }
  const h1Match = html.match(/<h1>(.*?)<\/h1>/)
  if (h1Match && h1Match[1]) {
    return h1Match[1]
  }
  return 'Generated Artifact'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params

    console.log("🔗 Share API: Attempting to share artifact from message", { messageId })

    // Find the message containing the artifact
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`)
    }

    // Extract artifact content from message
    const artifactContent = extractArtifactFromMessage(message.content)

    if (!artifactContent) {
      throw new Error(`No artifact found in message ${messageId}`)
    }

    // Generate the share URL using message ID directly
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXTAUTH_URL || `https://${request.headers.get('host')}`
      : `http://${request.headers.get('host')}`

    const shareUrl = `${baseUrl}/shared/message/${messageId}`

    console.log("✅ Share API: Successfully created share link", {
      messageId,
      shareUrl,
      artifactTitle: extractHtmlTitle(artifactContent)
    })

    return NextResponse.json({
      success: true,
      shareUrl,
      messageId,
      artifact: {
        id: messageId, // Use message ID as artifact ID
        name: extractHtmlTitle(artifactContent),
        content: artifactContent
      }
    })

  } catch (error) {
    console.error("❌ Share API: Error sharing artifact:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to share artifact"
      },
      { status: 500 }
    )
  }
}
