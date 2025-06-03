import { GET, POST } from '@/app/api/conversations/route'
import { ConversationService } from '@/lib/db/conversation-service'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db/conversation-service', () => ({
  ConversationService: {
    getConversations: jest.fn(),
    createConversation: jest.fn(),
    syncConversationState: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockConversationService = ConversationService as jest.Mocked<typeof ConversationService>

describe('/api/conversations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/conversations', () => {
    it('should fetch conversations for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockConversations = [
        { id: 'conv-1', title: 'Test Conversation', timestamp: Date.now() },
        { id: 'conv-2', title: 'Another Conversation', timestamp: Date.now() },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.getConversations.mockResolvedValue(mockConversations)

      const request = new NextRequest('http://localhost:3000/api/conversations')
      const response = await GET(request)
      const data = await response.json()

      expect(mockConversationService.getConversations).toHaveBeenCalledWith('user-1', undefined)
      expect(response.status).toBe(200)
      expect(data.conversations).toEqual(mockConversations)
    })

    it('should fetch conversations with sessionId for anonymous users', async () => {
      const mockConversations = [
        { id: 'conv-1', title: 'Anonymous Conversation', timestamp: Date.now() },
      ]

      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.getConversations.mockResolvedValue(mockConversations)

      const request = new NextRequest('http://localhost:3000/api/conversations?sessionId=session-123')
      const response = await GET(request)
      const data = await response.json()

      expect(mockConversationService.getConversations).toHaveBeenCalledWith(undefined, 'session-123')
      expect(response.status).toBe(200)
      expect(data.conversations).toEqual(mockConversations)
    })

    it('should handle service errors', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.getConversations.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/conversations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch conversations')
    })
  })

  describe('POST /api/conversations', () => {
    it('should create a new conversation for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockConversation = {
        id: 'conv-1',
        title: 'New Conversation',
        userId: 'user-1',
        sessionId: null,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.createConversation.mockResolvedValue(mockConversation)

      const requestBody = {
        title: 'New Conversation',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockConversationService.createConversation).toHaveBeenCalledWith(
        'user-1',
        undefined,
        'New Conversation'
      )
      expect(response.status).toBe(200)
      expect(data.conversation).toEqual({
        ...mockConversation,
        createdAt: mockConversation.createdAt.toISOString(),
        updatedAt: mockConversation.updatedAt.toISOString()
      })
    })

    it('should create a conversation with sessionId for anonymous users', async () => {
      const mockConversation = {
        id: 'conv-1',
        title: 'Anonymous Conversation',
        userId: null,
        sessionId: 'session-123',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.createConversation.mockResolvedValue(mockConversation)

      const requestBody = {
        title: 'Anonymous Conversation',
        sessionId: 'session-123',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockConversationService.createConversation).toHaveBeenCalledWith(
        undefined,
        'session-123',
        'Anonymous Conversation'
      )
      expect(response.status).toBe(200)
      expect(data.conversation).toEqual({
        ...mockConversation,
        createdAt: mockConversation.createdAt.toISOString(),
        updatedAt: mockConversation.updatedAt.toISOString()
      })
    })

    it('should handle creation errors', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.createConversation.mockRejectedValue(new Error('Creation failed'))

      const requestBody = {
        title: 'Test Conversation',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create conversation')
    })
  })
}) 
