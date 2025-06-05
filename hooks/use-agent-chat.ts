"use client"

import { generateArtifactId } from '@/lib/artifact-utils'
import { useEffect, useState } from 'react'

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
  isIncomplete?: boolean
}

export interface ArtifactItem {
  id: string
  name: string
  content: string
  timestamp: number
}

export interface ToolResult {
  id: string
  toolName: string
  args: any
  result: string
  displayName: string
  timestamp: number
}

export function useAgentChat() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Artifact states
  const [generatedHtml, setGeneratedHtml] = useState<string>("")
  const [toolResults, setToolResults] = useState<ToolResult[]>([])
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([])
  const [currentDisplayResult, setCurrentDisplayResult] = useState<ArtifactItem | ToolResult | null>(null)
  const [artifactViewMode, setArtifactViewMode] = useState<'view' | 'code'>('view')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [streamingArtifact, setStreamingArtifact] = useState<ArtifactItem | null>(null)

  // UI state
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set())

  // No need for debug log
  useEffect(() => {
    // Removed console.log statement
  }, [messages])

  const extractHtmlTitle = (htmlContent: string): string => {
    const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i)
    return titleMatch ? titleMatch[1].trim() : 'Untitled'
  }

  const generateUniqueArtifactName = (baseTitle: string): string => {
    const existingNames = artifacts.map(a => a.name)

    if (!existingNames.includes(baseTitle)) {
      return baseTitle
    }

    let counter = 1
    let uniqueName = `${baseTitle} (${counter})`

    while (existingNames.includes(uniqueName)) {
      counter++
      uniqueName = `${baseTitle} (${counter})`
    }

    return uniqueName
  }

  const generateDisplayName = (toolName: string, args: any): string => {
    switch (toolName) {
      case 'webSearch':
        return `Search: "${args.query}"`
      case 'browseWeb':
        const domain = new URL(args.url).hostname.replace('www.', '')
        return `Browse: ${domain}`
      case 'generateImage':
        return `Image: "${args.prompt?.substring(0, 30) || 'Generated'}..."`
      default:
        return `${toolName}: Result`
    }
  }

  // Consolidated artifact processing function
  const processArtifactInMessage = (message: MessageType) => {
    if (message.role === "assistant" && message.content.includes("```artifact")) {
      // Extract the artifact content  
      const artifactMatch = message.content.match(/```artifact\n([\s\S]*?)\n```/)
      if (artifactMatch) {
        const htmlContent = artifactMatch[1]

        // Only create artifact if we have an artifactId from backend OR generate consistent ID
        const artifactId = message.artifactId || generateArtifactId('temp', htmlContent)

        if (artifactId) {
          const artifact: ArtifactItem = {
            id: artifactId,
            name: generateUniqueArtifactName(extractHtmlTitle(htmlContent)),
            content: htmlContent,
            timestamp: Date.now()
          }

          setArtifacts(prev => [...prev, artifact])
          setGeneratedHtml(htmlContent)
          setCurrentDisplayResult(artifact)
        }
      }
    }
  }

  const addMessage = (message: MessageType) => {
    setMessages(prev => [...prev, { ...message, id: message.id || Date.now().toString() }])
    processArtifactInMessage(message)
  }

  const updateLastMessage = (updates: Partial<MessageType>) => {
    setMessages(prev => {
      const newMessages = [...prev]
      if (newMessages.length > 0) {
        const lastMessage = { ...newMessages[newMessages.length - 1], ...updates }
        newMessages[newMessages.length - 1] = lastMessage

        // Process artifacts in the updated message
        processArtifactInMessage(lastMessage)
      }
      return newMessages
    })
  }

  const toggleThinking = (messageId: string) => {
    setExpandedThinking(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const handleMessageClick = (message: MessageType) => {
    if (message.artifactId) {
      const artifact = artifacts.find(a => a.id === message.artifactId)
      if (artifact) {
        setCurrentDisplayResult(artifact)
        setGeneratedHtml(artifact.content)
      }
    } else if (message.toolResultId) {
      const toolResult = toolResults.find(tr => tr.id === message.toolResultId)
      if (toolResult) {
        setCurrentDisplayResult(toolResult)
      }
    }
  }

  const resetChat = () => {
    setMessages([])
    setIsLoading(false)
    setGeneratedHtml("")
    setToolResults([])
    setArtifacts([])
    setCurrentDisplayResult(null)
    setStreamingArtifact(null)
    setExpandedThinking(new Set())
    setInput("")
  }

  const getToolDisplayName = (toolName: string): string => {
    switch (toolName) {
      case 'webSearch': return 'Web Search'
      case 'browseWeb': return 'Web Browse'
      case 'generateImage': return 'Image Generation'
      default: return toolName
    }
  }

  const getToolUsageMessage = (toolName: string, args: any): string => {
    switch (toolName) {
      case 'webSearch':
        return `🔍 Searching the web for: "${args.query}"`
      case 'browseWeb':
        return `🌐 Browsing: ${args.url}`
      case 'generateImage':
        return `🎨 Generating image: "${args.prompt?.substring(0, 50) || ''}${args.prompt?.length > 50 ? '...' : ''}"`
      default:
        return `🔧 Using ${toolName}`
    }
  }

  return {
    // State
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

    // Helper functions (UI only, no database)
    extractHtmlTitle,
    generateUniqueArtifactName,
    generateDisplayName,
    addMessage,
    updateLastMessage,
    toggleThinking,
    handleMessageClick,
    resetChat,
    getToolDisplayName,
    getToolUsageMessage,
  }
} 
