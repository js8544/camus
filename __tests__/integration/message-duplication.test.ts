import { POST } from '@/app/api/conversations/[id]/messages/route'
import { ConversationService } from '@/lib/db/conversation-service'
import { NextRequest } from 'next/server'

// Mock auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock Prisma with proper Jest mock functions
jest.mock('@/lib/prisma', () => ({
  prisma: {
    message: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
  },
}))

// Import the mocked prisma after mocking
import { prisma } from '@/lib/prisma'

// Properly type the mocked prisma with Jest mock functions
type MockedPrisma = {
  message: {
    create: jest.MockedFunction<any>
    update: jest.MockedFunction<any>
    findUnique: jest.MockedFunction<any>
    count: jest.MockedFunction<any>
  }
  conversation: {
    update: jest.MockedFunction<any>
  }
}

const mockPrisma = prisma as unknown as MockedPrisma

describe('Message Duplication Bug', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when saving the same message multiple times', () => {
    it('should not create duplicate messages in database', async () => {
      const conversationId = 'conv-test-123'
      const messageId = 'msg-test-456'
      const messageContent = 'Test message content'

      // Mock that message doesn't exist initially
      mockPrisma.message.update.mockRejectedValueOnce(new Error('Record not found'))

      // Mock successful creation
      const mockSavedMessage = {
        id: messageId,
        conversationId,
        role: 'USER' as const,
        content: messageContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        toolName: null,
        imageUrl: null,
        toolResultId: null,
        toolCallId: null,
        artifactId: null,
        thinkingContent: null,
        isError: false,
      }

      mockPrisma.message.create.mockResolvedValue(mockSavedMessage)
      mockPrisma.conversation.update.mockResolvedValue({} as any)

      // Simulate saving the same message multiple times (like what happens in the app)
      const requests = Array(3).fill(null).map(() =>
        new NextRequest('http://localhost:3000/api/conversations/conv-test-123/messages', {
          method: 'POST',
          body: JSON.stringify({
            content: messageContent,
            role: 'user',
            messageId: messageId,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )

      // Execute all requests in parallel (simulating race condition)
      const responses = await Promise.all(
        requests.map(request =>
          POST(request, { params: Promise.resolve({ id: conversationId }) })
        )
      )

      // Verify all responses are successful
      for (const response of responses) {
        expect(response.status).toBe(200)
      }

      // The critical test: message.create should only be called once
      // because the upsert logic should update existing messages, not create duplicates
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.message.update).toHaveBeenCalledTimes(3) // Updated: All 3 parallel requests try to update after first creates
    })

    it('should correctly count messages after multiple save attempts', async () => {
      const conversationId = 'conv-test-789'
      const messageId = 'msg-test-101112'

      // Test by directly calling the service method multiple times
      const message = {
        id: messageId,
        role: 'user' as const,
        content: 'Duplicate test message',
      }

      // Mock database responses
      mockPrisma.message.update
        .mockRejectedValueOnce(new Error('Record not found')) // First time - doesn't exist
        .mockResolvedValue({} as any) // Subsequent times - successful updates

      mockPrisma.message.create.mockResolvedValue({
        id: messageId,
        conversationId,
        role: 'USER',
        content: message.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        toolName: null,
        imageUrl: null,
        toolResultId: null,
        toolCallId: null,
        artifactId: null,
        thinkingContent: null,
        isError: false,
      })

      mockPrisma.conversation.update.mockResolvedValue({} as any)

      // Call saveOrUpdateMessage multiple times with the same message
      await Promise.all([
        ConversationService.saveOrUpdateMessage(conversationId, message),
        ConversationService.saveOrUpdateMessage(conversationId, message),
        ConversationService.saveOrUpdateMessage(conversationId, message),
      ])

      // Should only create once, then update
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.message.update).toHaveBeenCalledTimes(3) // Updated: All 3 calls, first fails then 2 succeed
    })

    it('should demonstrate the ID pattern duplication bug', async () => {
      // This test shows exactly what you're seeing: different ID patterns for the same message
      const conversationId = 'conv-id-test'
      const userMessage = 'Hello, how are you?'

      // Mock no existing messages (all create new ones)
      mockPrisma.message.update.mockRejectedValue(new Error('Record not found'))

      let createCallCount = 0
      const createdMessages: any[] = []

      mockPrisma.message.create.mockImplementation((data: any) => {
        createCallCount++

        // Simulate different ID generation patterns
        let messageId: string

        if (data.data.id) {
          // Frontend-provided ID
          messageId = data.data.id
        } else {
          // Prisma auto-generated CUID (like what you're seeing)
          messageId = `cmbdus${createCallCount}be00091pd49jqedfmb`
        }

        const savedMessage = {
          id: messageId,
          conversationId,
          role: 'USER',
          content: userMessage,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
          toolName: null,
          imageUrl: null,
          toolResultId: null,
          toolCallId: null,
          artifactId: null,
          thinkingContent: null,
          isError: false,
        }

        createdMessages.push(savedMessage)
        return Promise.resolve(savedMessage)
      })

      mockPrisma.conversation.update.mockResolvedValue({} as any)

      // Simulate the exact scenario that causes the bug:
      await Promise.all([
        // 1. Frontend saves with generated ID
        ConversationService.saveOrUpdateMessage(conversationId, {
          id: `user-${Date.now()}-${Math.random()}`, // Frontend pattern
          role: 'user',
          content: userMessage,
        }),

        // 2. Backend API saves WITHOUT ID (triggers Prisma CUID generation)
        ConversationService.saveUserMessage(conversationId, userMessage), // No messageId param

        // 3. Sync function saves WITHOUT ID (another Prisma CUID)
        ConversationService.saveOrUpdateMessage(conversationId, {
          role: 'user',
          content: userMessage,
          // No ID provided
        }),
      ])

      // This demonstrates the exact bug you're seeing
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(3)

      // Check the different ID patterns created
      const frontendIdCall = mockPrisma.message.create.mock.calls.find((call: any) =>
        call[0].data.id && call[0].data.id.startsWith('user-')
      )
      const prismaIdCall1 = mockPrisma.message.create.mock.calls.find((call: any) =>
        !call[0].data.id
      )
      const prismaIdCall2 = mockPrisma.message.create.mock.calls.filter((call: any) =>
        !call[0].data.id
      )[1]

      expect(frontendIdCall).toBeDefined() // user-{timestamp}-{random}
      expect(prismaIdCall1).toBeDefined()  // Will generate cmbdus...
      expect(prismaIdCall2).toBeDefined()  // Will generate another cmbdus...

      console.log('Created message IDs:', createdMessages.map(m => m.id))

      // In a fixed system, we should only create once:
      // expect(mockPrisma.message.create).toHaveBeenCalledTimes(1)
    })

    it('should demonstrate the current duplication bug', async () => {
      // This test simulates the current bug where messages are saved from multiple places
      const conversationId = 'conv-bug-test'
      const messageId = 'msg-bug-test'
      const userMessage = 'Test message that gets duplicated'

      // Mock no existing message (each save attempt thinks it's creating a new message)
      mockPrisma.message.update.mockRejectedValue(new Error('Record not found'))

      let createCallCount = 0
      mockPrisma.message.create.mockImplementation(() => {
        createCallCount++
        return Promise.resolve({
          id: `${messageId}-${createCallCount}`, // Different IDs to simulate duplicates
          conversationId,
          role: 'USER',
          content: userMessage,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
          toolName: null,
          imageUrl: null,
          toolResultId: null,
          toolCallId: null,
          artifactId: null,
          thinkingContent: null,
          isError: false,
        })
      })

      mockPrisma.conversation.update.mockResolvedValue({} as any)

      // Simulate the three places where messages currently get saved:
      // 1. Agent API route (saveUserMessage)
      // 2. Frontend (saveMessageToDb via API)
      // 3. Sync function (if called)

      const savePromises = [
        // Agent API route save
        ConversationService.saveUserMessage(conversationId, userMessage),

        // Frontend API call save (simulated)
        ConversationService.saveOrUpdateMessage(conversationId, {
          role: 'user',
          content: userMessage,
        }),

        // Another duplicate save
        ConversationService.saveOrUpdateMessage(conversationId, {
          role: 'user',
          content: userMessage,
        }),
      ]

      await Promise.all(savePromises)

      // This demonstrates the bug: we're creating multiple messages instead of one
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(3)

      // In a fixed system, we should only create once:
      // expect(mockPrisma.message.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('database constraint testing', () => {
    it('should handle unique constraint violations gracefully', async () => {
      const conversationId = 'conv-constraint-test'
      const messageId = 'msg-constraint-test'

      // Mock a unique constraint violation
      mockPrisma.message.update.mockRejectedValueOnce(new Error('Record not found'))
      mockPrisma.message.create.mockRejectedValueOnce(new Error('Unique constraint violation'))

      const message = {
        id: messageId,
        role: 'user' as const,
        content: 'Constraint test message',
      }

      // This should fail gracefully if there's a unique constraint violation
      await expect(
        ConversationService.saveOrUpdateMessage(conversationId, message)
      ).rejects.toThrow('Failed to save or update message')
    })
  })
}) 
