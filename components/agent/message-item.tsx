"use client"

import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/ui/markdown"
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react"
import { JSX, useEffect, useState } from "react"

export type MessageType = {
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

type MessageItemProps = {
  message: MessageType
  index: number
  isLoading: boolean
  expandedThinking: Set<string>
  onMessageClick: (message: MessageType) => void
  onToggleThinking: (messageId: string) => void
  onRetry: () => void
  renderArtifactBlock: (artifactId: string) => JSX.Element
  isSharedMode?: boolean
  setCurrentDisplayResult?: (result: any) => void
  setGeneratedHtml?: (html: string) => void
  setIsFullscreen?: (isFullscreen: boolean) => void
}

export function MessageItem({
  message,
  index,
  isLoading,
  expandedThinking,
  onMessageClick,
  onToggleThinking,
  onRetry,
  renderArtifactBlock,
  isSharedMode = false,
  setCurrentDisplayResult = () => { },
  setGeneratedHtml = () => { },
  setIsFullscreen = () => { }
}: MessageItemProps) {
  const [isFullscreenLocal, setIsFullscreenLocal] = useState(false);

  // Don't need debug logs
  useEffect(() => {
    // Removed console.log statement
  }, [message, index]);

  const getToolActionText = (toolName: string): string => {
    switch (toolName) {
      case 'Web Search': return 'searching for'
      case 'Web Browse': return 'browsing'
      case 'Image Generation': return 'creating'
      // Handle raw tool names from database
      case 'webSearch': return 'searching for'
      case 'browseWeb': return 'browsing'
      case 'generateImage': return 'creating'
      default: return 'using'
    }
  }

  const getToolDisplayContent = (toolName: string, content: string): string => {
    // Handle the new unified format from API and frontend
    if (content.includes('🔍 Searching the web for:')) {
      const queryMatch = content.match(/🔍 Searching the web for: "(.*?)"/)
      return queryMatch ? queryMatch[1] : content
    }
    if (content.includes('🌐 Browsing:')) {
      const urlMatch = content.match(/🌐 Browsing: (.*)/)
      return urlMatch ? urlMatch[1] : content
    }
    if (content.includes('🎨 Generating image:')) {
      const promptMatch = content.match(/🎨 Generating image: "(.*?)"/)
      return promptMatch ? promptMatch[1] : content
    }

    // Handle old database format - "webSearch completed - view result in right panel"
    if (content.includes('completed - view result in right panel')) {
      // For old completed messages, we need to look up the tool result to get the actual query/URL
      if ((toolName === 'webSearch' || toolName === 'Web Search') && content.includes('webSearch completed')) {
        return 'search results (click to view)'
      }
      if ((toolName === 'browseWeb' || toolName === 'Web Browse') && content.includes('browseWeb completed')) {
        return 'web page (click to view)'
      }
    }

    // Legacy format handling for older messages
    switch (toolName) {
      case 'webSearch':
      case 'Web Search':
        // Try to extract query from various formats
        const queryMatch = content.match(/(?:for|query:)\s*"([^"]*)"/) ||
          content.match(/Searching.*?for:\s*"([^"]*)"/) ||
          content.match(/🔍.*?"([^"]*)"/)
        return queryMatch ? queryMatch[1] : content

      case 'browseWeb':
      case 'Web Browse':
        // Try to extract URL from various formats
        const urlMatch = content.match(/(https?:\/\/[^\s\)]+)/) ||
          content.match(/Browsing:\s*(\S+)/) ||
          content.match(/🌐.*?:\s*(\S+)/)
        return urlMatch ? urlMatch[1] : content

      case 'generateImage':
      case 'Image Generation':
        const promptMatch = content.match(/(?:image|prompt):\s*"([^"]*)"/) ||
          content.match(/🎨.*?"([^"]*)"/)
        return promptMatch ? promptMatch[1] : content

      default:
        return content
    }
  }

  const renderThinkingBlock = (): JSX.Element | null => {
    // Only show thinking blocks for messages that have thinking content (only during streaming)
    // Thinking content is not persisted to database, so this will only appear in real-time
    if (!message.thinkingContent || !message.id) return null

    const isExpanded = expandedThinking.has(message.id)

    return (
      <div className="mb-3 border border-amber-200 bg-amber-50 rounded-lg overflow-hidden">
        <button
          onClick={() => onToggleThinking(message.id!)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-amber-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-amber-600" />
            )}
            <span className="text-sm font-medium text-amber-800">
              Secret Thought Process (Do Not Click!)
            </span>
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-amber-200 bg-amber-25">
            <div className="mt-3 p-3 bg-white rounded border border-amber-200">
              <div className="text-sm text-amber-800 italic leading-relaxed">
                <MarkdownRenderer content={message.thinkingContent} />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderFullscreenIframe = (htmlContent: string) => {
    if (!isFullscreenLocal) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">HTML Content</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreenLocal(false)}
              className="hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              srcDoc={htmlContent}
              title="HTML Content Fullscreen"
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        </div>
      </div>
    );
  };

  // Function to extract title from HTML content
  const extractTitleFromHtml = (htmlContent: string): string => {
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    return titleMatch && titleMatch[1] ? titleMatch[1] : "HTML Content";
  };

  // Function to render HTML block
  const renderHtmlBlock = (htmlContent: string): JSX.Element => {
    const title = extractTitleFromHtml(htmlContent);

    return (
      <div
        className="my-3 p-4 bg-gradient-to-r from-beige to-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:border-taupe hover:shadow-sm transition-all"
        onClick={() => {
          // Removed console.log statement
          const tempArtifact = {
            id: `temp-${Date.now()}`,
            name: title,
            content: htmlContent,
            timestamp: Date.now()
          };
          setCurrentDisplayResult(tempArtifact);
          setGeneratedHtml(htmlContent);
          setIsFullscreen(true);
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-taupe rounded-lg flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-800 font-medium">
              {title}
            </h3>
            <p className="text-gray-600 text-sm">
              Click to open website
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMessageContent = (): JSX.Element => {
    // Removed console.log statement

    // Special handling for raw ```artifact blocks - convert them to proper format
    if (message.role === "assistant" && message.content.includes("```artifact")) {
      // Removed console.log statement

      // Extract the artifact content
      const artifactMatch = message.content.match(/```artifact\n([\s\S]*?)\n```/);
      if (artifactMatch) {
        const htmlContent = artifactMatch[1];

        // Get content before and after artifact block
        const contentWithoutArtifact = message.content.replace(/```artifact\n[\s\S]*?\n```/g, '[Artifact generated - view in right panel]');

        // If we already have an artifactId set, use the existing handling
        if (message.artifactId) {
          return (
            <div>
              <MarkdownRenderer content={contentWithoutArtifact} />
              {renderArtifactBlock(message.artifactId)}
            </div>
          );
        }

        // Otherwise, create a temporary artifact
        // Removed console.log statement
        const title = extractTitleFromHtml(htmlContent) || "HTML Content";

        return (
          <div>
            <MarkdownRenderer content={contentWithoutArtifact} />
            <div
              className="my-3 p-4 bg-gradient-to-r from-beige to-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:border-taupe hover:shadow-sm transition-all"
              onClick={() => {
                // Removed console.log statement
                const tempArtifact = {
                  id: `temp-${Date.now()}`,
                  name: title,
                  content: htmlContent,
                  timestamp: Date.now()
                };
                setCurrentDisplayResult(tempArtifact);
                setGeneratedHtml(htmlContent);
                setIsFullscreen(true);
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-taupe rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-800 font-medium">
                    {title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Click to open website
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    // Check if this message contains an artifact placeholder
    if (message.artifactId) {
      // Removed console.log statement

      // Detect different artifact placeholder patterns including database stored messages
      const artifactPatterns = [
        /\[Artifact (?:generated|streaming) - view in (?:the )?right panel\]/g,
        /\[Artifact generated\]/g,
        /\[Artifact ID: [a-zA-Z0-9-]+\]/g
      ];

      // Try each pattern
      let parts: string[] = [message.content];
      for (const pattern of artifactPatterns) {
        if (pattern.test(message.content)) {
          // Removed console.log statement
          parts = message.content.split(pattern);
          break;
        }
      }

      return (
        <div>
          {parts.map((part, index) => (
            <div key={index}>
              {part && <MarkdownRenderer content={part} />}
              {index < parts.length - 1 && renderArtifactBlock(message.artifactId!)}
            </div>
          ))}
        </div>
      )
    }

    // Check for HTML content in the message that might be an artifact
    if (message.role === "assistant" &&
      (message.content.includes("<!DOCTYPE html>") ||
        message.content.includes("<html") ||
        message.content.includes("<head")) &&
      message.content.includes("</html>")) {

      // Removed console.log statement

      // Extract the HTML content
      const htmlMatch = message.content.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
      const htmlContent = htmlMatch ? htmlMatch[0] : message.content;

      // Extract text outside of HTML
      const nonHtmlParts = message.content.split(/<!DOCTYPE html>[\s\S]*<\/html>/i);
      const nonHtmlContent = nonHtmlParts.filter(Boolean).join('\n\n');

      // Removed console.log statement

      return (
        <div>
          {nonHtmlContent && <MarkdownRenderer content={nonHtmlContent} />}
          {renderHtmlBlock(htmlContent)}
        </div>
      );
    }

    // Try direct approach to detect HTML content
    const contentStr = message.content.toString();
    if (message.role === "assistant" && contentStr.indexOf("<!DOCTYPE html>") >= 0) {
      // Removed console.log statement

      // Extract HTML content using regex
      const htmlMatch = contentStr.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
      if (htmlMatch) {
        const htmlContent = htmlMatch[0];
        // Removed console.log statement

        // Get content before and after HTML
        const parts = contentStr.split(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        const nonHtmlContent = parts.filter(Boolean).join('\n\n');

        return (
          <div>
            {nonHtmlContent && <MarkdownRenderer content={nonHtmlContent} />}
            {renderHtmlBlock(htmlContent)}
          </div>
        );
      }
    }

    // Check for embedded artifact references without artifactId set
    if (message.role === "assistant" &&
      (message.content.includes("[Artifact generated]") ||
        message.content.includes("[Artifact generated - view in") ||
        message.content.includes("[Artifact ID:"))) {
      // Removed console.log statement
      // Regular message with artifact mention but no artifactId - just render as markdown
      return <MarkdownRenderer content={message.content} />
    }

    // Removed console.log statement
    // Regular message content
    return <MarkdownRenderer content={message.content} />
  }

  return (
    <div key={message.id || `message-${index}`} className="mb-4">
      {message.role === "user" && (
        <div className="flex items-start justify-end">
          <div className="rounded-lg rounded-tr-none bg-taupe text-white p-3">
            <p>{message.content}</p>
          </div>
        </div>
      )}

      {message.role === "assistant" && (
        <div className="flex items-start">
          <div
            className={`rounded-lg rounded-tl-none p-3 cursor-pointer transition-colors ${message.isIncomplete
              ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100'
              : 'bg-gray-100 border border-gray-200 hover:bg-gray-50'
              }`}
            onClick={() => onMessageClick(message)}
          >
            {/* Incomplete message indicator */}
            {message.isIncomplete && (
              <div className="mb-2 flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  ⚠️ Interrupted
                </span>
                <span className="text-xs text-yellow-700">
                  This response was stopped before completion
                </span>
              </div>
            )}

            {/* Render thinking block if present - moved to top */}
            {renderThinkingBlock()}
            {renderMessageContent()}

            {/* Retry button for error messages */}
            {message.isError && !isSharedMode && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <Button
                  onClick={(e) => {
                    e.stopPropagation() // Prevent triggering the message click handler
                    onRetry()
                  }}
                  disabled={isLoading}
                  className="bg-taupe hover:bg-taupe/90 text-white text-sm"
                  size="sm"
                >
                  {isLoading ? 'Retrying...' : 'Retry'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {message.role === "thinking" && (
        <div className="flex items-start">
          <div className="rounded-lg rounded-tl-none bg-beige border border-gray-200 p-3 text-gray-600">
            <p className="flex items-center">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-taupe"></span>
              {message.content}
            </p>
          </div>
        </div>
      )}

      {message.role === "tool" && (
        <div className="flex items-center text-sm text-gray-500 py-1">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-taupe"></span>
          <span className="mr-1">{getToolActionText(message.toolName || '')}</span>
          {message.toolResultId ? (
            <button
              onClick={() => onMessageClick(message)}
              className="text-taupe hover:text-taupe/80 underline cursor-pointer"
            >
              {getToolDisplayContent(message.toolName || '', message.content)}
            </button>
          ) : (
            <span className="text-gray-600">{getToolDisplayContent(message.toolName || '', message.content)}</span>
          )}
        </div>
      )}
    </div>
  )
} 
