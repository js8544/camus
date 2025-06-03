"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink, Globe, Image, Search } from "lucide-react"
import { JSX } from "react"

export type ToolResult = {
  id: string
  toolName: string
  args: any
  result: any
  timestamp: number
  displayName: string
}

type ToolResultProps = {
  result: ToolResult
}

export function ToolResult({ result }: ToolResultProps) {
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const renderToolResult = (): JSX.Element => {
    switch (result.toolName) {
      case 'webSearch':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-300 pb-2">
              <Search className="h-5 w-5 text-taupe" />
              <h3 className="text-lg font-semibold text-gray-800">Web Search Results</h3>
              <span className="text-sm text-gray-500">• {formatTimestamp(result.timestamp)}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Query: "{result.args.query}"</p>
              {result.result.results && result.result.results.length > 0 ? (
                <div className="space-y-3">
                  {result.result.results.map((item: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-taupe transition-colors bg-white">
                      <div className="flex gap-4 items-start">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-taupe mb-2 leading-tight">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-700 mb-3 leading-relaxed">{item.description}</p>
                          )}
                          {item.content && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                              <p className="text-xs text-gray-600 mb-2 font-medium">Content Preview:</p>
                              <p className="text-sm text-gray-700 leading-relaxed break-words">
                                {item.content.length > 150 ? `${item.content.substring(0, 150)}...` : item.content}
                              </p>
                            </div>
                          )}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-taupe flex items-center truncate"
                            title={item.url}
                          >
                            <span className="truncate">{item.url}</span>
                            <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                        {item.images && item.images.length > 0 && (
                          <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24">
                            <img
                              src={item.images[0]}
                              alt="Search result image"
                              className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No results found</p>
              )}
            </div>
          </div>
        )

      case 'browseWeb':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-300 pb-2">
              <Globe className="h-5 w-5 text-taupe" />
              <h3 className="text-lg font-semibold text-gray-800">Web Page Browser</h3>
              <span className="text-sm text-gray-500">• {formatTimestamp(result.timestamp)}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="mb-3 flex items-center justify-between">
                <a href={result.args.url} target="_blank" rel="noopener noreferrer"
                  className="text-taupe hover:text-taupe/80 flex items-center">
                  {result.args.url} <ExternalLink className="ml-1 h-4 w-4" />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(result.args.url, '_blank')}
                  className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Open in New Tab
                </Button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
                <iframe
                  src={`/api/proxy?url=${encodeURIComponent(result.args.url)}`}
                  title="Web page"
                  className="w-full h-full border-none"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                  loading="lazy"
                  onError={(e) => {
                    console.warn('Iframe loading error for:', result.args.url, e)
                  }}
                />
              </div>

              {result.result.title && (
                <div className="mt-3 p-3 bg-beige rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-1">Extracted Title:</h4>
                  <p className="text-gray-700">{result.result.title}</p>
                </div>
              )}

              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Some websites may not display properly in the iframe due to security restrictions or redirect loops.
                  If the page doesn't load correctly, try opening it in a new tab using the button above.
                </p>
              </div>
            </div>
          </div>
        )

      case 'generateImage':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-300 pb-2">
              <Image className="h-5 w-5 text-taupe" />
              <h3 className="text-lg font-semibold text-gray-800">Generated Image</h3>
              <span className="text-sm text-gray-500">• {formatTimestamp(result.timestamp)}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Prompt: "{result.args.prompt}"</p>
              {result.result.imageUrl ? (
                <div className="text-center">
                  <img
                    src={result.result.imageUrl}
                    alt="Generated image"
                    className="max-w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="mt-3 space-x-2">
                    <a
                      href={result.result.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-taupe hover:bg-taupe/90 text-white rounded text-sm"
                    >
                      Open Full Size <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Image generation failed</p>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-300 pb-2">
              <div className="h-5 w-5 bg-taupe rounded" />
              <h3 className="text-lg font-semibold text-gray-800">Tool Result</h3>
              <span className="text-sm text-gray-500">• {formatTimestamp(result.timestamp)}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          </div>
        )
    }
  }

  return <div>{renderToolResult()}</div>
} 
