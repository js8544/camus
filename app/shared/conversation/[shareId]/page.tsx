"use client"

import { ChatMessages } from "@/components/agent/chat-messages"
import { FullscreenModal } from "@/components/agent/fullscreen-modal"
import { ResultsPanel } from "@/components/agent/results-panel"
import { ShareModal } from "@/components/ShareModal"
import { Button } from "@/components/ui/button"
import { useAgentChat } from "@/hooks/use-agent-chat"
import { ExternalLink, Share2, Sparkles } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type SharedConversationData = {
  id: string
  shareId: string
  title?: string
  messages: any[]
  artifacts: any[]
  toolResults: any[]
  createdAt: string
  views: number
}

export default function SharedConversationPage() {
  const params = useParams()
  const shareId = params.shareId as string
  const [conversation, setConversation] = useState<SharedConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Use the same agent chat hook for managing display state
  const {
    messages,
    setMessages,
    artifacts,
    setArtifacts,
    toolResults,
    setToolResults,
    currentDisplayResult,
    setCurrentDisplayResult,
    artifactViewMode,
    setArtifactViewMode,
    isFullscreen,
    setIsFullscreen,
    expandedThinking,
    setGeneratedHtml,
    toggleThinking,
    handleMessageClick,
  } = useAgentChat()

  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    async function fetchSharedConversation() {
      try {
        const response = await fetch(`/api/shared/conversation/${shareId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError("This shared conversation could not be found or may have expired.")
          } else {
            setError("Failed to load the shared conversation.")
          }
          return
        }

        const data = await response.json()
        setConversation(data)

        // For debugging: Check all messages for HTML content
        const htmlMessages = data.messages.filter((m: any) =>
          m.role === "assistant" &&
          (m.content.includes("<!DOCTYPE html>") ||
            m.content.includes("<html") ||
            m.content.includes("</html>"))
        );

        // Check all artifacts for HTML content
        const htmlArtifacts = data.artifacts.filter((a: any) =>
          a.content &&
          (a.content.includes("<!DOCTYPE html>") ||
            a.content.includes("<html") ||
            a.content.includes("</html>"))
        );

        // Process messages to associate artifacts with messages that contain artifact references
        const processedMessages = data.messages.map((message: any) => {
          // First check for ```artifact blocks
          if (message.role === "assistant" && message.content.includes("```artifact")) {
            // Extract the artifact content
            const artifactMatch = message.content.match(/```artifact\n([\s\S]*?)\n```/);
            if (artifactMatch) {
              const artifactContent = artifactMatch[1];

              // Find the matching artifact by content similarity
              const matchingArtifact = data.artifacts.find((a: any) => {
                // Simple content similarity check (could be improved)
                return a.content &&
                  Math.abs(a.content.length - artifactContent.length) < 100 &&
                  (a.content.includes(artifactContent.substring(0, 50)) ||
                    artifactContent.includes(a.content.substring(0, 50)));
              });

              if (matchingArtifact) {
                // Replace the artifact block with a placeholder
                const updatedContent = message.content.replace(
                  /```artifact\n[\s\S]*?\n```/g,
                  '[Artifact generated - view in right panel]'
                );

                return {
                  ...message,
                  content: updatedContent,
                  artifactId: matchingArtifact.id
                };
              }
            }
          }

          // Check if message contains artifact reference text
          if (message.role === "assistant" && message.content.includes("[Artifact generated")) {
            // Find matching artifact for this message (if any)
            const matchingArtifact = data.artifacts.find((a: any) =>
              message.content.includes(a.id) ||
              (message.createdAt && a.timestamp &&
                Math.abs(new Date(message.createdAt).getTime() - a.timestamp) < 60000)
            );

            if (matchingArtifact) {
              return {
                ...message,
                artifactId: matchingArtifact.id
              };
            }
          }

          // Check for HTML content that should be rendered as an artifact
          if (message.role === "assistant" &&
            (message.content.includes("<!DOCTYPE html>") ||
              message.content.includes("<html") ||
              message.content.includes("<head")) &&
            message.content.includes("</html>")) {

            // Extract HTML content for comparison
            const htmlMatch = message.content.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
            const htmlContent = htmlMatch ? htmlMatch[0] : message.content;

            // Find matching artifact by comparing HTML content
            const matchingArtifact = data.artifacts.find((a: any) => {
              // Compare content length as a quick check
              if (Math.abs(a.content.length - htmlContent.length) > 100) {
                return false;
              }

              // Check for key HTML fragments
              return a.content.includes("<!DOCTYPE html>") ||
                a.content.includes("<html") ||
                a.content.includes("<head");
            });

            if (matchingArtifact) {
              return {
                ...message,
                artifactId: matchingArtifact.id
              };
            }
          }

          return message;
        });

        // Set the processed messages to the chat hook
        setMessages(processedMessages || [])
        setArtifacts(data.artifacts || [])
        setToolResults(data.toolResults || [])

        // Set the last artifact or tool result as current display
        if (data.artifacts && data.artifacts.length > 0) {
          const lastArtifact = data.artifacts[data.artifacts.length - 1]
          setCurrentDisplayResult(lastArtifact)
          setGeneratedHtml(lastArtifact.content)
        } else if (data.toolResults && data.toolResults.length > 0) {
          const lastToolResult = data.toolResults[data.toolResults.length - 1]
          setCurrentDisplayResult(lastToolResult)
        }

      } catch (err) {
        console.error("Error fetching shared conversation:", err)
        setError("Failed to load the shared conversation.")
      } finally {
        setLoading(false)
      }
    }

    if (shareId) {
      fetchSharedConversation()
    }
  }, [shareId, setMessages, setArtifacts, setToolResults, setCurrentDisplayResult, setGeneratedHtml])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateTitle = (title: string, maxLength: number = 50): string => {
    if (title.length <= maxLength) {
      return title
    }
    return title.substring(0, maxLength) + "..."
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleShare = () => {
    setIsShareModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-taupe rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading shared conversation...</p>
        </div>
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-gray-800 mb-2">Conversation Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || "This shared conversation could not be found or may have expired."}
          </p>
          <Button
            onClick={() => window.location.href = '/agent'}
            className="bg-taupe hover:bg-taupe/90 text-white"
          >
            Go to CAMUS
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-beige text-gray-700 font-sans">
      {/* Share Modal */}
      {conversation && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareUrl={window.location.href}
          title={conversation.title || "CAMUS Conversation"}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-taupe rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-serif font-medium text-gray-800">CAMUS</h1>
                <span className="text-xs text-gray-500">Shared Conversation</span>
              </div>
              {conversation.title && (
                <span className="text-sm text-gray-600 ml-4">
                  {truncateTitle(conversation.title)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Shared on {formatDate(conversation.createdAt)} • {conversation.views} views
              </span>
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={() => window.location.href = '/agent'}
                variant="outline"
                size="sm"
                className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open CAMUS
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Half: Chat Messages */}
        <div className="w-1/2 h-full min-w-0 border-r border-gray-300 flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-gray-300 bg-white p-5 flex-shrink-0">
            <div className="flex items-center">
              <h2 className="text-lg font-serif font-medium text-gray-800">Conversation</h2>
              <span className="ml-3 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {shareId.slice(0, 12)}...
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <ChatMessages
              ref={messagesEndRef}
              messages={messages}
              isLoading={false}
              expandedThinking={expandedThinking}
              streamingArtifact={null}
              artifacts={artifacts}
              onMessageClick={handleMessageClick}
              onToggleThinking={toggleThinking}
              onRetry={() => { }} // No retry in shared mode
              setCurrentDisplayResult={setCurrentDisplayResult}
              setGeneratedHtml={setGeneratedHtml}
              isSharedMode={true} // Add this prop to disable retry buttons
            />
          </div>
        </div>

        {/* Right Half: Results Panel */}
        <div className="w-1/2 h-full min-w-0">
          <ResultsPanel
            currentDisplayResult={currentDisplayResult}
            streamingArtifact={null}
            toolResults={toolResults}
            artifacts={artifacts}
            artifactViewMode={artifactViewMode}
            setArtifactViewMode={setArtifactViewMode}
            setIsFullscreen={setIsFullscreen}
            showDropdown={showDropdown}
            setShowDropdown={setShowDropdown}
            setCurrentDisplayResult={setCurrentDisplayResult}
            setGeneratedHtml={setGeneratedHtml}
            isSharedMode={true} // Add this prop to hide share buttons
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

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-4 py-2">
        <div className="text-center text-sm text-gray-500">
          <p>
            Created with{" "}
            <a
              href="/agent"
              className="text-taupe hover:text-taupe/80 font-medium"
            >
              CAMUS AI
            </a>
            {" "}— Creating Absurd, Meaningless and Useless Stuff
          </p>
        </div>
      </div>
    </div>
  )
} 
