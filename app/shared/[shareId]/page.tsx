"use client"

import { Button } from "@/components/ui/button"
import { Code, Download, ExternalLink, Eye, Sparkles } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

type SharedArtifact = {
  id: string
  name: string
  content: string
  createdAt: string
  slug: string
}

export default function SharedArtifactPage() {
  const params = useParams()
  const shareId = params.shareId as string
  const [artifact, setArtifact] = useState<SharedArtifact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'code'>('view')

  useEffect(() => {
    async function fetchSharedArtifact() {
      try {
        const response = await fetch(`/api/shared/${shareId}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError("This shared artifact could not be found or may have expired.")
          } else {
            setError("Failed to load the shared artifact.")
          }
          return
        }

        const data = await response.json()
        setArtifact(data)
      } catch (err) {
        console.error("Error fetching shared artifact:", err)
        setError("Failed to load the shared artifact.")
      } finally {
        setLoading(false)
      }
    }

    if (shareId) {
      fetchSharedArtifact()
    }
  }, [shareId])

  const handleDownload = () => {
    if (!artifact) return

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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-taupe rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading shared artifact...</p>
        </div>
      </div>
    )
  }

  if (error || !artifact) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-gray-800 mb-2">Artifact Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || "This shared artifact could not be found or may have expired."}
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-taupe hover:bg-taupe/90 text-white"
          >
            Go to CAMUS
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige">
      {/* Header */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-taupe rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-serif font-medium text-gray-800">CAMUS</h1>
                <span className="text-xs text-gray-500">Shared Artifact</span>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = '/'}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
          {/* Artifact Header */}
          <div className="border-b border-gray-300 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-gray-800">{artifact.name}</h2>
              </div>
              <span className="text-sm text-gray-500">
                Shared on {formatDate(artifact.createdAt)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <Button
                  variant={viewMode === 'view' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('view')}
                  className={viewMode === 'view'
                    ? 'bg-taupe hover:bg-taupe/90 text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                <Button
                  variant={viewMode === 'code' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('code')}
                  className={viewMode === 'code'
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
                <Download className="h-3 w-3 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100vh-300px)]">
            {viewMode === 'view' ? (
              <iframe
                srcDoc={artifact.content}
                title={artifact.name}
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-modals"
              />
            ) : (
              <div className="h-full overflow-auto bg-gray-50 p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {artifact.content}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Created with{" "}
            <a
              href="/"
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
