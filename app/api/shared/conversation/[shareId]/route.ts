import { ConversationService } from "@/lib/db/conversation-service"
import { CreditService } from "@/lib/db/credit-service"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params

    if (!shareId) {
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      )
    }

    // Find the shared conversation by slug
    const sharedConversation = await prisma.conversation.findFirst({
      where: {
        shareSlug: shareId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true
          }
        },
        artifacts: {
          select: {
            isPublic: true
          }
        }
      }
    })

    if (!sharedConversation) {
      return NextResponse.json(
        { error: "Shared conversation not found" },
        { status: 404 }
      )
    }

    // Check if conversation is public OR has any public artifacts
    const hasPublicArtifacts = sharedConversation.artifacts.some(artifact => artifact.isPublic)
    const canAccess = sharedConversation.isPublic || hasPublicArtifacts

    if (!canAccess) {
      return NextResponse.json(
        { error: "This conversation is private and contains no public artifacts" },
        { status: 403 }
      )
    }

    // Get the full conversation data
    const conversationData = await ConversationService.getConversationById(
      sharedConversation.id
    )

    // If conversation is private but has public artifacts, filter to only show public artifacts
    let filteredArtifacts = conversationData.artifacts
    if (!sharedConversation.isPublic && hasPublicArtifacts) {
      // Only show public artifacts
      filteredArtifacts = conversationData.artifacts.filter((artifact: any) => {
        // Check if this artifact is public by finding it in the included artifacts
        const isPublic = sharedConversation.artifacts.find((a: any) => a.isPublic)
        return isPublic
      })

      // We need to get the full artifact data with isPublic field
      const publicArtifacts = await prisma.artifact.findMany({
        where: {
          conversationId: sharedConversation.id,
          isPublic: true
        }
      })

      // Map to frontend format
      filteredArtifacts = publicArtifacts.map(artifact => ({
        id: artifact.id,
        name: artifact.name,
        content: artifact.content,
        timestamp: Number(artifact.timestamp)
      }))
    }

    // Increment view count
    const updatedConversation = await prisma.conversation.update({
      where: { id: sharedConversation.id },
      data: {
        views: {
          increment: 1
        }
      },
      select: {
        views: true
      }
    })

    // Check for view milestone and award credits if user exists
    if (sharedConversation.userId) {
      await CreditService.processViewMilestone(
        sharedConversation.userId,
        'conversation',
        sharedConversation.id,
        updatedConversation.views
      )
    }

    // Prepare user info for response
    const userInfo = sharedConversation.user ? {
      id: sharedConversation.user.id,
      name: sharedConversation.user.name || 'Anonymous User',
      avatar: sharedConversation.user.avatar || sharedConversation.user.image
    } : null;

    return NextResponse.json({
      id: sharedConversation.id,
      shareId: shareId,
      title: conversationData.conversation.title,
      messages: conversationData.messages,
      artifacts: filteredArtifacts, // Use filtered artifacts
      toolResults: conversationData.toolResults,
      createdAt: sharedConversation.createdAt.toISOString(),
      views: updatedConversation.views,
      user: userInfo,
      isPrivateWithPublicArtifacts: !sharedConversation.isPublic && hasPublicArtifacts // Add flag for UI
    })

  } catch (error) {
    console.error("❌ Get Shared Conversation Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch shared conversation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
