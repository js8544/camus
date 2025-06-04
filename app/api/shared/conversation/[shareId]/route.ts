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
        isPublic: true // Only return public shared conversations
      }
    })

    if (!sharedConversation) {
      return NextResponse.json(
        { error: "Shared conversation not found" },
        { status: 404 }
      )
    }

    // Get the full conversation data
    const conversationData = await ConversationService.getConversationById(
      sharedConversation.id
    )

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

    return NextResponse.json({
      id: sharedConversation.id,
      shareId: shareId,
      title: conversationData.conversation.title,
      messages: conversationData.messages,
      artifacts: conversationData.artifacts,
      toolResults: conversationData.toolResults,
      createdAt: sharedConversation.createdAt.toISOString(),
      views: updatedConversation.views
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
