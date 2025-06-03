import { serializeBigInt } from '@/lib/api-utils'
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

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    const savedToolResult = await ConversationService.saveToolResult(body)
    return NextResponse.json({ toolResult: serializeBigInt(savedToolResult) })
  } catch (error) {
    console.error('Error saving tool result:', error)
    return NextResponse.json(
      { error: 'Failed to save tool result' },
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
    const { toolResultId, ...updates } = body

    if (!conversationId || !toolResultId) {
      return NextResponse.json(
        { error: 'Conversation ID and tool result ID are required' },
        { status: 400 }
      )
    }

    const updatedToolResult = await ConversationService.updateToolResult(
      toolResultId,
      updates
    )

    return NextResponse.json({ toolResult: serializeBigInt(updatedToolResult) })
  } catch (error) {
    console.error('Error updating tool result:', error)
    return NextResponse.json(
      { error: 'Failed to update tool result' },
      { status: 500 }
    )
  }
} 
