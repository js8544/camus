import { extractArtifactFromMessage, extractHtmlTitle } from "@/lib/artifact-utils"
import { CreditService } from "@/lib/db/credit-service"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId: id } = await params

    console.log("🔗 Shared Artifact API: Fetching artifact", { id })

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
    let artifactTitle: string
    let conversationUserId: string | null = null

    if (artifact) {
      // Found artifact directly
      artifactContent = artifact.content
      artifactTitle = artifact.name
      conversationUserId = artifact.userId

      console.log("✅ Shared Artifact API: Found artifact directly", {
        artifactId: artifact.id,
        artifactTitle: artifact.name
      })
    } else {
      // Fallback: try to find by message ID (for backward compatibility)
      console.log("🔄 Shared Artifact API: Artifact not found directly, trying as message ID", { id })

      const message = await prisma.message.findUnique({
        where: { id },
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
          }
        }
      })

      if (!message) {
        return NextResponse.json(
          { error: "Artifact not found" },
          { status: 404 }
        )
      }

      // Extract artifact content from message
      const extractedContent = extractArtifactFromMessage(message.content)

      if (!extractedContent) {
        return NextResponse.json(
          { error: "No artifact content found" },
          { status: 404 }
        )
      }

      artifactContent = extractedContent
      artifactTitle = extractHtmlTitle(extractedContent)
      conversationUserId = message.conversation?.userId || null

      console.log("✅ Shared Artifact API: Extracted artifact from message", {
        messageId: message.id,
        artifactTitle: artifactTitle
      })

      // Check if we already have an artifact record for this content
      artifact = await prisma.artifact.findFirst({
        where: {
          content: artifactContent,
          conversationId: message.conversation?.id
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

      if (!artifact) {
        // Create a new artifact record with hash-based ID
        artifact = await prisma.artifact.create({
          data: {
            name: artifactTitle,
            type: "HTML",
            content: artifactContent,
            timestamp: BigInt(Date.now()),
            conversationId: message.conversation?.id,
            userId: conversationUserId,
            isPublic: true
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
        console.log("📦 Shared Artifact API: Created new artifact record", {
          artifactId: artifact.id,
          conversationId: message.conversation?.id
        })
      }
    }

    // Ensure artifact is not null at this point
    if (!artifact) {
      return NextResponse.json(
        { error: "Failed to find or create artifact" },
        { status: 500 }
      )
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
      : conversationUserId
        ? {
          id: conversationUserId,
          name: 'Anonymous User',
          avatar: null
        }
        : null;

    return NextResponse.json({
      id: updatedArtifact.id,
      messageId: id, // Return the original ID that was requested
      title: updatedArtifact.name,
      content: artifactContent,
      createdAt: updatedArtifact.createdAt.toISOString(),
      views: updatedArtifact.views,
      user: userInfo
    })

  } catch (error) {
    console.error("❌ Shared Artifact API: Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 
