import { ArtifactItem, ConversationService, MessageType, ToolResult } from '@/lib/db/conversation-service';
import { prisma } from '@/lib/prisma';
import { ArtifactType, MessageRole } from '@prisma/client';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    artifact: {
      create: jest.fn(),
      upsert: jest.fn(),
    },
    toolResult: {
      create: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const mockPrisma = {
  conversation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  message: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
  artifact: {
    create: jest.fn(),
    upsert: jest.fn(),
  },
  toolResult: {
    create: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
}

  // Override the prisma methods with our jest mocks
  ; (prisma as any).conversation = mockPrisma.conversation
  ; (prisma as any).message = mockPrisma.message
  ; (prisma as any).artifact = mockPrisma.artifact
  ; (prisma as any).toolResult = mockPrisma.toolResult
  ; (prisma as any).$transaction = mockPrisma.$transaction

describe('ConversationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createConversation', () => {
    it('should create a new conversation with default title', async () => {
      const mockConversation = {
        id: 'conv-1',
        title: 'New Conversation',
        userId: 'user-1',
        sessionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.conversation.create.mockResolvedValue(mockConversation)

      const result = await ConversationService.createConversation('user-1')

      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          title: 'New Conversation',
          userId: 'user-1',
          sessionId: null,
        },
      })
      expect(result).toEqual(mockConversation)
    })

    it('should create a conversation with custom title', async () => {
      const mockConversation = {
        id: 'conv-1',
        title: 'Custom Title',
        userId: 'user-1',
        sessionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.conversation.create.mockResolvedValue(mockConversation)

      const result = await ConversationService.createConversation('user-1', undefined, 'Custom Title')

      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          title: 'Custom Title',
          userId: 'user-1',
          sessionId: null,
        },
      })
      expect(result).toEqual(mockConversation)
    })

    it('should handle database errors', async () => {
      mockPrisma.conversation.create.mockRejectedValue(new Error('Database error'))

      await expect(ConversationService.createConversation('user-1')).rejects.toThrow('Failed to create conversation')
    })
  })

  describe('getConversations', () => {
    it('should fetch conversations for a user', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          title: 'Test Conversation',
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'conv-2',
          title: null,
          updatedAt: new Date('2024-01-02'),
        },
      ]

      mockPrisma.conversation.findMany.mockResolvedValue(mockConversations)

      const result = await ConversationService.getConversations('user-1')

      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: 'user-1' },
          ]
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 50
      })

      expect(result).toEqual([
        {
          id: 'conv-1',
          title: 'Test Conversation',
          timestamp: new Date('2024-01-01').getTime(),
        },
        {
          id: 'conv-2',
          title: 'Untitled Conversation',
          timestamp: new Date('2024-01-02').getTime(),
        },
      ])
    })

    it('should handle database errors', async () => {
      mockPrisma.conversation.findMany.mockRejectedValue(new Error('Database error'))

      await expect(ConversationService.getConversations('user-1')).rejects.toThrow('Failed to fetch conversations')
    })
  })

  describe('saveMessage', () => {
    it('should save a message to database', async () => {
      const message: MessageType = {
        role: 'user',
        content: 'Test message',
        toolName: 'web-search',
        isError: false,
      }

      const mockSavedMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: MessageRole.USER,
        content: 'Test message',
        toolName: 'web-search',
        isError: false,
        createdAt: new Date(),
      }

      mockPrisma.message.create.mockResolvedValue(mockSavedMessage)

      const result = await ConversationService.saveMessage('conv-1', message)

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-1',
          role: MessageRole.USER,
          content: 'Test message',
          toolName: 'web-search',
          imageUrl: undefined,
          toolResultId: undefined,
          toolCallId: undefined,
          isError: false,
          isIncomplete: false,
        },
      })
      expect(result).toEqual(mockSavedMessage)
    })

    it('should handle database errors', async () => {
      const message: MessageType = {
        role: 'user',
        content: 'Test message',
      }

      mockPrisma.message.create.mockRejectedValue(new Error('Database error'))

      await expect(ConversationService.saveMessage('conv-1', message)).rejects.toThrow('Failed to save message')
    })
  })

  describe('saveArtifact', () => {
    it('should save an artifact to database', async () => {
      const artifact: ArtifactItem = {
        id: 'artifact-1',
        name: 'Test Artifact',
        content: '<html>test</html>',
        timestamp: Date.now(),
      }

      const mockSavedArtifact = {
        id: 'artifact-1',
        name: 'Test Artifact',
        content: '<html>test</html>',
        timestamp: artifact.timestamp,
        type: ArtifactType.HTML,
        createdAt: new Date(),
      }

      mockPrisma.artifact.create.mockResolvedValue(mockSavedArtifact)

      const result = await ConversationService.saveArtifact(artifact, 'msg-1', 'user-1')

      expect(mockPrisma.artifact.create).toHaveBeenCalledWith({
        data: {
          id: 'artifact-1',
          name: 'Test Artifact',
          content: '<html>test</html>',
          timestamp: expect.any(BigInt),
          type: ArtifactType.HTML,
          messageId: 'msg-1',
          userId: 'user-1',
        },
      })
      expect(result).toEqual(mockSavedArtifact)
    })
  })

  describe('saveToolResult', () => {
    it('should save a tool result to database', async () => {
      const toolResult: ToolResult = {
        id: 'tool-1',
        toolName: 'webSearch',
        args: { query: 'test' },
        result: { results: [] },
        displayName: 'Web Search',
        timestamp: Date.now(),
      }

      const mockSavedToolResult = {
        id: 'tool-1',
        toolName: 'webSearch',
        args: { query: 'test' },
        result: { results: [] },
        displayName: 'Web Search',
        timestamp: toolResult.timestamp,
        createdAt: new Date(),
      }

      mockPrisma.toolResult.create.mockResolvedValue(mockSavedToolResult)

      const result = await ConversationService.saveToolResult(toolResult)

      expect(mockPrisma.toolResult.create).toHaveBeenCalledWith({
        data: {
          id: 'tool-1',
          toolName: 'webSearch',
          args: { query: 'test' },
          result: { results: [] },
          displayName: 'Web Search',
          timestamp: expect.any(BigInt),
        },
      })
      expect(result).toEqual(mockSavedToolResult)
    })
  })

  describe('generateConversationTitle', () => {
    it('should generate title from first user message', () => {
      const messages: MessageType[] = [
        { role: 'assistant', content: 'Hello!' },
        { role: 'user', content: 'Create a website for my business' },
        { role: 'assistant', content: 'Sure!' },
      ]

      const title = ConversationService.generateConversationTitle(messages)
      expect(title).toBe('Create a website for my business')
    })

    it('should truncate long messages', () => {
      const longMessage = 'This is a very long message that exceeds fifty characters and should be truncated'
      const messages: MessageType[] = [
        { role: 'user', content: longMessage },
      ]

      const title = ConversationService.generateConversationTitle(messages)
      expect(title).toBe('This is a very long message that exceeds fifty cha...')
    })

    it('should return default title when no user messages', () => {
      const messages: MessageType[] = [
        { role: 'assistant', content: 'Hello!' },
      ]

      const title = ConversationService.generateConversationTitle(messages)
      expect(title).toBe('New Conversation')
    })
  })

  describe('updateConversationTitle', () => {
    it('should update conversation title', async () => {
      const conversationId = 'conv-1'
      const newTitle = 'Updated Title'

      const mockUpdatedConversation = {
        id: conversationId,
        title: newTitle,
        updatedAt: new Date()
      }

      mockPrisma.conversation.update.mockResolvedValue(mockUpdatedConversation)

      const result = await ConversationService.updateConversationTitle(conversationId, newTitle)

      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: {
          title: newTitle,
          updatedAt: expect.any(Date)
        }
      })
      expect(result).toEqual(mockUpdatedConversation)
    })

    it('should handle update title errors', async () => {
      mockPrisma.conversation.update.mockRejectedValue(new Error('Update failed'))

      await expect(
        ConversationService.updateConversationTitle('conv-1', 'New Title')
      ).rejects.toThrow('Failed to update conversation title')
    })
  })

  describe('deleteConversation', () => {
    it('should delete conversation', async () => {
      const conversationId = 'conv-1'
      const deletedConversation = { id: conversationId }

      mockPrisma.conversation.delete.mockResolvedValue(deletedConversation)

      const result = await ConversationService.deleteConversation(conversationId)

      expect(mockPrisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: conversationId }
      })
      expect(result).toEqual(deletedConversation)
    })

    it('should handle delete errors', async () => {
      mockPrisma.conversation.delete.mockRejectedValue(new Error('Delete failed'))

      await expect(
        ConversationService.deleteConversation('conv-1')
      ).rejects.toThrow('Failed to delete conversation')
    })
  })

  describe('getConversationById', () => {
    it('should fetch conversation with all related data', async () => {
      const mockConversation = {
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [
          {
            id: 'msg-1',
            role: MessageRole.USER,
            content: 'Test message',
            toolName: null,
            imageUrl: null,
            toolResultId: null,
            toolCallId: null,
            artifactId: null,
            thinkingContent: null,
            isError: false,
            artifacts: [],
            toolCalls: [],
          },
        ],
      }

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation)

      // Mock the getToolResults queries
      mockPrisma.message.findMany.mockResolvedValue([
        { toolResultId: null },
      ])
      mockPrisma.toolResult.findMany.mockResolvedValue([])

      const result = await ConversationService.getConversationById('conv-1')

      expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              artifacts: true,
              toolCalls: true,
            },
          },
        },
      })

      expect(result.conversation).toEqual(mockConversation)
      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].role).toBe('user')
    })

    it('should throw error when conversation not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null)

      await expect(ConversationService.getConversationById('conv-1')).rejects.toThrow('Failed to fetch conversation')
    })
  })
}) 
