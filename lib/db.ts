import { ArtifactType, MessageRole, ToolStatus } from '@prisma/client'
import { prisma } from './prisma'

// Session Management
export async function createSession(userId?: string) {
  const sessionId = crypto.randomUUID()

  return await prisma.session.create({
    data: {
      sessionId,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })
}

export async function getSession(sessionId: string) {
  return await prisma.session.findUnique({
    where: { sessionId },
    include: {
      user: true,
      conversations: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
      },
    },
  })
}

// Conversation Management
export async function createConversation(sessionId: string, title: string = "New Conversation") {
  const session = await getSession(sessionId)

  return await prisma.conversation.create({
    data: {
      title,
      sessionId: session?.id,
      userId: session?.userId,
    },
  })
}

export async function getConversation(conversationId: string) {
  return await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          ToolCall: true,
          Artifact: true,
        },
      },
    },
  })
}

export async function updateConversationTitle(conversationId: string, title: string) {
  return await prisma.conversation.update({
    where: { id: conversationId },
    data: { title, updatedAt: new Date() },
  })
}

// Message Management
export async function createMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata?: any
) {
  return await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      metadata,
    },
  })
}

export async function getConversationMessages(conversationId: string) {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      ToolCall: true,
      Artifact: true,
    },
  })
}

// Tool Call Management
export async function createToolCall(
  messageId: string,
  toolName: string,
  input: any
) {
  return await prisma.toolCall.create({
    data: {
      messageId,
      toolName,
      input,
      status: 'PENDING',
    },
  })
}

export async function updateToolCall(
  toolCallId: string,
  output?: any,
  status?: ToolStatus,
  duration?: number,
  error?: string
) {
  return await prisma.toolCall.update({
    where: { id: toolCallId },
    data: {
      output,
      status,
      duration,
      error,
      updatedAt: new Date(),
    },
  })
}

// Artifact Management
export async function createArtifact(
  name: string,
  type: ArtifactType,
  content: string,
  conversationId?: string,
  userId?: string,
  description?: string,
  metadata?: any
) {
  return await prisma.artifact.create({
    data: {
      name,
      description,
      type,
      content,
      conversationId,
      userId,
      metadata,
      timestamp: BigInt(Date.now()),
    },
  })
}

export async function getArtifact(artifactId: string) {
  return await prisma.artifact.findUnique({
    where: { id: artifactId },
    include: {
      versions: {
        orderBy: { version: 'desc' },
      },
      tags: {
        include: { tag: true },
      },
      conversation: true,
      user: true,
    },
  })
}

export async function incrementArtifactViews(artifactId: string) {
  return await prisma.artifact.update({
    where: { id: artifactId },
    data: {
      views: {
        increment: 1,
      },
    },
  })
}

export async function getPublicArtifacts(limit: number = 20, offset: number = 0) {
  return await prisma.artifact.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      tags: {
        include: { tag: true },
      },
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })
}

// Analytics
export async function logEvent(
  event: string,
  userId?: string,
  sessionId?: string,
  conversationId?: string,
  artifactId?: string,
  metadata?: any
) {
  return await prisma.analytics.create({
    data: {
      event,
      userId,
      sessionId,
      conversationId,
      artifactId,
      metadata,
    },
  })
}

// User Management
export async function createUser(email: string, name?: string, avatar?: string) {
  return await prisma.user.create({
    data: {
      email,
      name,
      avatar,
    },
  })
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      conversations: {
        orderBy: { updatedAt: 'desc' },
        take: 10,
      },
      artifacts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
}

// Tag Management
export async function createTag(name: string, color?: string) {
  return await prisma.tag.create({
    data: {
      name,
      color,
    },
  })
}

export async function getTags() {
  return await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function addTagToArtifact(artifactId: string, tagId: string) {
  return await prisma.artifactTag.create({
    data: {
      artifactId,
      tagId,
    },
  })
} 
