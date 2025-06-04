import { prisma } from "@/lib/prisma"
import { ArtifactType, MessageRole } from "@prisma/client"

// Frontend types (matching the interfaces from components)
export interface MessageType {
  role: "user" | "assistant" | "thinking" | "tool" | "tool-result"
  content: string
  toolName?: string
  imageUrl?: string
  id?: string
  toolResultId?: string
  toolCallId?: string
  artifactId?: string
  thinkingContent?: string
  isError?: boolean
  isIncomplete?: boolean // For messages that were aborted/interrupted
}

export interface ToolResult {
  id: string
  toolName: string
  args: any
  result: any
  timestamp: number // Keep as number for frontend compatibility
  displayName: string
}

export interface ArtifactItem {
  id: string
  name: string
  content: string
  timestamp: number // Keep as number for frontend compatibility
}

export interface ConversationType {
  id: string
  title: string
  timestamp: number
}

// Database service class
export class ConversationService {
  // Convert frontend MessageRole to Prisma MessageRole
  private static mapMessageRole(role: string): MessageRole {
    switch (role) {
      case "user": return MessageRole.USER
      case "assistant": return MessageRole.ASSISTANT
      case "thinking": return MessageRole.THINKING
      case "tool": return MessageRole.TOOL
      case "tool-result": return MessageRole.TOOL_RESULT
      default: return MessageRole.USER
    }
  }

  // Convert Prisma MessageRole to frontend string
  private static mapMessageRoleToFrontend(role: MessageRole): "user" | "assistant" | "thinking" | "tool" | "tool-result" {
    switch (role) {
      case MessageRole.USER: return "user"
      case MessageRole.ASSISTANT: return "assistant"
      case MessageRole.THINKING: return "thinking"
      case MessageRole.TOOL: return "tool"
      case MessageRole.TOOL_RESULT: return "tool-result"
      default: return "user"
    }
  }

  // Create a new conversation
  static async createConversation(
    userId?: string,
    sessionId?: string,
    title?: string
  ) {
    try {
      let finalSessionId = null;

      // If sessionId is provided, ensure a session record exists in the database
      if (sessionId) {
        try {
          // First, try to find an existing session by sessionId
          let session = await prisma.session.findUnique({
            where: { sessionId: sessionId }
          });

          // If no session exists, create one
          if (!session) {
            session = await prisma.session.create({
              data: {
                sessionId: sessionId,
                userId: userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              }
            });
          }

          // Use the database session ID (not the sessionId field) for the foreign key
          finalSessionId = session.id;
        } catch (sessionError) {
          console.warn("Warning: Failed to create/find session, creating conversation without session reference:", sessionError);
          // Continue without session reference rather than failing completely
          finalSessionId = null;
        }
      }

      return await prisma.conversation.create({
        data: {
          title: title || "New Conversation",
          userId,
          sessionId: finalSessionId,
        },
      })
    } catch (error) {
      console.error("Error creating conversation:", error)
      throw new Error("Failed to create conversation")
    }
  }

  // Get all conversations for a user or session
  static async getConversations(userId?: string, sessionId?: string): Promise<ConversationType[]> {
    try {
      // Build the where clause
      const whereClause: any = {
        OR: []
      };

      // Add userId condition if provided
      if (userId) {
        whereClause.OR.push({ userId: userId });
      }

      // Add sessionId condition if provided
      if (sessionId) {
        // First find the session by sessionId to get its database ID
        const session = await prisma.session.findUnique({
          where: { sessionId: sessionId }
        });

        if (session) {
          whereClause.OR.push({ sessionId: session.id });
        }
      }

      // If no conditions were added, return empty array
      if (whereClause.OR.length === 0) {
        return [];
      }

      const conversations = await prisma.conversation.findMany({
        where: whereClause,
        orderBy: {
          updatedAt: 'desc'
        },
        take: 50 // Limit to last 50 conversations
      })

      return conversations.map(conv => ({
        id: conv.id,
        title: conv.title || "Untitled Conversation",
        timestamp: conv.updatedAt.getTime()
      }))
    } catch (error) {
      console.error("Error fetching conversations:", error)
      throw new Error("Failed to fetch conversations")
    }
  }

