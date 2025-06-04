import { DownloadButton } from "@/components/shared/download-button"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

// Helper function to extract artifact from message content
const extractArtifactFromMessage = (content: string) => {
  const artifactMatch = content.match(/```artifact\n([\s\S]*?)\n```/)
  if (artifactMatch) {
    return artifactMatch[1]
  }
  return null
}

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

export default async function SharedMessagePage({
  params
}: {
  params: Promise<{ messageId: string }>
}) {
  const { messageId } = await params

  try {
    // Find the message containing the artifact
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      notFound()
    }

    // Extract artifact content from message
    const artifactContent = extractArtifactFromMessage(message.content)

    if (!artifactContent) {
      notFound()
    }

    const artifactTitle = extractHtmlTitle(artifactContent)
    const filename = `${artifactTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-medium text-gray-900">{artifactTitle}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Shared artifact from CAMUS
                </p>
              </div>
              <div className="flex space-x-3">
                <DownloadButton content={artifactContent} filename={filename} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <iframe
              srcDoc={artifactContent}
              title={artifactTitle}
              className="w-full h-[600px] border-none"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>Created with</span>
              <a
                href="/"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                CAMUS
              </a>
              <span>•</span>
              <span>Creating Absurd, Meaningless and Useless Stuff</span>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading shared artifact:', error)
    notFound()
  }
} 
