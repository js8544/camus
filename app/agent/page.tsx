"use client"

import React from "react"

import { ChatInput } from "@/components/agent/chat-input"
import { ChatMessages } from "@/components/agent/chat-messages"
import { ChatSidebar } from "@/components/agent/chat-sidebar"
import { FullscreenModal } from "@/components/agent/fullscreen-modal"
import { ResultsPanel } from "@/components/agent/results-panel"
import { AuthGuard } from "@/components/auth-guard"
import { ShareModal } from "@/components/ShareModal"
import { Button } from "@/components/ui/button"
import { CreditMilestoneNotification } from "@/components/user/CreditMilestoneNotification"
import { useAgentChat } from "@/hooks/use-agent-chat"
import { Share2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"

function AgentPageContent() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const shouldUpdateUrl = useRef(false)
  const [shareConversationUrl, setShareConversationUrl] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Track current streaming message state for abort handling
  const currentStreamingMessageRef = useRef<{
    messageId: string
    content: string
    artifactId?: string
    thinkingContent?: string
  } | null>(null)

  // Generate session ID for anonymous users
  const [sessionId] = useState(() =>
    typeof window !== 'undefined'
      ? sessionStorage.getItem('camus-session-id') || (() => {
        const id = Date.now().toString()
        sessionStorage.setItem('camus-session-id', id)
        return id
      })()
      : null
  )

  const {
    input,
    setInput,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    generatedHtml,
    setGeneratedHtml,
    toolResults,
    setToolResults,
    artifacts,
    setArtifacts,
    currentDisplayResult,
    setCurrentDisplayResult,
    artifactViewMode,
    setArtifactViewMode,
    isFullscreen,
    setIsFullscreen,
    streamingArtifact,
    setStreamingArtifact,
    expandedThinking,
    extractHtmlTitle,
    generateUniqueArtifactName,
    generateDisplayName,
    addMessage,
    toggleThinking,
    handleMessageClick,
    resetChat,
    getToolDisplayName,
    getToolUsageMessage,
  } = useAgentChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add effect to load conversation from URL parameters on page load/refresh
  useEffect(() => {
    const conversationId = searchParams.get('c')
    if (conversationId && conversationId !== currentConversationId) {
      console.log("🔗 Loading conversation from URL:", conversationId)
      loadConversation(conversationId)
      // Update the current conversation ID and trigger sidebar refresh
      setCurrentConversationId(conversationId)
      setRefreshTrigger(prev => prev + 1)
    }
  }, [searchParams])

  const loadConversation = async (conversationId: string) => {
    try {
      console.log("🔄 Loading conversation:", conversationId)

      const response = await fetch(`/api/conversations/${conversationId}`)
      if (!response.ok) {
        throw new Error('Failed to load conversation')
      }

      const data = await response.json()
      console.log("✅ Loaded conversation data:", data)

      // Reset current state
      resetChat()

      // Set conversation ID
      setCurrentConversationId(conversationId)

      // Update URL to include conversation ID
      const url = new URL(window.location.href)
      url.searchParams.set('c', conversationId)
      router.replace(url.pathname + url.search, { scroll: false })

      // Prepare artifacts array for processing
      let allArtifacts = [...(data.artifacts || [])]

      // Load messages
      if (data.messages && data.messages.length > 0) {
        // First, process all messages to extract artifacts and thinking content
        const processedMessages = data.messages.map((message: any) => {
          // Process think and artifact blocks
          const processedMessage = processMessageBlocks(message, allArtifacts)

          // Handle tool message enhancement
          if (processedMessage.role === 'tool' && processedMessage.toolResultId && data.toolResults) {
            // Find the corresponding tool result
            const toolResult = data.toolResults.find((tr: any) => tr.id === processedMessage.toolResultId)
            if (toolResult && toolResult.args) {
              // Generate enhanced content based on tool type
              let enhancedContent = processedMessage.content
              switch (toolResult.toolName) {
                case 'webSearch':
                  if (toolResult.args.query) {
                    enhancedContent = `🔍 Searching the web for: "${toolResult.args.query}"`
                  }
                  break
                case 'browseWeb':
                  if (toolResult.args.url) {
                    enhancedContent = `🌐 Browsing: ${toolResult.args.url}`
                  }
                  break
                case 'generateImage':
                  if (toolResult.args.prompt) {
                    const prompt = toolResult.args.prompt.substring(0, 50)
                    enhancedContent = `🎨 Generating image: "${prompt}${toolResult.args.prompt.length > 50 ? '...' : ''}"`
                  }
                  break
              }

              // Return enhanced message
              return {
                ...processedMessage,
                content: enhancedContent
              }
            }
          }

          return processedMessage
        })

        setMessages(processedMessages)
        console.log("�� Processed messages with think/artifact blocks:", {
          total: processedMessages.length,
          withThinking: processedMessages.filter((m: any) => m.thinkingContent).length,
          withArtifacts: processedMessages.filter((m: any) => m.artifactId).length
        })
      }

      // Load tool results
      if (data.toolResults && data.toolResults.length > 0) {
        setToolResults(data.toolResults)
        // Set the last tool result as current display if no artifacts
        if (allArtifacts.length === 0) {
          const lastToolResult = data.toolResults[data.toolResults.length - 1]
          setCurrentDisplayResult(lastToolResult)
        }
      }

      // Load artifacts (prioritize artifacts over tool results for display)
      if (allArtifacts.length > 0) {
        setArtifacts(allArtifacts)
        // Set the last artifact as current display if available
        const lastArtifact = allArtifacts[allArtifacts.length - 1]
        setCurrentDisplayResult(lastArtifact)
        setGeneratedHtml(lastArtifact.content)
        console.log("🎭 Loaded artifacts:", {
          total: allArtifacts.length,
          lastArtifact: lastArtifact.name
        })
      }

    } catch (error) {
      console.error("❌ Error loading conversation:", error)
      throw error
    }
  }

  const handleNewChat = async () => {
    console.log("🆕 Starting new chat")
    resetChat()

    // Clear conversation ID from URL first
    const url = new URL(window.location.href)
    url.searchParams.delete('c')
    router.replace(url.pathname + url.search, { scroll: false })

    try {
      // Create a new conversation immediately
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Task',
          sessionId: sessionId
        }),
      })

      // Check for credit error (403)
      if (response.status === 403) {
        const errorData = await response.json();
        console.error("❌ Credit error:", errorData.error);

        // Add error message to the chat
        addMessage({
          role: "assistant",
          content: "Not enough credits to start a new conversation. You'll get 5 more credits tomorrow, or earn more when your shared content reaches 100 views!",
          isError: true
        });

        return; // Stop execution here
      }

      if (!response.ok) {
        throw new Error('Failed to create new conversation')
      }

      const data = await response.json()
      const newConversationId = data.conversation.id

      console.log("✅ Created new conversation:", newConversationId)

      // Set the new conversation as current
      setCurrentConversationId(newConversationId)

      // Update URL with new conversation ID
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('c', newConversationId)
      router.replace(newUrl.pathname + newUrl.search, { scroll: false })

      // Trigger sidebar refresh to show the new conversation
      setRefreshTrigger(prev => prev + 1)

    } catch (error) {
      console.error("❌ Error creating new conversation:", error)
      // Fall back to old behavior - just reset without creating conversation
      setCurrentConversationId(null)
    }
  }

  const handleStop = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)

    // Remove thinking message from UI
    setMessages(prev => prev.filter(msg => msg.role !== "thinking"))

    // Save the incomplete message state if there's streaming content
    if (currentStreamingMessageRef.current && currentConversationId) {
      try {
        const { messageId, content, artifactId, thinkingContent } = currentStreamingMessageRef.current

        // Only save if there's actual content to preserve
        if (content.trim()) {
          console.log("💾 Frontend: Saving incomplete message due to abort", {
            messageId,
            contentLength: content.length,
            hasArtifact: !!artifactId,
            hasThinking: !!thinkingContent
          })

          // Clean content for database storage - remove thinking blocks and artifact references
          let cleanedContent = content
          cleanedContent = cleanedContent.replace(/```think\n[\s\S]*?\n```/g, '').trim()
          cleanedContent = cleanedContent.replace(/```artifact\n[\s\S]*?\n```/g, '[Artifact generated]').trim()

          // Save incomplete message to database without thinking content or artifact references
          await fetch(`/api/conversations/${currentConversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messageId,
              role: 'assistant',
              content: cleanedContent,
              isIncomplete: true
            })
          })

          // Update the UI message to show it as incomplete (keep original content for UI)
          setMessages(prev =>
            prev.map(msg =>
              msg.id === messageId
                ? { ...msg, content: content.trim(), isIncomplete: true }
                : msg
            )
          )
        }
      } catch (error) {
        console.error("❌ Frontend: Failed to save incomplete message:", error)
      }
    }

    // Clear streaming state
    currentStreamingMessageRef.current = null

    // Add cancellation message
    addMessage({
      role: "assistant",
      content: "Request cancelled. Ready for your next beautifully useless request!",
      isError: false
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    console.log("🎭 Frontend: Starting request", { userMessage, currentConversationId })

    // Generate unique ID for user message
    const userMessageId = `user-${Date.now()}-${Math.random()}`

    // Add user message to UI
    addMessage({ role: "user", content: userMessage, id: userMessageId })
    setInput("")
    setIsLoading(true)

    try {
      // Show thinking state
      addMessage({ role: "thinking", content: "Analyzing request and determining the most beautifully useless approach..." })

      // Get conversation history for context
      const conversationHistory = messages.filter(msg => msg.role === "user" || msg.role === "assistant")
      console.log("📝 Frontend: Conversation history", { historyLength: conversationHistory.length })

      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
          conversationId: currentConversationId,
          sessionId,
          userMessageId
        }),
        signal: abortControllerRef.current.signal
      })

      console.log("📡 Frontend: Response received", { status: response.status, ok: response.ok })

      // Check for credit error (403)
      if (response.status === 403) {
        // Remove thinking message
        setMessages(prev => prev.filter(msg => msg.role !== "thinking"))

        const errorData = await response.json();
        console.error("❌ Credit error:", errorData.error);

        // Add error message to the chat
        addMessage({
          role: "assistant",
          content: "Not enough credits to start a new conversation. You'll get 5 more credits tomorrow, or earn more when your shared content reaches 100 views!",
          isError: true
        });

        setIsLoading(false);
        return; // Stop execution here
      }

      // Check for conversation ID in response headers
      const responseConversationId = response.headers.get('x-conversation-id')
      const finalConversationId = responseConversationId || currentConversationId

      if (responseConversationId && !currentConversationId) {
        console.log("🆔 Setting conversation ID from response:", responseConversationId)
        setCurrentConversationId(responseConversationId)
        // Trigger sidebar refresh when a new conversation is created
        setRefreshTrigger(prev => prev + 1)
      }

      // Check if this was the first message in an existing conversation (title update case)
      const isFirstMessage = currentConversationId && messages.filter(msg => msg.role === "user" || msg.role === "assistant").length === 0

      if (isFirstMessage) {
        console.log("📝 First message sent to existing conversation, triggering sidebar refresh for title update")
        // Trigger sidebar refresh after a short delay to allow title update to complete
        setTimeout(() => {
          setRefreshTrigger(prev => prev + 1)
        }, 1000)
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.role !== "thinking"))

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      console.log("🔄 Frontend: Starting stream reading", { hasReader: !!reader })

      let currentTextBuffer = ""
      let currentToolResults: any[] = []
      let currentAssistantMessage: any = null
      let currentMessageId: string | undefined = undefined

      if (reader) {
        let chunkCount = 0
        while (true) {
          const { done, value } = await reader.read()
          chunkCount++
          console.log(`📦 Frontend: Chunk ${chunkCount}`, { done, valueLength: value?.length })

          if (done) {
            console.log("✅ Frontend: Stream reading completed")
            break
          }

          const chunk = decoder.decode(value)
          console.log(`🧩 Frontend: Decoded chunk ${chunkCount}`, { chunk })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('0:')) {
              // Text Part
              try {
                const textContent = line.slice(2)
                const textPart = JSON.parse(textContent)

                if (!currentMessageId) {
                  currentMessageId = `assistant-${Date.now()}-${Math.random()}`
                }

                currentTextBuffer += textPart

                // Process artifacts and thinking blocks
                let messageContent = currentTextBuffer
                let artifactIdForMessage: string | undefined = undefined
                let thinkingContentForMessage: string | undefined = undefined

                // Process thinking blocks
                const thinkingMatch = currentTextBuffer.match(/```think\n([\s\S]*?)\n```/)
                if (thinkingMatch) {
                  const thinkingContent = thinkingMatch[1]
                  thinkingContentForMessage = thinkingContent.trim()
                  messageContent = currentTextBuffer.replace(/```think\n[\s\S]*?\n```/, '')
                } else {
                  // Handle incomplete/streaming thinking blocks
                  const incompleteThinkingMatch = currentTextBuffer.match(/```think\n([\s\S]*)$/)
                  if (incompleteThinkingMatch) {
                    const thinkingContent = incompleteThinkingMatch[1]
                    thinkingContentForMessage = thinkingContent.trim()
                    // Remove the incomplete thinking block from message content
                    messageContent = currentTextBuffer.replace(/```think\n[\s\S]*$/, '')
                  }
                }

                // Process artifacts
                const artifactStartMatch = messageContent.match(/```artifact\n/)
                const artifactEndMatch = messageContent.match(/```artifact\n([\s\S]*?)\n```/)

                if (artifactStartMatch) {
                  // Use the current message ID as the artifact ID
                  let artifactId = streamingArtifact?.id || currentMessageId
                  artifactIdForMessage = artifactId

                  if (artifactEndMatch) {
                    // Complete artifact
                    const htmlContent = artifactEndMatch[1]
                    const artifact = {
                      id: artifactId, // This is now the message ID
                      name: generateUniqueArtifactName(extractHtmlTitle(htmlContent)),
                      content: htmlContent,
                      timestamp: streamingArtifact?.timestamp || Date.now()
                    }

                    setStreamingArtifact(null)
                    setArtifacts(prev => {
                      const existing = prev.find(a => a.id === artifactId)
                      if (existing) {
                        return prev.map(a => a.id === artifactId ? artifact : a)
                      }
                      return [...prev, artifact]
                    })
                    setGeneratedHtml(htmlContent)
                    setCurrentDisplayResult(artifact)
                    setArtifactViewMode('view')

                    messageContent = messageContent.replace(/```artifact\n[\s\S]*?\n```/, '[Artifact generated - view in right panel]')
                  } else {
                    // Streaming artifact
                    const partialContent = messageContent.split('```artifact\n')[1] || ''
                    const artifact = {
                      id: artifactId, // This is now the message ID
                      name: streamingArtifact?.name || `Streaming...`,
                      content: partialContent,
                      timestamp: streamingArtifact?.timestamp || Date.now()
                    }

                    setStreamingArtifact(artifact)

                    if (!currentDisplayResult || currentDisplayResult.id !== artifactId) {
                      setCurrentDisplayResult(artifact)
                      setArtifactViewMode('code')
                    }

                    messageContent = messageContent.replace(/```artifact\n[\s\S]*$/, '[Artifact generated - view in right panel]')
                  }
                }

                // Update or create assistant message
                setMessages(prev => {
                  const newMessages = [...prev]
                  const existingIndex = newMessages.findIndex(msg => msg.id === currentMessageId)

                  if (existingIndex !== -1) {
                    newMessages[existingIndex] = {
                      ...newMessages[existingIndex],
                      content: messageContent.trim(),
                      artifactId: artifactIdForMessage,
                      thinkingContent: thinkingContentForMessage
                    }
                  } else {
                    const newAssistantMessage = {
                      role: 'assistant' as const,
                      content: messageContent.trim(),
                      id: currentMessageId,
                      artifactId: artifactIdForMessage,
                      thinkingContent: thinkingContentForMessage
                    }
                    newMessages.push(newAssistantMessage)
                    currentAssistantMessage = newAssistantMessage
                  }

                  // Update streaming message ref for abort handling
                  if (currentMessageId) {
                    currentStreamingMessageRef.current = {
                      messageId: currentMessageId,
                      content: messageContent.trim(),
                      artifactId: artifactIdForMessage,
                      thinkingContent: thinkingContentForMessage
                    }
                  }

                  return newMessages
                })

              } catch (parseError) {
                console.log('⚠️ Frontend: Parse error for text part:', parseError)
                // Handle raw text fallback similar to above
              }
            } else if (line.startsWith('b:')) {
              // Tool Call Streaming Start Part
              if (currentTextBuffer.trim()) {
                currentTextBuffer = ""
                currentAssistantMessage = null
                currentMessageId = undefined
              }

              try {
                const jsonStr = line.slice(2)
                const data = JSON.parse(jsonStr)
                const toolDisplayName = getToolDisplayName(data.toolName)
                const toolMessage = {
                  role: "tool" as const,
                  content: `Using ${toolDisplayName}...`,
                  toolName: toolDisplayName,
                  toolCallId: data.toolCallId,
                  id: `tool-${Date.now()}-${Math.random()}`
                }
                addMessage(toolMessage)
              } catch (parseError) {
                console.log('⚠️ Frontend: Parse error for tool call streaming start:', parseError)
              }
            } else if (line.startsWith('9:')) {
              // Tool Call Part
              try {
                const jsonStr = line.slice(2)
                const data = JSON.parse(jsonStr)

                currentToolResults.push({
                  toolCallId: data.toolCallId,
                  toolName: data.toolName,
                  args: data.args
                })

                const toolDisplayName = getToolDisplayName(data.toolName)

                setMessages(prev => {
                  const newMessages = [...prev]
                  const lastToolIndex = newMessages.length - 1

                  if (lastToolIndex >= 0 &&
                    newMessages[lastToolIndex].role === "tool" &&
                    newMessages[lastToolIndex].toolName === toolDisplayName &&
                    newMessages[lastToolIndex].content?.includes("Using")) {
                    const updatedToolMessage = {
                      ...newMessages[lastToolIndex],
                      content: getToolUsageMessage(data.toolName, data.args),
                    }
                    newMessages[lastToolIndex] = updatedToolMessage
                  } else {
                    const newToolMessage = {
                      role: "tool" as const,
                      content: getToolUsageMessage(data.toolName, data.args),
                      toolName: toolDisplayName,
                      toolCallId: data.toolCallId,
                      id: `tool-${Date.now()}-${Math.random()}`
                    }
                    newMessages.push(newToolMessage)
                  }
                  return newMessages
                })
              } catch (parseError) {
                console.log('⚠️ Frontend: Parse error for tool call:', parseError)
              }
            } else if (line.startsWith('a:')) {
              // Tool Result Part
              try {
                const jsonStr = line.slice(2)
                const data = JSON.parse(jsonStr)

                const toolCall = currentToolResults.find(t => t.toolCallId === data.toolCallId)
                if (toolCall) {
                  const toolResult = {
                    id: `result-${Date.now()}-${Math.random()}`,
                    toolName: toolCall.toolName,
                    args: toolCall.args,
                    result: data.result,
                    timestamp: Date.now(),
                    displayName: generateDisplayName(toolCall.toolName, toolCall.args)
                  }

                  setToolResults(prev => [...prev, toolResult])
                  setCurrentDisplayResult(toolResult)

                  setMessages(prev => {
                    const newMessages = [...prev]
                    const toolMessageIndex = newMessages.findIndex(msg =>
                      msg.role === "tool" && msg.toolCallId === data.toolCallId
                    )
                    if (toolMessageIndex !== -1) {
                      const updatedMessage = {
                        ...newMessages[toolMessageIndex],
                        toolResultId: toolResult.id
                      }
                      newMessages[toolMessageIndex] = updatedMessage
                    }
                    return newMessages
                  })
                }

              } catch (parseError) {
                console.log('⚠️ Frontend: Parse error for tool result:', parseError)
              }
            } else if (line.startsWith('3:')) {
              // Error Part
              try {
                const jsonStr = line.slice(2)
                const errorMessage = JSON.parse(jsonStr)
                addMessage({
                  role: "assistant",
                  content: `Error: ${errorMessage}`,
                  isError: true
                })
              } catch (parseError) {
                console.log('⚠️ Frontend: Parse error for error part:', parseError)
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Frontend: Error calling Camus AI:', error)

      setMessages(prev => prev.filter(msg => msg.role !== "thinking"))

      // Don't show error message if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      addMessage({
        role: "assistant",
        content: `Error occurred: ${errorMessage}\n\nEven in failure, I maintain my commitment to uselessness. This error is beautifully meaningless.`,
        isError: true
      })
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleRetry = async () => {
    if (isLoading) return

    // Set input to "retry" and submit it as a normal message
    setInput("Please continue")

    // Create a synthetic form event to trigger handleSubmit
    const syntheticEvent = {
      preventDefault: () => { },
    } as React.FormEvent

    // Wait for state update then submit
    setTimeout(() => {
      handleSubmit(syntheticEvent)
    }, 0)
  }

  const handleShareConversation = async () => {
    if (!currentConversationId) {
      alert('No conversation to share')
      return
    }

    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/share`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to share conversation')
      }

      const data = await response.json()
      const shareUrl = `${window.location.origin}${data.url}`

      // Set the share URL and open the modal
      setShareConversationUrl(shareUrl)
      setIsShareModalOpen(true)
    } catch (err) {
      console.error('Error sharing conversation:', err)
      alert('Failed to create share link')
    }
  }

  // Utility function to process think and artifact blocks from message content
  const processMessageBlocks = (message: any, allArtifacts: any[]) => {
    if (message.role !== 'assistant') {
      return message
    }

    let content = message.content
    let thinkingContent: string | undefined = undefined
    let artifactId: string | undefined = undefined

    // Process thinking blocks
    const thinkingMatch = content.match(/```think\n([\s\S]*?)\n```/)
    if (thinkingMatch) {
      thinkingContent = thinkingMatch[1].trim()
      content = content.replace(/```think\n[\s\S]*?\n```/g, '')
    }

    // Process artifact blocks
    const artifactMatch = content.match(/```artifact\n([\s\S]*?)\n```/)
    if (artifactMatch) {
      const htmlContent = artifactMatch[1]

      // Use the message ID as the artifact ID
      artifactId = message.id

      // Find existing artifact by ID (message ID) or create new one
      let foundArtifact = allArtifacts.find(a => a.id === artifactId)

      if (!foundArtifact) {
        // Create new artifact using message ID
        foundArtifact = {
          id: artifactId, // Use message ID as artifact ID
          name: extractHtmlTitle(htmlContent) || 'Untitled',
          content: htmlContent,
          timestamp: Date.now()
        }
        allArtifacts.push(foundArtifact)
        console.log("📦 Created artifact from message:", {
          messageId: message.id,
          artifactId: artifactId,
          artifactName: foundArtifact.name
        })
      } else {
        console.log("🔗 Found existing artifact for message:", {
          messageId: message.id,
          artifactId: foundArtifact.id,
          artifactName: foundArtifact.name
        })
      }

      content = content.replace(/```artifact\n[\s\S]*?\n```/g, '[Artifact generated - view in right panel]')
    }

    return {
      ...message,
      content: content.trim(),
      thinkingContent,
      artifactId
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-beige text-gray-700 font-sans">
      {/* Share Modal */}
      {shareConversationUrl && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareUrl={shareConversationUrl}
          title="CAMUS Conversation"
        />
      )}

      {/* Credit milestone notification */}
      <CreditMilestoneNotification />

      <div className="flex h-screen">
        {/* Left Half: Sidebar + Chat */}
        <div className="flex w-1/2 h-full min-w-0">
          {/* Sidebar */}
          <ChatSidebar
            onNewChat={handleNewChat}
            onLoadConversation={loadConversation}
            currentConversationId={currentConversationId || undefined}
            refreshTrigger={refreshTrigger}
          />

          {/* Chat Section */}
          <div ref={chatContainerRef} className="flex h-full flex-1 flex-col border-r border-gray-300 min-w-0">
            {/* Chat Header */}
            <div className="border-b border-gray-300 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h1 className="text-lg font-serif font-medium text-gray-800">AI Interface</h1>
                  {currentConversationId && (
                    <span className="ml-3 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {currentConversationId.slice(0, 8)}...
                    </span>
                  )}
                </div>
                {currentConversationId && (
                  <Button
                    onClick={handleShareConversation}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <ChatMessages
              ref={messagesEndRef}
              messages={messages}
              isLoading={isLoading}
              expandedThinking={expandedThinking}
              streamingArtifact={streamingArtifact}
              artifacts={artifacts}
              onMessageClick={handleMessageClick}
              onToggleThinking={toggleThinking}
              onRetry={handleRetry}
              setCurrentDisplayResult={setCurrentDisplayResult}
              setGeneratedHtml={setGeneratedHtml}
            />

            {/* Input */}
            <ChatInput
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              onStop={handleStop}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Half: Results Panel */}
        <div className="w-1/2 h-full min-w-0">
          <ResultsPanel
            currentDisplayResult={currentDisplayResult}
            streamingArtifact={streamingArtifact}
            toolResults={toolResults}
            artifacts={artifacts}
            artifactViewMode={artifactViewMode}
            setArtifactViewMode={setArtifactViewMode}
            setIsFullscreen={setIsFullscreen}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            setCurrentDisplayResult={setCurrentDisplayResult}
            setGeneratedHtml={setGeneratedHtml}
          />
        </div>

        {/* Fullscreen Modal */}
        {isFullscreen && currentDisplayResult && 'content' in currentDisplayResult && (
          <FullscreenModal
            isOpen={isFullscreen}
            artifact={currentDisplayResult}
            artifactViewMode={artifactViewMode}
            setArtifactViewMode={setArtifactViewMode}
            onClose={() => setIsFullscreen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default function AgentPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div>Loading...</div>}>
        <AgentPageContent />
      </Suspense>
    </AuthGuard>
  )
}
