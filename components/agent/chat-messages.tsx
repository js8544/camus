"use client"

import { Sparkles } from "lucide-react"
import { forwardRef, JSX } from "react"
import { ArtifactBlock, ArtifactItem } from "./artifact-viewer"
import { MessageItem, MessageType } from "./message-item"

type ChatMessagesProps = {
  messages: MessageType[]
  isLoading: boolean
  expandedThinking: Set<string>
  streamingArtifact: ArtifactItem | null
  artifacts: ArtifactItem[]
  onMessageClick: (message: MessageType) => void
  onToggleThinking: (messageId: string) => void
  onRetry: () => void
  setCurrentDisplayResult: (result: ArtifactItem) => void
  setGeneratedHtml: (html: string) => void
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({
    messages,
    isLoading,
    expandedThinking,
    streamingArtifact,
    artifacts,
    onMessageClick,
    onToggleThinking,
    onRetry,
    setCurrentDisplayResult,
    setGeneratedHtml
  }, ref) => {
    const renderArtifactBlock = (artifactId: string): JSX.Element => {
      const artifact = artifacts.find(a => a.id === artifactId)

      // Check if this artifact is currently streaming
      const isStreamingThis = streamingArtifact?.id === artifactId

      return (
        <ArtifactBlock
          artifact={artifact}
          streamingArtifact={streamingArtifact}
          artifactId={artifactId}
          setCurrentDisplayResult={setCurrentDisplayResult}
          setGeneratedHtml={setGeneratedHtml}
        />
      )
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
            <Sparkles className="mb-4 h-12 w-12 text-taupe" />
            <h2 className="mb-2 text-xl font-serif font-medium text-gray-800">Welcome to Camus</h2>
            <p className="max-w-md text-gray-500">
              The world's first truly useless AI. Ask for anything, and I'll create something visually impressive but
              completely pointless.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageItem
              key={message.id || `message-${index}`}
              message={message}
              index={index}
              isLoading={isLoading}
              expandedThinking={expandedThinking}
              onMessageClick={onMessageClick}
              onToggleThinking={onToggleThinking}
              onRetry={onRetry}
              renderArtifactBlock={renderArtifactBlock}
            />
          ))
        )}
        <div ref={ref} />
      </div>
    )
  }
)

ChatMessages.displayName = "ChatMessages" 
