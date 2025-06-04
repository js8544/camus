import { authOptions } from '@/lib/auth'
import { ConversationService } from '@/lib/db/conversation-service'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    // Get conversations for user or session
    const conversations = await ConversationService.getConversations(
      session?.user?.id,
      sessionId || undefined
    )

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { title, sessionId, message } = body

    // Create new conversation with the provided title
    const conversation = await ConversationService.createConversation(
      session?.user?.id,
      sessionId,
      title || "New Conversation"
    )

    // If we have a first message but no specific title provided, generate an AI title
    if (message && !title) {
      // Generate AI title in the background
      ConversationService.generateAITitle([
        { role: 'user', content: message }
      ]).then(async (aiTitle: string) => {
        if (aiTitle) {
          await ConversationService.updateConversationTitle(conversation.id, aiTitle)
          console.log("🤖 API Route: Updated new conversation with AI-generated title", {
            conversationId: conversation.id,
            title: aiTitle
          })
        }
      }).catch((titleError: any) => {
        console.error("⚠️ API Route: Failed to generate AI title", {
          conversationId: conversation.id,
          error: titleError instanceof Error ? titleError.message : String(titleError),
          errorName: titleError instanceof Error ? titleError.name : 'Unknown',
          stack: titleError instanceof Error ? titleError.stack : undefined
        })
      })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

// REMOVED: PUT endpoint for bulk sync - we now save incrementally during streaming
// export async function PUT(request: NextRequest) { ... } 
