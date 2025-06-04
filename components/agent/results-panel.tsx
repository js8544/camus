"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown, Clock, Sparkles } from "lucide-react"
import { ArtifactItem, ArtifactViewer } from "./artifact-viewer"
import { ToolResult } from "./tool-result"

type ResultsPanelProps = {
  currentDisplayResult: ToolResult | ArtifactItem | null
  streamingArtifact: ArtifactItem | null
  toolResults: ToolResult[]
  artifacts: ArtifactItem[]
  artifactViewMode: 'view' | 'code'
  setArtifactViewMode: (mode: 'view' | 'code') => void
  setIsFullscreen: (fullscreen: boolean) => void
  showDropdown: boolean
  setShowDropdown: (show: boolean) => void
  setCurrentDisplayResult: (result: ToolResult | ArtifactItem | null) => void
  setGeneratedHtml: (html: string) => void
  isSharedMode?: boolean
}

export function ResultsPanel({
  currentDisplayResult,
  streamingArtifact,
  toolResults,
  artifacts,
  artifactViewMode,
  setArtifactViewMode,
  setIsFullscreen,
  showDropdown,
  setShowDropdown,
  setCurrentDisplayResult,
  setGeneratedHtml,
  isSharedMode = false
}: ResultsPanelProps) {
  return (
    <div className="h-full w-full overflow-hidden bg-white flex-1 flex flex-col">
      {/* Header with dropdown */}
      <div className="border-b border-gray-300 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-medium text-gray-800">AI Operation Screen</h2>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            >
              History <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            {showDropdown && (
              <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-gray-300 bg-white py-1 shadow-lg">
                {/* Tool Results */}
                {toolResults.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium uppercase text-gray-500">Tool Results</div>
                    {toolResults.map((result) => (
                      <button
                        key={result.id}
                        className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setCurrentDisplayResult(result)
                          setShowDropdown(false)
                        }}
                      >
                        <Clock className="mr-2 h-3 w-3 text-gray-500" />
                        <span className="truncate text-gray-700">{result.displayName}</span>
                      </button>
                    ))}
                  </>
                )}

                {/* Artifacts */}
                {artifacts.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium uppercase text-gray-500 border-t border-gray-200 mt-1">
                      Artifacts
                    </div>
                    {artifacts.map((artifact) => (
                      <button
                        key={artifact.id}
                        className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => {
                          setCurrentDisplayResult(artifact)
                          setGeneratedHtml(artifact.content)
                          setShowDropdown(false)
                        }}
                      >
                        <Sparkles className="mr-2 h-3 w-3 text-taupe" />
                        <span className="truncate text-gray-700">{artifact.name}</span>
                      </button>
                    ))}
                  </>
                )}

                {toolResults.length === 0 && artifacts.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No results yet</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Display */}
      <div className="flex-1 overflow-auto bg-white">
        {currentDisplayResult ? (
          'content' in currentDisplayResult ? (
            // This is an artifact
            <ArtifactViewer
              artifact={currentDisplayResult}
              streamingArtifact={streamingArtifact}
              artifactViewMode={artifactViewMode}
              setArtifactViewMode={setArtifactViewMode}
              setIsFullscreen={setIsFullscreen}
              isSharedMode={isSharedMode}
            />
          ) : (
            // This is a tool result
            <div className="p-4">
              <ToolResult result={currentDisplayResult} />
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
            <div className="mb-6 h-32 w-32 rounded-full bg-gradient-to-r from-taupe/20 via-taupe/30 to-taupe/20"></div>
            <h2 className="mb-2 text-2xl font-serif font-medium text-gray-800">AI Operation Screen</h2>
            <p className="max-w-md text-gray-500">
              Results and creations will appear here in real-time as Camus executes its beautifully useless operations.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 
