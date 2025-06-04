"use client"

import { DownloadButton } from "@/components/shared/download-button"
import { Button } from "@/components/ui/button"
import { ExternalLink, Sparkles, User } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

// Helper function to extract HTML title
const extractHtmlTitle = (html: string): string => {
  const titleMatch = html.match(/<title>(.*?)<\/title>/)
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1]
  }
  const h1Match = html.match(/<h1>(.*?)<\/h1>/)
  if (h1Match && h1Match[1]) {
    return h1Match[1]
  }
  return 'Generated Artifact'
}

// Format date helper function
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

type SharedArtifactData = {
  id: string
  messageId: string
  title: string
  content: string
  createdAt: string
  views: number
  user: {
    id: string
    name: string
    avatar?: string
  } | null
}

export default function SharedArtifactPage() {
  const params = useParams()
  const messageId = params.messageId as string
  const [artifact, setArtifact] = useState<SharedArtifactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSharedArtifact() {
      try {
        const response = await fetch(`/api/shared/artifact/${messageId}`)

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

    if (messageId) {
      fetchSharedArtifact()
    }
  }, [messageId])

  if (loading) {
    return (
      <div className="h-screen bg-beige flex items-center justify-center">
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
      <div className="h-screen bg-beige flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-gray-800 mb-2">Artifact Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || "This shared artifact could not be found or may have expired."}
          </p>
          <Link href="/agent">
            <Button
              className="bg-taupe hover:bg-taupe/90 text-white"
            >
              Go to CAMUS
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const filename = `${artifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`

  return (
    <div className="h-screen overflow-hidden bg-beige text-gray-700 font-sans">
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
                <span className="text-xs text-gray-500">Shared Artifact</span>
              </div>
              <span className="text-sm text-gray-600 ml-4">
                {artifact.title}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {artifact.user && (
                <div className="flex items-center mr-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-2">
                    {artifact.user.avatar ? (
                      <img
                        src={artifact.user.avatar}
                        alt={artifact.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {artifact.user.name}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-500">
                Shared on {formatDate(artifact.createdAt)} • {artifact.views} views
              </span>
              <DownloadButton content={artifact.content} filename={filename} />
              <Link href="/agent">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open CAMUS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-100px)] overflow-hidden">
        <div className="bg-white h-full w-full border-t border-gray-200">
          <iframe
            srcDoc={artifact.content}
            title={artifact.title}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-modals"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 px-4 py-2">
        <div className="text-center text-sm text-gray-500">
          <p>
            Created with{" "}
            <Link
              href="/agent"
              className="text-taupe hover:text-taupe/80 font-medium"
            >
              CAMUS AI
            </Link>
            {" "}— Creating Absurd, Meaningless and Useless Stuff
          </p>
        </div>
      </div>
    </div>
  )
} 
