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

const categories = [
  { id: "featured", name: "Featured", color: "bg-gray-900 text-white" },
  { id: "education", name: "Education", color: "bg-gray-100 text-gray-700" },
  { id: "business", name: "Business", color: "bg-gray-100 text-gray-700" },
  { id: "game", name: "Game", color: "bg-gray-100 text-gray-700" },
  { id: "productivity", name: "Productivity", color: "bg-gray-100 text-gray-700" },
  { id: "lifestyle", name: "Lifestyle", color: "bg-gray-100 text-gray-700" },
  { id: "literature", name: "Literature", color: "bg-gray-100 text-gray-700" },
  { id: "research", name: "Research", color: "bg-gray-100 text-gray-700" },
  { id: "other", name: "Other", color: "bg-gray-100 text-gray-700" },
]

export default function Cases({ artifactIds }: CasesProps) {
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("featured")

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        setLoading(true)
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

        // Mark first few as featured
        const processedArtifacts = data.artifacts.map((artifact: any, index: number) => ({
          ...artifact,
          isFeatured: index < 4, // First 4 are featured
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
      fetchArtifacts()
    }
  }, [artifactIds])

  const filteredArtifacts = artifacts.filter(artifact => {
    if (activeCategory === "featured") {
      return artifact.isFeatured
    }
    return artifact.categoryId === activeCategory
  })

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-2">Use cases</p>
            <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-800 mb-4">
              Explore use cases from our official collection.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn how CAMUS handles real-world tasks through step-by-step meaningless demonstrations.
            </p>
          </div>

          {/* Category Tabs Skeleton */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category) => (
              <div key={category.id} className="px-4 py-2 rounded-full bg-gray-200 animate-pulse h-10 w-20"></div>
            ))}
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
            <p className="text-sm text-gray-500 mb-2">Use cases</p>
            <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-800 mb-4">
              Explore use cases from our official collection.
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
          <p className="text-sm text-gray-500 mb-2">Use cases</p>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-gray-800 mb-4">
            Explore use cases from our official collection.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn how CAMUS handles real-world tasks through step-by-step meaningless demonstrations.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === category.id
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              {category.name}
            </button>
          ))}
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

                  <p className="text-xs text-gray-500 line-clamp-2 h-8 leading-4">
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
