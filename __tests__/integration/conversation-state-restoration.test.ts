import { ConversationService } from '@/lib/db/conversation-service';

// Mock Prisma client inline
jest.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
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
  }
}))

// Import the mocked prisma for test access
import { prisma } from '@/lib/prisma';

// Cast to the proper Jest mock type
const mockPrisma = {
  conversation: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  message: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
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
}

  // Override the prisma methods with our jest mocks
  ; (prisma as any).conversation = mockPrisma.conversation
  ; (prisma as any).message = mockPrisma.message
  ; (prisma as any).artifact = mockPrisma.artifact
  ; (prisma as any).toolResult = mockPrisma.toolResult

describe('Conversation State Restoration Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should preserve all state elements when saving and loading a conversation', async () => {
    const conversationId = 'test-conv-123'
    const userId = 'user-123'

    // Test data that represents a complete conversation state
    // Note: thinkingContent and artifactId are only for streaming UI and not persisted to database
    const testMessages = [
      {
        id: 'user-msg-1',
        role: 'user' as const,
        content: 'Create a simple HTML page',
      },
      {
        id: 'assistant-msg-1',
        role: 'assistant' as const,
        content: 'I\'ll create that for you.',
        thinkingContent: 'Let me think about this request...', // Only exists during streaming
        artifactId: 'artifact-1', // Only exists during streaming
      },
      {
        id: 'tool-msg-1',
        role: 'tool' as const,
        content: 'Starting web search...',
        toolName: 'webSearch',
        toolCallId: 'call-123',
        toolResultId: 'result-1',
      },
    ]

    const testArtifacts = [
      {
        id: 'artifact-1',
        name: 'Simple HTML Page',
        content: '<html><body><h1>Hello World</h1></body></html>',
        timestamp: Date.now(),
      },
    ]

    const testToolResults = [
      {
        id: 'result-1',
        toolName: 'webSearch',
        args: { query: 'HTML examples' },
        result: { data: 'search results...' },
        timestamp: Date.now(),
        displayName: 'Search: HTML examples',
      },
    ]

    // Mock successful saves
    // For new messages, update should fail (message doesn't exist) and then create should succeed
    mockPrisma.message.update.mockRejectedValue(new Error('Message not found'))
    mockPrisma.message.create.mockResolvedValue({
      id: 'user-msg-1',
      conversationId,
      role: 'USER',
      content: 'Create a simple HTML page',
    })

    mockPrisma.conversation.update.mockResolvedValue({
      id: conversationId,
      title: 'Test Conversation',
      updatedAt: new Date(),
    })

    mockPrisma.artifact.create.mockResolvedValue({
      id: 'artifact-1',
      name: 'Simple HTML Page',
      content: '<html><body><h1>Hello World</h1></body></html>',
      timestamp: Date.now(),
      type: 'HTML',
    })

    mockPrisma.toolResult.create.mockResolvedValue({
      id: 'result-1',
      toolName: 'webSearch',
      args: { query: 'HTML examples' },
      result: { data: 'search results...' },
      timestamp: Date.now(),
      displayName: 'Search: HTML examples',
    })

    // Mock conversation loading
    mockPrisma.conversation.findUnique.mockResolvedValue({
      id: conversationId,
      title: 'Test Conversation',
      messages: [
        {
          id: 'user-msg-1',
          role: 'USER',
          content: 'Create a simple HTML page',
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
        {
          id: 'assistant-msg-1',
          role: 'ASSISTANT',
          content: 'I\'ll create that for you.',
          toolName: null,
          imageUrl: null,
          toolResultId: null,
          toolCallId: null,
          artifactId: null,
          thinkingContent: null,
          isError: false,
          artifacts: [
            {
              id: 'artifact-1',
              name: 'Simple HTML Page',
              content: '<html><body><h1>Hello World</h1></body></html>',
              timestamp: Date.now(),
              type: 'HTML',
            }
          ],
          toolCalls: [],
        },
        {
          id: 'tool-msg-1',
          role: 'TOOL',
          content: 'Starting web search...',
          toolName: 'webSearch',
          imageUrl: null,
          toolResultId: 'result-1',
          toolCallId: 'call-123',
          artifactId: null,
          thinkingContent: null,
          isError: false,
          artifacts: [],
          toolCalls: [],
        },
      ],
    })

    // Mock the messages query for getToolResults
    mockPrisma.message.findMany.mockResolvedValue([
      { toolResultId: 'result-1' },
      { toolResultId: null },
      { toolResultId: null },
    ])

    mockPrisma.toolResult.findMany.mockResolvedValue([
      {
        id: 'result-1',
        toolName: 'webSearch',
        args: { query: 'HTML examples' },
        result: { data: 'search results...' },
        timestamp: Date.now(),
        displayName: 'Search: HTML examples',
      },
    ])

    // Step 1: Save all components immediately (as would happen during streaming)
    const savedUser = await ConversationService.saveUserMessage(
      conversationId,
      testMessages[0].content,
      testMessages[0].id
    )

    const savedAssistant = await ConversationService.saveAssistantMessage(
      conversationId,
      testMessages[1].content,
      testMessages[1].id
    )

    const savedArtifact = await ConversationService.saveArtifact(
      testArtifacts[0],
      testMessages[1].id,
      userId
    )

    const savedToolResult = await ConversationService.saveToolResult(testToolResults[0])

    // Step 2: Load the conversation (as would happen on page refresh)
    const loadedConversation = await ConversationService.getConversationById(conversationId)

    // Step 3: Verify all state is preserved
    expect(loadedConversation.messages).toHaveLength(3)
    expect(loadedConversation.artifacts).toHaveLength(1)
    expect(loadedConversation.toolResults).toHaveLength(1)

    // Verify message content and metadata
    const loadedUserMessage = loadedConversation.messages.find(m => m.id === 'user-msg-1')
    expect(loadedUserMessage).toBeDefined()
    expect(loadedUserMessage?.content).toBe('Create a simple HTML page')
    expect(loadedUserMessage?.role).toBe('user')

    const loadedAssistantMessage = loadedConversation.messages.find(m => m.id === 'assistant-msg-1')
    expect(loadedAssistantMessage).toBeDefined()
    expect(loadedAssistantMessage?.content).toBe('I\'ll create that for you.')
    expect(loadedAssistantMessage?.thinkingContent).toBeUndefined()
    expect(loadedAssistantMessage?.artifactId).toBeUndefined()

    const loadedToolMessage = loadedConversation.messages.find(m => m.id === 'tool-msg-1')
    expect(loadedToolMessage).toBeDefined()
    expect(loadedToolMessage?.toolName).toBe('webSearch')
    expect(loadedToolMessage?.toolResultId).toBe('result-1')

    // Verify artifact
    const loadedArtifact = loadedConversation.artifacts.find(a => a.id === 'artifact-1')
    expect(loadedArtifact).toBeDefined()
    expect(loadedArtifact?.name).toBe('Simple HTML Page')
    expect(loadedArtifact?.content).toBe('<html><body><h1>Hello World</h1></body></html>')

    // Verify tool result
    const loadedToolResult = loadedConversation.toolResults.find(tr => tr.id === 'result-1')
    expect(loadedToolResult).toBeDefined()
    expect(loadedToolResult?.toolName).toBe('webSearch')
    expect(loadedToolResult?.displayName).toBe('Search: HTML examples')

    // Verify the database calls were made with preserved IDs
    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'user-msg-1', // Frontend ID should be preserved
        content: 'Create a simple HTML page',
      }),
    })

    expect(mockPrisma.artifact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'artifact-1', // Frontend ID should be preserved
        name: 'Simple HTML Page',
      }),
    })

    expect(mockPrisma.toolResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'result-1', // Frontend ID should be preserved
        toolName: 'webSearch',
      }),
    })
  })
}) 
