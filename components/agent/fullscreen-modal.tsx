"use client"

import { Button } from "@/components/ui/button"
import { Code, Download, Eye, X } from "lucide-react"
import { ArtifactItem } from "./artifact-viewer"

type FullscreenModalProps = {
  isOpen: boolean
  artifact: ArtifactItem
  artifactViewMode: 'view' | 'code'
  setArtifactViewMode: (mode: 'view' | 'code') => void
  onClose: () => void
}

export function FullscreenModal({
  isOpen,
  artifact,
  artifactViewMode,
  setArtifactViewMode,
  onClose
}: FullscreenModalProps) {
  if (!isOpen) return null

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.name.replace(/\s+/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Fullscreen Header */}
      <div className="border-b border-gray-300 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-serif font-medium text-gray-800">{artifact.name}</h3>
            <span className="text-sm text-gray-500">{formatTimestamp(artifact.timestamp)}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tabs in fullscreen */}
            <div className="flex space-x-1 mr-4">
              <Button
                variant={artifactViewMode === 'view' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setArtifactViewMode('view')}
                className={artifactViewMode === 'view'
                  ? 'bg-taupe hover:bg-taupe/90 text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }
              >
                <Eye className="mr-1 h-3 w-3" />
                View
              </Button>
              <Button
                variant={artifactViewMode === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setArtifactViewMode('code')}
                className={artifactViewMode === 'code'
                  ? 'bg-taupe hover:bg-taupe/90 text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                }
              >
                <Code className="mr-1 h-3 w-3" />
                Code
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen Content */}
      <div className="flex-1 overflow-hidden">
        {artifactViewMode === 'view' ? (
          <iframe
            srcDoc={artifact.content}
            title={artifact.name}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-modals"
          />
        ) : (
          <div className="h-full overflow-auto bg-gray-50 p-6">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {artifact.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 
