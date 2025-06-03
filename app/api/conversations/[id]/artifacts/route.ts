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
    const { artifact, messageId } = body

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    if (!artifact || !artifact.name || !artifact.content) {
      return NextResponse.json(
        { error: 'Artifact with name and content is required' },
        { status: 400 }
      )
    }

    // Save artifact immediately
    const savedArtifact = await ConversationService.saveArtifact(
      artifact,
      messageId,
      session?.user?.id
    )

    return NextResponse.json({ artifact: serializeBigInt(savedArtifact) })
  } catch (error) {
    console.error('Error saving artifact:', error)
    return NextResponse.json(
      { error: 'Failed to save artifact' },
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
    const { artifactId, ...updates } = body

    if (!conversationId || !artifactId) {
      return NextResponse.json(
        { error: 'Conversation ID and artifact ID are required' },
        { status: 400 }
      )
    }

    // Update artifact
    const updatedArtifact = await ConversationService.updateArtifact(
      artifactId,
      updates
    )

    return NextResponse.json({ artifact: serializeBigInt(updatedArtifact) })
  } catch (error) {
    console.error('Error updating artifact:', error)
    return NextResponse.json(
      { error: 'Failed to update artifact' },
      { status: 500 }
    )
  }
} 
