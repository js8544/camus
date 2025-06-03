import { ConversationService } from '@/lib/db/conversation-service'

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
    conversation: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    artifact: {
      create: jest.fn(),
    },
    toolResult: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

// Import the mocked prisma after mocking
import { prisma } from '@/lib/prisma'

// Properly type the mocked prisma with Jest mock functions
type MockedPrisma = {
  conversation: {
    create: jest.MockedFunction<any>
    update: jest.MockedFunction<any>
    findUnique: jest.MockedFunction<any>
    findMany: jest.MockedFunction<any>
  }
  message: {
    create: jest.MockedFunction<any>
    update: jest.MockedFunction<any>
    findMany: jest.MockedFunction<any>
    createMany: jest.MockedFunction<any>
  }
  artifact: {
    create: jest.MockedFunction<any>
  }
  toolResult: {
    create: jest.MockedFunction<any>
    findMany: jest.MockedFunction<any>
  }
}

const mockPrisma = prisma as unknown as MockedPrisma

describe('Incremental Saving Architecture', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Individual Saving Methods', () => {
    it('should save user message immediately', async () => {
      const conversationId = 'conv-123'
      const messageContent = 'Hello AI!'
      const messageId = 'user-msg-123'

      // Mock the database responses
      // Since saveOrUpdateMessage tries to update first when ID is provided, then falls back to create
      mockPrisma.message.update.mockRejectedValueOnce(new Error('Message not found'))
      mockPrisma.message.create.mockResolvedValue({
        id: messageId,
        conversationId,
        role: 'USER',
        content: messageContent,
        createdAt: new Date(),
      })

      mockPrisma.conversation.update.mockResolvedValue({
        id: conversationId,
        updatedAt: new Date(),
      })

      // Save user message
      const result = await ConversationService.saveUserMessage(
        conversationId,
        messageContent,
        messageId
      )

      // Verify update was tried first (since ID was provided)
      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          content: messageContent,
          toolName: undefined,
          imageUrl: undefined,
          toolResultId: undefined,
          toolCallId: undefined,
          isError: false,
          isIncomplete: false
        }
      })

      // Verify message was created when update failed
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          id: messageId,
          conversationId,
          role: 'USER',
          content: messageContent,
          toolName: undefined,
          imageUrl: undefined,
          toolResultId: undefined,
          toolCallId: undefined,
          isError: false,
          isIncomplete: false
        }
      })

      // Verify conversation timestamp was updated
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { updatedAt: expect.any(Date) }
      })

      expect(result).toBeDefined()
    })

    it('should save tool result immediately', async () => {
      const toolResult = {
        id: 'tool-result-123',
        toolName: 'webSearch',
        args: { query: 'test search' },
        result: { results: ['result 1', 'result 2'] },
        displayName: 'Web Search: test search',
        timestamp: Date.now()
      }

      mockPrisma.toolResult.create.mockResolvedValue({
        ...toolResult,
        createdAt: new Date(),
      })

      // Save tool result
      const result = await ConversationService.saveToolResult(toolResult)

      // Verify tool result was saved immediately
      expect(mockPrisma.toolResult.create).toHaveBeenCalledWith({
        data: {
          id: toolResult.id,
          toolName: toolResult.toolName,
          args: toolResult.args,
          result: toolResult.result,
          displayName: toolResult.displayName,
          timestamp: expect.any(BigInt)
        }
      })

      expect(result).toBeDefined()
    })

    it('should save artifact immediately', async () => {
      const artifact = {
        id: 'artifact-123',
        name: 'Generated Page',
        content: '<html><body>Test</body></html>',
        timestamp: Date.now()
      }
      const messageId = 'assistant-msg-123'
      const userId = 'user-1'

      mockPrisma.artifact.create.mockResolvedValue({
        ...artifact,
        type: 'HTML',
        messageId,
        userId,
        createdAt: new Date(),
      })

      // Save artifact
      const result = await ConversationService.saveArtifact(artifact, messageId, userId)

      // Verify artifact was saved immediately
      expect(mockPrisma.artifact.create).toHaveBeenCalledWith({
        data: {
          id: artifact.id,
          name: artifact.name,
          content: artifact.content,
          timestamp: expect.any(BigInt),
          type: 'HTML',
          messageId,
          userId
        }
      })

      expect(result).toBeDefined()
    })

    it('should save assistant message immediately', async () => {
      const conversationId = 'conv-123'
      const messageContent = 'Here is my response...'
      const messageId = 'assistant-msg-123'
      const options = {
        isError: false
        // artifactId and thinkingContent are no longer saved to database - only for streaming UI
      }

      // Mock the upsert logic: update fails, create succeeds
      mockPrisma.message.update.mockRejectedValueOnce(new Error('Message not found'))
      mockPrisma.message.create.mockResolvedValue({
        id: messageId,
        conversationId,
        role: 'ASSISTANT',
        content: messageContent,
        isError: options.isError,
        createdAt: new Date(),
      })

      mockPrisma.conversation.update.mockResolvedValue({
        id: conversationId,
        updatedAt: new Date(),
      })

      // Save assistant message
      const result = await ConversationService.saveAssistantMessage(
        conversationId,
        messageContent,
        messageId,
        undefined, // artifactId
        options
      )

      // Verify update was tried first
      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          content: messageContent,
          toolName: undefined,
          imageUrl: undefined,
          toolResultId: undefined,
          toolCallId: undefined,
          isError: options.isError,
          isIncomplete: false
        }
      })

      // Verify message was created when update failed
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          id: messageId,
          conversationId,
          role: 'ASSISTANT',
          content: messageContent,
          toolName: undefined,
          imageUrl: undefined,
          toolResultId: undefined,
          toolCallId: undefined,
          isError: options.isError,
          isIncomplete: false
        }
      })

      // Verify conversation timestamp was updated
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { updatedAt: expect.any(Date) }
      })

      expect(result).toBeDefined()
    })
  })

  describe('Conversation Flow Simulation', () => {
    it('should save each piece incrementally during a conversation', async () => {
      const conversationId = 'conv-flow-test'
      const userMessageId = 'user-msg-flow'
      const assistantMessageId = 'assistant-msg-flow'
      const toolResultId = 'tool-result-flow'
      const artifactId = 'artifact-flow'

      // Mock all database responses for the upsert logic
      mockPrisma.message.update.mockRejectedValue(new Error('Message not found'))
      mockPrisma.message.create.mockResolvedValue({ id: 'mock-message' })
      mockPrisma.conversation.update.mockResolvedValue({ id: conversationId })
      mockPrisma.toolResult.create.mockResolvedValue({ id: toolResultId })
      mockPrisma.artifact.create.mockResolvedValue({ id: artifactId })

      // Simulate conversation flow

      // 1. User sends message → Save immediately
      await ConversationService.saveUserMessage(
        conversationId,
        'Create a webpage for me',
        userMessageId
      )

      // 2. AI uses web search tool → Save tool result immediately
      await ConversationService.saveToolResult({
        id: toolResultId,
        toolName: 'webSearch',
        args: { query: 'webpage design examples' },
        result: { results: ['example1.com', 'example2.com'] },
        displayName: 'Web Search: webpage design examples',
        timestamp: Date.now()
      })

      // 3. AI generates artifact → Save artifact immediately
      await ConversationService.saveArtifact({
        id: artifactId,
        name: 'Custom Webpage',
        content: '<html><head><title>Custom Page</title></head><body>Content</body></html>',
        timestamp: Date.now()
      }, assistantMessageId, 'user-1')

      // 4. AI completes response → Save assistant message immediately
      await ConversationService.saveAssistantMessage(
        conversationId,
        'I created a webpage for you!',
        assistantMessageId
        // No longer saving artifactId with the message - artifacts are saved separately
      )

      // Verify the order and timing of saves
      expect(mockPrisma.message.create).toHaveBeenCalledTimes(2) // User + Assistant
      expect(mockPrisma.toolResult.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.artifact.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.conversation.update).toHaveBeenCalledTimes(2) // Updated twice (user + assistant messages)

      // Verify no bulk operations were used
      expect(mockPrisma.message.createMany).not.toHaveBeenCalled()
    })

    it('should handle multiple tool results without bulk operations', async () => {
      const conversationId = 'conv-multi-tools'

      mockPrisma.toolResult.create.mockResolvedValue({ id: 'mock-tool-result' })

      // Simulate multiple tool calls
      const toolResults = [
        {
          id: 'tool-1',
          toolName: 'webSearch',
          args: { query: 'search 1' },
          result: { results: ['result1'] },
          displayName: 'Search 1',
          timestamp: Date.now()
        },
        {
          id: 'tool-2',
          toolName: 'browseWeb',
          args: { url: 'https://example.com' },
          result: { content: 'webpage content' },
          displayName: 'Browse Example',
          timestamp: Date.now()
        },
        {
          id: 'tool-3',
          toolName: 'webSearch',
          args: { query: 'search 2' },
          result: { results: ['result2'] },
          displayName: 'Search 2',
          timestamp: Date.now()
        }
      ]

      // Save each tool result individually (as they would be during streaming)
      for (const toolResult of toolResults) {
        await ConversationService.saveToolResult(toolResult)
      }

      // Verify each was saved individually
      expect(mockPrisma.toolResult.create).toHaveBeenCalledTimes(3)

      // Verify each call was individual, not bulk
      toolResults.forEach((toolResult, index) => {
        expect(mockPrisma.toolResult.create).toHaveBeenNthCalledWith(
          index + 1,
          {
            data: {
              id: toolResult.id,
              toolName: toolResult.toolName,
              args: toolResult.args,
              result: toolResult.result,
              displayName: toolResult.displayName,
              timestamp: expect.any(BigInt)
            }
          }
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle individual save failures gracefully', async () => {
      const conversationId = 'conv-error-test'

      // Mock a failure for tool result saving
      mockPrisma.toolResult.create.mockRejectedValue(new Error('Database connection failed'))

      // This should throw an error but not affect other operations
      await expect(
        ConversationService.saveToolResult({
          id: 'failing-tool',
          toolName: 'webSearch',
          args: { query: 'test' },
          result: { results: [] },
          displayName: 'Test',
          timestamp: Date.now()
        })
      ).rejects.toThrow('Failed to save tool result')

      // Other operations should still work
      mockPrisma.message.update.mockRejectedValueOnce(new Error('Message not found'))
      mockPrisma.message.create.mockResolvedValue({ id: 'user-msg' })
      mockPrisma.conversation.update.mockResolvedValue({ id: conversationId })

      const result = await ConversationService.saveUserMessage(
        conversationId,
        'This should still work',
        'user-msg-123'
      )

      expect(result).toBeDefined()
      expect(mockPrisma.message.create).toHaveBeenCalled()
    })

    it('should not lose data if one piece fails to save', async () => {
      const conversationId = 'conv-partial-failure'

      // Mock mixed success/failure responses
      mockPrisma.message.update.mockRejectedValue(new Error('Message not found'))
      mockPrisma.message.create.mockResolvedValue({ id: 'user-msg' })
      mockPrisma.conversation.update.mockResolvedValue({ id: conversationId })
      mockPrisma.toolResult.create.mockRejectedValue(new Error('Tool save failed'))
      mockPrisma.artifact.create.mockResolvedValue({ id: 'artifact-123' })

      // User message should save successfully
      await ConversationService.saveUserMessage(
        conversationId,
        'Test message',
        'user-msg-123'
      )

      // Tool result should fail
      await expect(
        ConversationService.saveToolResult({
          id: 'tool-123',
          toolName: 'webSearch',
          args: { query: 'test' },
          result: { results: [] },
          displayName: 'Test',
          timestamp: Date.now()
        })
      ).rejects.toThrow()

      // Artifact should still save successfully
      await ConversationService.saveArtifact({
        id: 'artifact-123',
        name: 'Test Artifact',
        content: '<html>Test</html>',
        timestamp: Date.now()
      })

      // Verify what was saved vs what failed
      expect(mockPrisma.message.create).toHaveBeenCalled()
      expect(mockPrisma.toolResult.create).toHaveBeenCalled()
      expect(mockPrisma.artifact.create).toHaveBeenCalled()
    })
  })

  describe('Performance Benefits', () => {
    it('should not use transactions for individual operations', async () => {
      const conversationId = 'conv-no-transaction'

      mockPrisma.message.update.mockRejectedValueOnce(new Error('Message not found'))
      mockPrisma.message.create.mockResolvedValue({ id: 'msg' })
      mockPrisma.conversation.update.mockResolvedValue({ id: conversationId })

      // Save a message
      await ConversationService.saveUserMessage(
        conversationId,
        'Test message',
        'msg-123'
      )

      // Verify no transaction was used (prisma.$transaction would be called if it was)
      // Since we're not mocking $transaction, this test passes if no transaction-related errors occur
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          content: 'Test message'
        })
      })
    })

    it('should complete quickly without waiting for bulk operations', async () => {
      mockPrisma.toolResult.create.mockResolvedValue({ id: 'tool-result' })

      const startTime = Date.now()

      // Save a single tool result
      await ConversationService.saveToolResult({
        id: 'quick-tool',
        toolName: 'webSearch',
        args: { query: 'quick test' },
        result: { results: ['quick result'] },
        displayName: 'Quick Test',
        timestamp: Date.now()
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete very quickly since it's just one operation
      expect(duration).toBeLessThan(100) // Should take less than 100ms in tests
      expect(mockPrisma.toolResult.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('Conversation Timestamp Updates', () => {
    it('should update conversation timestamp without bulk operations', async () => {
      const conversationId = 'conv-timestamp-test'

      mockPrisma.conversation.update.mockResolvedValue({
        id: conversationId,
        updatedAt: new Date(),
      })

      // Use the new lightweight timestamp update method
      await ConversationService.updateConversationTimestamp(conversationId)

      // Verify only the timestamp was updated
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { updatedAt: expect.any(Date) }
      })

      // Verify no other operations were performed
      expect(mockPrisma.message.create).not.toHaveBeenCalled()
      expect(mockPrisma.toolResult.create).not.toHaveBeenCalled()
      expect(mockPrisma.artifact.create).not.toHaveBeenCalled()
    })

    it('should not throw if timestamp update fails', async () => {
      const conversationId = 'conv-timestamp-fail'

      mockPrisma.conversation.update.mockRejectedValue(new Error('Update failed'))

      // Should not throw - just log a warning
      await expect(
        ConversationService.updateConversationTimestamp(conversationId)
      ).resolves.not.toThrow()

      expect(mockPrisma.conversation.update).toHaveBeenCalled()
    })
  })
}) 
