import { CreditService } from "@/lib/db/credit-service"
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      )
    }

    // Find the message containing the artifact
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
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
        },
        artifacts: true
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }

    // Extract artifact content from message
    const artifactContent = extractArtifactFromMessage(message.content)

    if (!artifactContent) {
      return NextResponse.json(
        { error: "Artifact not found in message" },
        { status: 404 }
      )
    }

    // Find or create artifact record if it doesn't exist
    let artifact = message.artifacts.find(a => a.content === artifactContent) || null

    if (!artifact && message.artifactId) {
      // Try to find by ID if available
      artifact = await prisma.artifact.findUnique({
        where: { id: message.artifactId },
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
    }

    if (!artifact) {
      // Create a new artifact record
      const artifactTitle = extractHtmlTitle(artifactContent)
      artifact = await prisma.artifact.create({
        data: {
          name: artifactTitle,
          type: "HTML",
          content: artifactContent,
          timestamp: BigInt(Date.now()),
          messageId: message.id,
          userId: message.conversation?.userId || null,
          isPublic: true
        }
      })
    }

    // Increment view count
    const updatedArtifact = await prisma.artifact.update({
      where: { id: artifact.id },
      data: {
        views: {
          increment: 1
        }
      },
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

    // Check for view milestone and award credits if user exists
    if (updatedArtifact.userId) {
      await CreditService.processViewMilestone(
        updatedArtifact.userId,
        'artifact',
        updatedArtifact.id,
        updatedArtifact.views
      )
    }

    // Get user info from artifact or conversation
    const userInfo = updatedArtifact.user
      ? {
        id: updatedArtifact.user.id,
        name: updatedArtifact.user.name || 'Anonymous User',
        avatar: updatedArtifact.user.avatar || updatedArtifact.user.image
      }
      : message.conversation?.user
        ? {
          id: message.conversation.user.id,
          name: message.conversation.user.name || 'Anonymous User',
          avatar: message.conversation.user.avatar || message.conversation.user.image
        }
        : null;

    return NextResponse.json({
      id: updatedArtifact.id,
      messageId: message.id,
      title: updatedArtifact.name,
      content: artifactContent,
      createdAt: updatedArtifact.createdAt.toISOString(),
      views: updatedArtifact.views,
      user: userInfo
    })

  } catch (error) {
    console.error("❌ Get Shared Artifact Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch shared artifact",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