  // Get a specific conversation with all its data
  static async getConversationById(conversationId: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              artifacts: true,
              toolCalls: true
            }
          }
        }
      })

      if (!conversation) {
        throw new Error("Conversation not found")
      }

      // Convert to frontend format
      const messages: MessageType[] = conversation.messages.map(msg => ({
        id: msg.id,
        role: this.mapMessageRoleToFrontend(msg.role),
        content: msg.content,
        toolName: msg.toolName || undefined,
        imageUrl: msg.imageUrl || undefined,
        toolResultId: msg.toolResultId || undefined,
        toolCallId: msg.toolCallId || undefined,
        artifactId: msg.artifactId || undefined,
        thinkingContent: msg.thinkingContent || undefined,
        isError: msg.isError
      }))

      // Get artifacts for this conversation - convert bigint timestamp to number
      const artifacts: ArtifactItem[] = conversation.messages
        .flatMap(msg => msg.artifacts)
        .map(artifact => ({
          id: artifact.id,
          name: artifact.name,
          content: artifact.content,
          timestamp: Number(artifact.timestamp) // Convert bigint to number for frontend
        }))

      // Get tool results for this conversation
      const toolResults: ToolResult[] = await this.getToolResults(conversationId)

      return {
        conversation,
        messages,
        artifacts,
        toolResults
      }
    } catch (error) {
      console.error("Error fetching conversation:", error)
      throw new Error("Failed to fetch conversation")
    }
  }

  // Save messages to database
  static async saveMessage(
    conversationId: string,
    message: MessageType
  ) {
    try {
      return await prisma.message.create({
        data: {
          ...(message.id && { id: message.id }), // Preserve frontend-generated ID if provided
          conversationId,
          role: this.mapMessageRole(message.role),
          content: message.content,
          toolName: message.toolName,
          imageUrl: message.imageUrl,
          toolResultId: message.toolResultId,
          toolCallId: message.toolCallId,
          // Don't save artifactId and thinkingContent - these are only for streaming UI
          isError: message.isError || false,
          isIncomplete: message.isIncomplete || false
        }
      })
    } catch (error) {
      console.error("Error saving message:", error)
      throw new Error("Failed to save message")
    }
  }

  // Save or update message (with ID-based upsert logic)
  static async saveOrUpdateMessage(
    conversationId: string,
    message: MessageType
  ) {
    try {
      if (message.id) {
        // Try to update existing message
        try {
          return await prisma.message.update({
            where: { id: message.id },
            data: {
              content: message.content,
              toolName: message.toolName,
              imageUrl: message.imageUrl,
              toolResultId: message.toolResultId,
              toolCallId: message.toolCallId,
              // Don't save artifactId and thinkingContent - these are only for streaming UI
              isError: message.isError || false,
              isIncomplete: message.isIncomplete || false
            }
          })
        } catch (updateError) {
          // If update fails (message doesn't exist), create new one
          return await this.saveMessage(conversationId, message)
        }
      } else {
        // Create new message
        return await this.saveMessage(conversationId, message)
      }
    } catch (error) {
      console.error("Error saving or updating message:", error)
      throw new Error("Failed to save or update message")
    }
  }

  // Save user message immediately
  static async saveUserMessage(
    conversationId: string,
    content: string,
    messageId?: string
  ) {
    try {
      const message: MessageType = {
        id: messageId,
        role: "user",
        content: content
      }

      const savedMessage = await this.saveOrUpdateMessage(conversationId, message)

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })

      return savedMessage
    } catch (error) {
      console.error("Error saving user message:", error)
      throw new Error("Failed to save user message")
    }
  }

  // Save assistant message (for streaming updates)
  static async saveAssistantMessage(
    conversationId: string,
    content: string,
    messageId?: string,
    artifactId?: string,
    options?: {
      toolName?: string
      imageUrl?: string
      toolResultId?: string
      toolCallId?: string
      isError?: boolean
    }
  ) {
    try {
      const message: MessageType = {
        id: messageId,
        role: "assistant",
        content: content,
        artifactId,
        ...options
      }

      const savedMessage = await this.saveOrUpdateMessage(conversationId, message)

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })

      return savedMessage
    } catch (error) {
      console.error("Error saving assistant message:", error)
      throw new Error("Failed to save assistant message")
    }
  }

  // Save incomplete assistant message (when aborted/interrupted)
  static async saveIncompleteMessage(
    conversationId: string,
    content: string,
    messageId?: string,
    options?: {
      toolName?: string
      imageUrl?: string
      toolResultId?: string
      toolCallId?: string
      isError?: boolean
    }
  ) {
    try {
      const message: MessageType = {
        id: messageId,
        role: "assistant",
        content: content,
        isIncomplete: true,
        ...options
      }

      const savedMessage = await this.saveOrUpdateMessage(conversationId, message)

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })

      return savedMessage
    } catch (error) {
      console.error("Error saving incomplete message:", error)
      throw new Error("Failed to save incomplete message")
    }
  }

  // Save multiple messages in a transaction
  static async saveMessages(
    conversationId: string,
    messages: MessageType[]
  ) {
    try {
      const messageData = messages.map(message => ({
        conversationId,
        role: this.mapMessageRole(message.role),
        content: message.content,
        toolName: message.toolName,
        imageUrl: message.imageUrl,
        toolResultId: message.toolResultId,
        toolCallId: message.toolCallId,
        // Don't save artifactId and thinkingContent - these are only for streaming UI
        isError: message.isError || false
      }))

      return await prisma.message.createMany({
        data: messageData
      })
    } catch (error) {
      console.error("Error saving messages:", error)
      throw new Error("Failed to save messages")
    }
  }

  // Save artifact to database
  static async saveArtifact(
    artifact: ArtifactItem,
    messageId?: string,
    userId?: string
  ) {
    try {
      const savedArtifact = await prisma.artifact.create({
        data: {
          ...(artifact.id && { id: artifact.id }), // Preserve frontend-generated ID if provided
          name: artifact.name,
          content: artifact.content,
          timestamp: BigInt(artifact.timestamp), // Convert number to bigint for database
          type: ArtifactType.HTML, // Default to HTML
          messageId,
          userId
        }
      })

      // Convert BigInt back to number for API response
      return {
        ...savedArtifact,
        timestamp: Number(savedArtifact.timestamp)
      }
    } catch (error) {
      console.error("Error saving artifact:", error)
      throw new Error("Failed to save artifact")
    }
  }

  // Save tool result to database
  static async saveToolResult(
    toolResult: ToolResult
  ) {
    try {
      const savedToolResult = await prisma.toolResult.create({
        data: {
          ...(toolResult.id && { id: toolResult.id }), // Preserve frontend-generated ID if provided
          toolName: toolResult.toolName,
          args: toolResult.args,
          result: toolResult.result,
          displayName: toolResult.displayName,
          timestamp: BigInt(toolResult.timestamp) // Convert number to bigint for database
        }
      })

      // Convert BigInt back to number for API response
      return {
        ...savedToolResult,
        timestamp: Number(savedToolResult.timestamp)
      }
    } catch (error) {
      console.error("Error saving tool result:", error)
      throw new Error("Failed to save tool result")
    }
  }

  // Update tool result
  static async updateToolResult(
    toolResultId: string,
    updates: Partial<ToolResult>
  ) {
    try {
      const updatedToolResult = await prisma.toolResult.update({
        where: { id: toolResultId },
        data: {
          ...(updates.toolName && { toolName: updates.toolName }),
          ...(updates.args && { args: updates.args }),
          ...(updates.result && { result: updates.result }),
          ...(updates.displayName && { displayName: updates.displayName }),
          ...(updates.timestamp && { timestamp: BigInt(updates.timestamp) }) // Convert number to bigint for database
        }
      })

      // Convert BigInt back to number for API response
      return {
        ...updatedToolResult,
        timestamp: Number(updatedToolResult.timestamp)
      }
    } catch (error) {
      console.error("Error updating tool result:", error)
      throw new Error("Failed to update tool result")
    }
  }

  // Update artifact
  static async updateArtifact(
    artifactId: string,
    updates: Partial<ArtifactItem>
  ) {
    try {
      const updatedArtifact = await prisma.artifact.update({
        where: { id: artifactId },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.content && { content: updates.content }),
          ...(updates.timestamp && { timestamp: BigInt(updates.timestamp) }) // Convert number to bigint for database
        }
      })

      // Convert BigInt back to number for API response
      return {
        ...updatedArtifact,
        timestamp: Number(updatedArtifact.timestamp)
      }
    } catch (error) {
      console.error("Error updating artifact:", error)
      throw new Error("Failed to update artifact")
    }
  }

  // Update conversation title
  static async updateConversationTitle(
    conversationId: string,
    title: string
  ) {
    try {
      console.log("🏷️ updateConversationTitle: Starting title update", {
        conversationId: conversationId,
        newTitle: title,
        titleLength: title.length
      })

      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          title,
          updatedAt: new Date()
        }
      })

      console.log("✅ updateConversationTitle: Successfully updated conversation title", {
        conversationId: conversationId,
        oldTitle: "not tracked", // We don't have the old title in this context
        newTitle: updatedConversation.title,
        updatedAt: updatedConversation.updatedAt
      })

      return updatedConversation
    } catch (error) {
      console.error("❌ updateConversationTitle: Error updating conversation title:", {
        conversationId: conversationId,
        newTitle: title,
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw new Error("Failed to update conversation title")
    }
  }

  // Delete conversation and all related data
  static async deleteConversation(conversationId: string) {
    try {
      // The cascade deletes will handle messages, artifacts, etc.
      return await prisma.conversation.delete({
        where: { id: conversationId }
      })
    } catch (error) {
      console.error("Error deleting conversation:", error)
      throw new Error("Failed to delete conversation")
    }
  }

  // Get tool results for a conversation
  static async getToolResults(conversationId: string): Promise<ToolResult[]> {
    try {
      // Since tool results don't have direct conversation relationship,
      // we'll get them through messages
      const messages = await prisma.message.findMany({
        where: { conversationId },
        select: { toolResultId: true }
      })

      const toolResultIds = messages
        .map(msg => msg.toolResultId)
        .filter(Boolean) as string[]

      if (toolResultIds.length === 0) {
        return []
      }

      const toolResults = await prisma.toolResult.findMany({
        where: {
          id: { in: toolResultIds }
        }
      })

      return toolResults.map(tr => ({
        id: tr.id,
        toolName: tr.toolName,
        args: tr.args,
        result: tr.result,
        displayName: tr.displayName,
        timestamp: Number(tr.timestamp) // Convert bigint to number for frontend
      }))
    } catch (error) {
      console.error("Error fetching tool results:", error)
      throw new Error("Failed to fetch tool results")
    }
  }

  // Generate conversation title from first user message
  static generateConversationTitle(messages: MessageType[]): string {
    const firstUserMessage = messages.find(msg => msg.role === "user")
    if (!firstUserMessage) {
      return "New Conversation"
    }

    // Return the full title without truncation - truncation will be handled at display time
    const title = firstUserMessage.content.trim()
    return title
  }

  // Generate conversation title using AI based on the first user message
  static async generateAITitle(messages: MessageType[]): Promise<string> {
    try {
      // Import and call the AI function from ai.ts
      const { generateAITitle } = await import("@/lib/ai")

      // Convert MessageType[] to the format expected by ai.ts
      const aiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      return await generateAITitle(aiMessages)
    } catch (error) {
      console.error("❌ ConversationService.generateAITitle: Error calling AI function:", error)

      // Fallback to simple text-based title
      return this.generateConversationTitle(messages)
    }
  }

  // Update conversation timestamp (replaces the complex syncConversationState)
  static async updateConversationTimestamp(conversationId: string) {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
      console.log("💾 Updated conversation timestamp:", conversationId)
    } catch (error) {
      console.warn("⚠️ Failed to update conversation timestamp:", error)
      // Don't throw - this shouldn't break the user experience
    }
  }

  // Clean up conversations with invalid session references
  static async cleanupInvalidSessionReferences() {
    try {
      // Find conversations that have sessionId values that don't exist in the sessions table
      const conversationsWithInvalidSessions = await prisma.conversation.findMany({
        where: {
          sessionId: {
            not: null
          },
          session: null // This will find conversations where the sessionId doesn't reference a valid session
        }
      });

      if (conversationsWithInvalidSessions.length > 0) {
        console.log(`Found ${conversationsWithInvalidSessions.length} conversations with invalid session references. Cleaning up...`);

        // Set sessionId to null for these conversations
        await prisma.conversation.updateMany({
          where: {
            id: {
              in: conversationsWithInvalidSessions.map(conv => conv.id)
            }
          },
          data: {
            sessionId: null
          }
        });

        console.log(`Cleaned up ${conversationsWithInvalidSessions.length} conversations with invalid session references.`);
      }

      return conversationsWithInvalidSessions.length;
    } catch (error) {
      console.error("Error cleaning up invalid session references:", error);
      return 0;
    }
  }

  // Save tool message immediately
  static async saveToolMessage(
    conversationId: string,
    content: string,
    toolName: string,
    messageId?: string,
    options?: {
      toolCallId?: string
    }
  ) {
    try {
      const message: MessageType = {
        id: messageId,
        role: "tool",
        content: content,
        toolName: toolName,
        toolCallId: options?.toolCallId
      }

      const savedMessage = await this.saveOrUpdateMessage(conversationId, message)

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })

      return savedMessage
    } catch (error) {
      console.error("Error saving tool message:", error)
      throw new Error("Failed to save tool message")
    }
  }

  // Update tool message with result ID
  static async updateToolMessageWithResult(
    toolCallId: string,
    toolResultId: string
  ) {
    try {
      const updatedMessage = await prisma.message.updateMany({
        where: { toolCallId: toolCallId },
        data: { toolResultId: toolResultId }
      })

      return updatedMessage
    } catch (error) {
      console.error("Error updating tool message with result:", error)
      throw new Error("Failed to update tool message with result")
    }
  }

  // Share an artifact by making it public and setting a slug
  static async shareArtifact(artifactId: string, slug: string) {
    try {
      console.log("🔍 Attempting to share artifact:", { artifactId, slug })

      // First check if the artifact exists
      const existingArtifact = await prisma.artifact.findUnique({
        where: { id: artifactId }
      })

      console.log("🔍 Artifact lookup result:", existingArtifact ? {
        id: existingArtifact.id,
        name: existingArtifact.name,
        exists: true
      } : { exists: false })

      if (!existingArtifact) {
        throw new Error(`Artifact with ID ${artifactId} not found`)
      }

      // Update the artifact to be public with a slug
      const sharedArtifact = await prisma.artifact.update({
        where: { id: artifactId },
        data: {
          isPublic: true,
          shareSlug: slug
        }
      })

      console.log("✅ Successfully shared artifact:", {
        id: sharedArtifact.id,
        slug: sharedArtifact.shareSlug
      })

      return {
        id: sharedArtifact.id,
        name: sharedArtifact.name,
        content: sharedArtifact.content,
        slug: sharedArtifact.shareSlug,
        createdAt: sharedArtifact.createdAt.toISOString(),
        timestamp: Number(sharedArtifact.timestamp)
      }
    } catch (error) {
      console.error("Error sharing artifact:", error)
      throw new Error("Failed to share artifact")
    }
  }

  // Get an artifact by its slug (for public sharing)
  static async getArtifactBySlug(slug: string) {
    try {
      const artifact = await prisma.artifact.findUnique({
        where: {
          shareSlug: slug,
          isPublic: true // Only return public artifacts
        }
      })

      if (!artifact) {
        return null
      }

      return {
        id: artifact.id,
        name: artifact.name,
        content: artifact.content,
        slug: artifact.shareSlug,
        createdAt: artifact.createdAt.toISOString(),
        timestamp: Number(artifact.timestamp)
      }
    } catch (error) {
      console.error("Error fetching artifact by slug:", error)
      throw new Error("Failed to fetch artifact")
    }
  }

  // Increment artifact view count
  static async incrementArtifactViews(artifactId: string) {
    try {
      // Increment view count using Prisma
      const artifact = await prisma.artifact.update({
        where: { id: artifactId },
        data: {
          views: {
            increment: 1
          }
        },
        select: {
          id: true,
          views: true,
          userId: true
        }
      });

      // Check if we reached a view milestone and award bonus credits
      if (artifact && artifact.userId) {
        const { CreditService } = await import('./credit-service');
        await CreditService.processViewMilestone(
          artifact.userId,
          'artifact',
          artifactId,
          artifact.views
        );
      }

      return artifact;
    } catch (error) {
      console.error("Error incrementing artifact views:", error)
      // Don't throw - this shouldn't break the user experience
    }
  }

  // Make an artifact private (unshare)
  static async unshareArtifact(artifactId: string) {
    try {
      const artifact = await prisma.artifact.update({
        where: { id: artifactId },
        data: {
          isPublic: false,
          shareSlug: null
        }
      })

      return {
        id: artifact.id,
        name: artifact.name,
        isPublic: artifact.isPublic,
        slug: artifact.shareSlug
      }
    } catch (error) {
      console.error("Error unsharing artifact:", error)
      throw new Error("Failed to unshare artifact")
    }
  }
} 
