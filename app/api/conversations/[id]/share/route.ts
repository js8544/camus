import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: conversationId } = await params

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Generate a unique share slug
    const shareSlug = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

    // Update the conversation to make it public with a share slug
    const sharedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isPublic: true,
        shareSlug: shareSlug
      }
    })

    return NextResponse.json({
      shareId: shareSlug,
      url: `/shared/conversation/${shareSlug}`
    })
  } catch (error) {
    console.error('Error sharing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to share conversation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: conversationId } = await params

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Update the conversation to make it private
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isPublic: false,
        shareSlug: null
      }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error unsharing conversation:', error)
    return NextResponse.json(
      { error: 'Failed to unshare conversation' },
      { status: 500 }
    )
  }
} 
