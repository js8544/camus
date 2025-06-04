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
  isSharedMode?: boolean
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
    setGeneratedHtml,
    isSharedMode = false
  }, ref) => {
    const renderArtifactBlock = (artifactId: string): JSX.Element => {
      // Find the artifact by ID - try exact match first
      let artifact = artifacts.find(a => a.id === artifactId);

      // If not found, try to find by partial match (for shared artifacts where IDs might be truncated)
      if (!artifact && artifactId) {
        artifact = artifacts.find(a => a.id.includes(artifactId) || artifactId.includes(a.id));
      }

      // If still not found, use the first artifact as fallback in shared mode
      if (!artifact && isSharedMode && artifacts.length > 0) {
        console.warn("Artifact not found by ID, using fallback in shared mode");
        artifact = artifacts[0];
      }

      // Check if this artifact is currently streaming
      const isStreamingThis = streamingArtifact?.id === artifactId;

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
              isSharedMode={isSharedMode}
              setCurrentDisplayResult={setCurrentDisplayResult}
              setGeneratedHtml={setGeneratedHtml}
              setIsFullscreen={() => { }}
            />
          ))
        )}
        <div ref={ref} />
      </div>
    )
  }
)

ChatMessages.displayName = "ChatMessages" 
