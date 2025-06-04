import { ConversationService } from "@/lib/db/conversation-service"
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
    const sharedConversation = await prisma.conversation.findUnique({
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
    await prisma.conversation.update({
      where: { id: sharedConversation.id },
      data: {
        views: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      id: sharedConversation.id,
      shareId: shareId,
      title: conversationData.conversation.title,
      messages: conversationData.messages,
      artifacts: conversationData.artifacts,
      toolResults: conversationData.toolResults,
      createdAt: sharedConversation.createdAt.toISOString(),
      views: sharedConversation.views + 1
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
