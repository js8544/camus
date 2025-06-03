import { POST, PUT } from '@/app/api/conversations/[id]/messages/route'
import { ConversationService } from '@/lib/db/conversation-service'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db/conversation-service', () => ({
  ConversationService: {
    saveUserMessage: jest.fn(),
    saveAssistantMessage: jest.fn(),
    saveOrUpdateMessage: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockConversationService = ConversationService as jest.Mocked<typeof ConversationService>

describe('/api/conversations/[id]/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/conversations/[id]/messages', () => {
    it('should save a user message', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockSavedMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'USER' as const,
        content: 'Hello world',
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

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.saveUserMessage.mockResolvedValue(mockSavedMessage)

      const requestBody = {
        content: 'Hello world',
        role: 'user',
        messageId: 'msg-1',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(mockConversationService.saveUserMessage).toHaveBeenCalledWith(
        'conv-1',
        'Hello world',
        'msg-1'
      )
      expect(response.status).toBe(200)
      expect(data.message.id).toBe('msg-1')
      expect(data.message.content).toBe('Hello world')
    })

    it('should save an assistant message', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockSavedMessage = {
        id: 'msg-2',
        conversationId: 'conv-1',
        role: 'ASSISTANT' as const,
        content: 'Hello there!',
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

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.saveAssistantMessage.mockResolvedValue(mockSavedMessage)

      const requestBody = {
        content: 'Hello there!',
        role: 'assistant',
        messageId: 'msg-2',
        thinkingContent: 'Let me think...',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(mockConversationService.saveAssistantMessage).toHaveBeenCalledWith(
        'conv-1',
        'Hello there!',
        'msg-2',
        { thinkingContent: 'Let me think...' }
      )
      expect(response.status).toBe(200)
      expect(data.message.id).toBe('msg-2')
      expect(data.message.content).toBe('Hello there!')
    })

    it('should require conversation ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations//messages', {
        method: 'POST',
        body: JSON.stringify({ content: 'test', role: 'user' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Conversation ID is required')
    })

    it('should require content and role', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'POST',
        body: JSON.stringify({ content: 'test' }), // missing role
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Content and role are required')
    })

    it('should handle save errors', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.saveUserMessage.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        content: 'Hello world',
        role: 'user',
        messageId: 'msg-1',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save message')
    })
  })

  describe('PUT /api/conversations/[id]/messages', () => {
    it('should update an existing message', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockUpdatedMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'ASSISTANT' as const,
        content: 'Updated content',
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

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.saveOrUpdateMessage.mockResolvedValue(mockUpdatedMessage)

      const requestBody = {
        messageId: 'msg-1',
        content: 'Updated content',
        thinkingContent: 'Updated thinking...',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(mockConversationService.saveOrUpdateMessage).toHaveBeenCalledWith(
        'conv-1',
        { id: 'msg-1', content: 'Updated content', thinkingContent: 'Updated thinking...' }
      )
      expect(response.status).toBe(200)
      expect(data.message.id).toBe('msg-1')
      expect(data.message.content).toBe('Updated content')
    })

    it('should require conversation ID and message ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'PUT',
        body: JSON.stringify({ content: 'test' }), // missing messageId
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Conversation ID and message ID are required')
    })

    it('should require content', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'PUT',
        body: JSON.stringify({ messageId: 'msg-1' }), // missing content
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Content is required')
    })

    it('should handle update errors', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.saveOrUpdateMessage.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        messageId: 'msg-1',
        content: 'Updated content',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update message')
    })
  })
}) 
