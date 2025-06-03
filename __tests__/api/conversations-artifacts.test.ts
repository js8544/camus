import { POST, PUT } from '@/app/api/conversations/[id]/artifacts/route'
import { ConversationService } from '@/lib/db/conversation-service'
import { ArtifactType } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db/conversation-service', () => ({
  ConversationService: {
    saveArtifact: jest.fn(),
    updateArtifact: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockConversationService = ConversationService as jest.Mocked<typeof ConversationService>

describe('/api/conversations/[id]/artifacts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/conversations/[id]/artifacts', () => {
    it('should save an artifact', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockArtifact = {
        id: 'artifact-1',
        name: 'Test HTML Page',
        content: '<html><body>Hello World</body></html>',
        timestamp: Date.now(),
      }

      const mockSavedArtifact = {
        ...mockArtifact,
        type: ArtifactType.HTML,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        messageId: 'msg-1',
        description: null,
        metadata: {},
        isPublic: false,
        views: 0,
        timestamp: BigInt(Date.now()),
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.saveArtifact.mockResolvedValue(mockSavedArtifact)

      const requestBody = {
        artifact: mockArtifact,
        messageId: 'msg-1',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/artifacts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(mockConversationService.saveArtifact).toHaveBeenCalledWith(
        mockArtifact,
        'msg-1',
        'user-1'
      )
      expect(response.status).toBe(200)
      expect(data.artifact.id).toBe('artifact-1')
      expect(data.artifact.name).toBe('Test HTML Page')
    })

    it('should save an artifact without messageId', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockArtifact = {
        id: 'artifact-2',
        name: 'Another Page',
        content: '<html><body>Test</body></html>',
        timestamp: Date.now(),
      }

      const mockSavedArtifact = {
        ...mockArtifact,
        type: ArtifactType.HTML,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        messageId: null,
        description: null,
        metadata: {},
        isPublic: false,
        views: 0,
        timestamp: BigInt(Date.now()),
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.saveArtifact.mockResolvedValue(mockSavedArtifact)

      const requestBody = {
        artifact: mockArtifact,
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/artifacts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(mockConversationService.saveArtifact).toHaveBeenCalledWith(
        mockArtifact,
        undefined,
        'user-1'
      )
      expect(response.status).toBe(200)
      expect(data.artifact.id).toBe('artifact-2')
    })

    it('should require conversation ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations//artifacts', {
        method: 'POST',
        body: JSON.stringify({ artifact: { name: 'test', content: '<html></html>' } }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Conversation ID is required')
    })

    it('should require valid artifact', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/artifacts', {
        method: 'POST',
        body: JSON.stringify({ artifact: { name: 'test' } }), // missing content
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Artifact with name and content is required')
    })

    it('should handle save errors', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.saveArtifact.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        artifact: {
          id: 'artifact-1',
          name: 'Test',
          content: '<html></html>',
          timestamp: Date.now(),
        },
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/artifacts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save artifact')
    })
  })

  describe('PUT /api/conversations/[id]/artifacts', () => {
    it('should update an artifact', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      const mockUpdatedArtifact = {
        id: 'artifact-1',
        name: 'Updated HTML Page',
        content: '<html><body>Updated Content</body></html>',
        timestamp: Date.now(),
        type: ArtifactType.HTML,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        messageId: 'msg-1',
        description: null,
        metadata: {},
        isPublic: false,
        views: 0,
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockConversationService.updateArtifact.mockResolvedValue(mockUpdatedArtifact)

      const requestBody = {
        artifactId: 'artifact-1',
        name: 'Updated HTML Page',
        content: '<html><body>Updated Content</body></html>',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/artifacts', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(mockConversationService.updateArtifact).toHaveBeenCalledWith(
        'artifact-1',
        { name: 'Updated HTML Page', content: '<html><body>Updated Content</body></html>' }
      )
      expect(response.status).toBe(200)
      expect(data.artifact.id).toBe('artifact-1')
      expect(data.artifact.name).toBe('Updated HTML Page')
    })

    it('should require conversation ID and artifact ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/artifacts', {
        method: 'PUT',
        body: JSON.stringify({ name: 'test' }), // missing artifactId
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Conversation ID and artifact ID are required')
    })

    it('should handle update errors', async () => {
      mockGetServerSession.mockResolvedValue(null)
      mockConversationService.updateArtifact.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        artifactId: 'artifact-1',
        name: 'Updated Name',
      }

      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/artifacts', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'conv-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update artifact')
    })
  })
}) 
