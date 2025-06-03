import { authOptions } from '@/lib/auth'
import { ConversationService } from '@/lib/db/conversation-service'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: conversationId } = await params
    const body = await request.json()
    const { content, role, messageId, isIncomplete, ...options } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    if (!content || !role) {
      return NextResponse.json(
        { error: 'Content and role are required' },
        { status: 400 }
      )
    }

    let savedMessage

    if (role === 'user') {
      savedMessage = await ConversationService.saveUserMessage(
        conversationId,
        content,
        messageId
      )
    } else if (role === 'assistant') {
      if (isIncomplete) {
        // Save as incomplete message
        savedMessage = await ConversationService.saveIncompleteMessage(
          conversationId,
          content,
          messageId,
          options
        )
      } else {
        savedMessage = await ConversationService.saveAssistantMessage(
          conversationId,
          content,
          messageId,
          options
        )
      }
    } else {
      // For other message types, use the general save method
      savedMessage = await ConversationService.saveOrUpdateMessage(
        conversationId,
        { id: messageId, role, content, isIncomplete, ...options }
      )
    }

    return NextResponse.json({ message: savedMessage })
  } catch (error) {
    console.error('Error saving message:', error)
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: conversationId } = await params
    const body = await request.json()
    const { messageId, content, ...options } = body

    if (!conversationId || !messageId) {
      return NextResponse.json(
        { error: 'Conversation ID and message ID are required' },
        { status: 400 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Update existing message
    const updatedMessage = await ConversationService.saveOrUpdateMessage(
      conversationId,
      { id: messageId, content, ...options }
    )

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
} 
