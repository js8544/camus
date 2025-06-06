"use client"

import { ExternalLink, Folder } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface CaseArtifact {
  id: string
  title: string
  description: string
  category: string
  categoryId: string
  previewImageUrl?: string
  shareUrl: string
  createdAt: string
  isFeatured?: boolean
}

interface CasesProps {
  artifactIds: string[]
}

export default function Cases({ artifactIds }: CasesProps) {
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [featuredIds, setFeaturedIds] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // First, fetch the featured IDs from admin configuration
        const configResponse = await fetch('/api/admin/demo-cases')
        const configData = await configResponse.json()

        let actualFeaturedIds: string[] = []
        if (configData.success && configData.featuredIds) {
          actualFeaturedIds = configData.featuredIds
          setFeaturedIds(actualFeaturedIds)
        }

        // Then fetch the artifacts metadata
        const response = await fetch('/api/artifacts/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ artifactIds }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch artifacts')
        }

        // Mark artifacts as featured based on admin configuration
        const processedArtifacts = data.artifacts.map((artifact: any) => ({
          ...artifact,
          isFeatured: actualFeaturedIds.includes(artifact.id)
        }))

        setArtifacts(processedArtifacts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cases')
        console.error('Error fetching artifacts:', err)
      } finally {
        setLoading(false)
      }
    }

    if (artifactIds.length > 0) {
      fetchData()
    }
  }, [artifactIds])

  const filteredArtifacts = artifacts.filter(artifact => {
    return artifact.isFeatured
  })

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-2">Featured Cases</p>
            <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-800 mb-4">
              Explore featured cases from our official collection.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn how CAMUS handles real-world tasks through step-by-step meaningless demonstrations.
            </p>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-2">Featured Cases</p>
            <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-800 mb-4">
              Explore featured cases from our official collection.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn how CAMUS handles real-world tasks through step-by-step meaningless demonstrations.
            </p>
          </div>

          <div className="text-center py-12">
            <p className="text-gray-500">
              Even our case studies are too useless to load properly. How meta!
            </p>
            <p className="text-sm text-gray-400 mt-2">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="cases" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-2">Featured Cases</p>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-800 mb-4">
            Explore featured cases from our official collection.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn how CAMUS handles real-world tasks through step-by-step meaningless demonstrations.
          </p>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredArtifacts.map((artifact) => (
            <Link
              key={artifact.id}
              href={artifact.shareUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-taupe hover:shadow-lg group-hover:-translate-y-1">
                {/* Icon and Preview */}
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
                  {artifact.previewImageUrl ? (
                    <Image
                      src={artifact.previewImageUrl}
                      alt={artifact.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-beige to-taupe/20 flex items-center justify-center">
                      <Folder className="w-12 h-12 text-taupe/50" />
                    </div>
                  )}

                  {/* Category Icon */}
                  <div className="absolute top-3 left-3">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {artifact.category.charAt(0)}
                      </span>
                    </div>
                  </div>

                  {/* External Link Icon */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="rounded-full bg-white/90 p-1.5 backdrop-blur-sm">
                      <ExternalLink className="w-3 h-3 text-gray-700" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-taupe transition-colors text-sm h-8 leading-4 line-clamp-2 flex items-start">
                    {artifact.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-4 h-16 leading-4">
                    {artifact.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredArtifacts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No case studies found in this category. The meaninglessness is so profound it defies categorization!
            </p>
          </div>
        )}
      </div>
    </section>
  )
} 
