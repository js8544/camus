import { extractArtifactFromMessage, extractHtmlTitle } from "@/lib/artifact-utils"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log("🔗 Share API: Attempting to share artifact", { id })

    // First, try to find the artifact directly by ID (hash-based ID)
    let artifact = await prisma.artifact.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true
          }
        }
      }
    })

    let artifactContent: string
    let messageId: string

    if (artifact) {
      // Found artifact directly
      artifactContent = artifact.content
      messageId = id // Use the artifact ID as the message ID for URL compatibility
      console.log("✅ Share API: Found artifact directly", {
        artifactId: artifact.id,
        conversationId: artifact.conversationId,
        artifactTitle: artifact.name
      })
    } else {
      // Fallback: try to find by message ID (for backward compatibility)
      console.log("🔄 Share API: Artifact not found directly, trying as message ID", { id })

      const message = await prisma.message.findUnique({
        where: { id }
      })

      if (!message) {
        throw new Error(`Neither artifact nor message with ID ${id} found`)
      }

      // Extract artifact content from message
      const extractedContent = extractArtifactFromMessage(message.content)

      if (!extractedContent) {
        throw new Error(`No artifact found in message ${id}`)
      }

      artifactContent = extractedContent
      messageId = message.id
      console.log("✅ Share API: Extracted artifact from message", {
        messageId: messageId,
        artifactTitle: extractHtmlTitle(extractedContent)
      })
    }

    // Generate the share URL using the original ID (could be artifact ID or message ID)
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.NEXTAUTH_URL || `https://${request.headers.get('host')}`
      : `http://${request.headers.get('host')}`

    const shareUrl = `${baseUrl}/shared/artifact/${id}`

    console.log("✅ Share API: Successfully created share link", {
      id,
      shareUrl,
      artifactTitle: extractHtmlTitle(artifactContent)
    })

    return NextResponse.json({
      success: true,
      shareUrl,
      messageId,
      artifact: {
        id: id,
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
