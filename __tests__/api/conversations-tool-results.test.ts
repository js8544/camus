import { POST, PUT } from '@/app/api/conversations/[id]/tool-results/route'
import { ConversationService } from '@/lib/db/conversation-service'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db/conversation-service', () => ({
  ConversationService: {
    saveToolResult: jest.fn(),
    updateToolResult: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockConversationService = ConversationService as jest.Mocked<typeof ConversationService>

describe('/api/conversations/[id]/tool-results', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/conversations/[id]/tool-results', () => {
    it('should save a tool result', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockToolResult = {
        id: 'result-1',
        toolName: 'webSearch',
        args: { query: 'test' },
        result: { data: 'search results' },
        timestamp: Date.now(),
        displayName: 'Web Search: test',
      }

      const mockSavedToolResult = {
        ...mockToolResult,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.saveToolResult.mockResolvedValue(mockSavedToolResult)

      const requestBody = mockToolResult

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/tool-results', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(mockConversationService.saveToolResult).toHaveBeenCalledWith(requestBody)
      expect(response.status).toBe(200)
      expect(data.toolResult.id).toBe('result-1')
      expect(data.toolResult.toolName).toBe('webSearch')
    })

    it('should require conversation ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations//tool-results', {
        method: 'POST',
        body: JSON.stringify({ toolName: 'test', result: {} }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Conversation ID is required')
    })

    it('should handle save errors when service fails', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.saveToolResult.mockRejectedValue(new Error('Invalid tool result'))

      const requestBody = {
        toolName: 'test', // invalid/incomplete tool result
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/tool-results', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save tool result')
    })
  })

  describe('PUT /api/conversations/[id]/tool-results', () => {
    it('should update a tool result', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockUpdatedToolResult = {
        id: 'result-1',
        toolName: 'webSearch',
        args: { query: 'updated test' },
        result: { data: 'updated results' },
        timestamp: Date.now(),
        displayName: 'Updated Web Search',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.updateToolResult.mockResolvedValue(mockUpdatedToolResult)

      const requestBody = {
        toolResultId: 'result-1',
        args: { query: 'updated test' },
        result: { data: 'updated results' },
        displayName: 'Updated Web Search',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/tool-results', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(mockConversationService.updateToolResult).toHaveBeenCalledWith(
        'result-1',
        { args: { query: 'updated test' }, result: { data: 'updated results' }, displayName: 'Updated Web Search' }
      )
      expect(response.status).toBe(200)
      expect(data.toolResult.id).toBe('result-1')
      expect(data.toolResult.displayName).toBe('Updated Web Search')
    })

    it('should require conversation ID and tool result ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/tool-results', {
        method: 'PUT',
        body: JSON.stringify({ displayName: 'test' }), // missing toolResultId
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Conversation ID and tool result ID are required')
    })

    it('should handle update errors', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.updateToolResult.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        toolResultId: 'result-1',
        displayName: 'Updated Name',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/tool-results', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update tool result')
    })
  })
}) 
