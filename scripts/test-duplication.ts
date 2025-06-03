import { ConversationService } from '@/lib/db/conversation-service'
import { prisma } from '@/lib/prisma'

async function testMessageDuplication() {
  console.log('🧪 Testing message duplication...')

  try {
    // Create a test conversation
    const conversation = await ConversationService.createConversation(
      'test-user',
      'test-session',
      'Duplication Test Conversation'
    )

    console.log(`📝 Created conversation: ${conversation.id}`)

    const testMessage = 'This is a test message that might get duplicated'
    const messageId = `test-msg-${Date.now()}`

    console.log('💾 Simulating multiple saves of the same message...')

    // Count messages before
    const beforeCount = await prisma.message.count({
      where: { conversationId: conversation.id }
    })
    console.log(`📊 Messages before saves: ${beforeCount}`)

    // Simulate the race condition: multiple saves happening simultaneously
    // This mimics what happens when both backend and frontend try to save
    await Promise.all([
      ConversationService.saveUserMessage(conversation.id, testMessage, messageId),
      ConversationService.saveUserMessage(conversation.id, testMessage, messageId),
      ConversationService.saveOrUpdateMessage(conversation.id, {
        id: messageId,
        role: 'user',
        content: testMessage
      })
    ])

    // Count messages after
    const afterCount = await prisma.message.count({
      where: { conversationId: conversation.id }
    })
    console.log(`📊 Messages after saves: ${afterCount}`)

    // Check for duplicates
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        content: testMessage
      },
      select: {
        id: true,
        content: true,
        createdAt: true
      }
    })

    console.log(`🔍 Found ${messages.length} messages with same content:`)
    messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ID: ${msg.id}, Created: ${msg.createdAt.toISOString()}`)
    })

    if (messages.length > 1) {
      console.log('❌ DUPLICATION DETECTED! Multiple messages with same content found.')
      console.log('🐛 This confirms the bug exists.')
    } else {
      console.log('✅ No duplicates found - upsert logic working correctly.')
    }

    // Cleanup
    await prisma.message.deleteMany({
      where: { conversationId: conversation.id }
    })
    await prisma.conversation.delete({
      where: { id: conversation.id }
    })

    console.log('🧹 Cleaned up test data')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testMessageDuplication().catch(console.error) 
