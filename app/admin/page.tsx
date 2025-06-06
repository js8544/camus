"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Code,
  Download,
  Edit,
  ExternalLink,
  Eye,
  Folder,
  Minus,
  Plus,
  Save,
  Search,
  Sparkles,
  Star,
  User,
  XCircle
} from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Admin email validation
const isAdminUser = (email: string | null | undefined): boolean => {
  if (!email) {
    console.log("❌ No email provided for admin check")
    return false
  }

  // Get admin emails from environment or use fallback
  const adminEmails = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    // Add your actual email here as a fallback - REPLACE THIS
  ].filter(Boolean)

  console.log("🔍 Client-side admin check:")
  console.log("  User email:", email)
  console.log("  Admin emails:", adminEmails)
  console.log("  NEXT_PUBLIC_ADMIN_EMAIL env:", process.env.NEXT_PUBLIC_ADMIN_EMAIL)

  const isAdmin = adminEmails.includes(email)
  console.log("  Is admin:", isAdmin)

  return isAdmin
}

interface Artifact {
  id: string
  name: string
  displayTitle: string | null
  displayDescription: string | null
  category: string | null
  previewImageUrl: string | null
  views: number
  createdAt: string
  shareSlug: string | null
  user: {
    id: string
    name: string | null
    avatar: string | null
  } | null
  conversation?: {
    id: string
    title: string | null
    shareSlug: string | null
  } | null
  isInDemoCases?: boolean
  isFeatured?: boolean
}

const categories = [
  "All",
  "Featured",
  "Education",
  "Business",
  "Game",
  "Productivity",
  "Lifestyle",
  "Literature",
  "Research",
  "Other"
]

const categoryOptions = [
  "Education",
  "Business",
  "Game",
  "Productivity",
  "Lifestyle",
  "Literature",
  "Research",
  "Other"
]

export default function AdminPortal() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // All useState hooks must be called before any conditional returns
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([])
  const [demoCaseIds, setDemoCaseIds] = useState<string[]>([])
  const [featuredIds, setFeaturedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [updatingArtifact, setUpdatingArtifact] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [generateCodeModal, setGenerateCodeModal] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [lastApplied, setLastApplied] = useState<Date | null>(null)

  // Edit metadata modal state
  const [editModal, setEditModal] = useState(false)
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null)
  const [editForm, setEditForm] = useState({
    displayTitle: "",
    displayDescription: "",
    category: "",
    previewImageUrl: ""
  })
  const [editLoading, setEditLoading] = useState(false)
  const [generateAILoading, setGenerateAILoading] = useState(false)

  // Load current demo case IDs from the API
  const loadDemoCaseIds = async () => {
    try {
      const response = await fetch('/api/admin/demo-cases')
      const data = await response.json()

      if (data.success) {
        setDemoCaseIds(data.demoCaseIds)
        setFeaturedIds(data.featuredIds)
      }
    } catch (error) {
      console.error('Error loading demo case configuration:', error)
      // Fallback to hardcoded values
      const fallbackDemoCaseIds = [
        "cmbj9sdr9000bjr0azcwcf0ve-blfwba",
        "cmbj9skpp0003l30anyy61ecz-vo7hug",
        "cmbj9t3o50007l30ar0ugvtxv-uti1zm",
        "cmbj9tgkl000bl30ae5exnv3w-9dig7d",
        "cmbj9tgkl000bl30ae5exnv3w-i4jyhm",
        "cmbj9ts8y000fl30abozvf6ep-oa1yil",
        "cmbj9tylq000jl30aamgl3s3k-2dida",
        "cmbj9u76x000nl30aw1hh9jdg-2eoec4",
        "cmbj9u76x000nl30aw1hh9jdg-il69vl",
        "cmbj9u76x000nl30aw1hh9jdg-wwwa25",
        "cmbj9vfah000rl30ag7yy395o-imf70t"
      ]
      setDemoCaseIds(fallbackDemoCaseIds)
      setFeaturedIds(fallbackDemoCaseIds.slice(0, 4))
    }
  }

  const fetchArtifacts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/artifacts')

      if (!response.ok) {
        throw new Error('Failed to fetch artifacts')
      }

      const data = await response.json()
      setArtifacts(data.artifacts || [])
    } catch (error) {
      console.error('Error fetching artifacts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Admin access control - MUST be first useEffect
  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/signin?callbackUrl=/admin")
      return
    }

    if (!isAdminUser(session.user?.email)) {
      router.push("/")
      return
    }
  }, [session, status, router])

  // Load data - MUST be second useEffect
  useEffect(() => {
    loadDemoCaseIds()
    fetchArtifacts()
  }, [])

  // Filter artifacts - MUST be third useEffect
  useEffect(() => {
    let filtered = artifacts

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(artifact =>
        artifact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.displayTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.displayDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "All") {
      if (selectedCategory === "Featured") {
        filtered = filtered.filter(artifact => featuredIds.includes(artifact.id))
      } else {
        filtered = filtered.filter(artifact =>
          artifact.category?.toLowerCase() === selectedCategory.toLowerCase()
        )
      }
    }

    // Mark artifacts that are in demo cases and featured
    filtered = filtered.map(artifact => ({
      ...artifact,
      isInDemoCases: demoCaseIds.includes(artifact.id),
      isFeatured: featuredIds.includes(artifact.id)
    }))

    setFilteredArtifacts(filtered)
  }, [artifacts, searchQuery, selectedCategory, demoCaseIds, featuredIds])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized message if not admin
  if (!session || !isAdminUser(session.user?.email)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin portal.</p>
          <Button onClick={() => router.push("/")} variant="outline">
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  const toggleDemoCase = async (artifactId: string) => {
    setUpdatingArtifact(artifactId)

    try {
      const isCurrentlyInDemo = demoCaseIds.includes(artifactId)

      if (isCurrentlyInDemo) {
        // Remove from demo cases
        const newDemoCaseIds = demoCaseIds.filter(id => id !== artifactId)
        setDemoCaseIds(newDemoCaseIds)

        // Also remove from featured if it was featured
        if (featuredIds.includes(artifactId)) {
          setFeaturedIds(featuredIds.filter(id => id !== artifactId))
        }
      } else {
        // Add to demo cases
        setDemoCaseIds([...demoCaseIds, artifactId])
      }

    } catch (error) {
      console.error('Error updating demo case:', error)
    } finally {
      setUpdatingArtifact(null)
    }
  }

  const toggleFeatured = async (artifactId: string) => {
    setUpdatingArtifact(artifactId)

    try {
      const isCurrentlyFeatured = featuredIds.includes(artifactId)

      if (isCurrentlyFeatured) {
        // Remove from featured
        setFeaturedIds(featuredIds.filter(id => id !== artifactId))
      } else {
        // Add to featured (and to demo cases if not already there)
        if (!demoCaseIds.includes(artifactId)) {
          setDemoCaseIds([...demoCaseIds, artifactId])
        }
        setFeaturedIds([...featuredIds, artifactId])
      }

    } catch (error) {
      console.error('Error updating featured status:', error)
    } finally {
      setUpdatingArtifact(null)
    }
  }

  const openEditModal = (artifact: Artifact) => {
    setEditingArtifact(artifact)
    setEditForm({
      displayTitle: artifact.displayTitle || "",
      displayDescription: artifact.displayDescription || "",
      category: artifact.category || "",
      previewImageUrl: artifact.previewImageUrl || ""
    })
    setEditModal(true)
  }

  const closeEditModal = () => {
    setEditModal(false)
    setEditingArtifact(null)
    setEditForm({
      displayTitle: "",
      displayDescription: "",
      category: "",
      previewImageUrl: ""
    })
  }

  const saveMetadata = async () => {
    if (!editingArtifact) return

    setEditLoading(true)
    try {
      const response = await fetch(`/api/admin/artifacts/${editingArtifact.id}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (data.success) {
        // Update the artifacts state
        setArtifacts(artifacts.map(artifact =>
          artifact.id === editingArtifact.id
            ? { ...artifact, ...data.artifact }
            : artifact
        ))

        closeEditModal()
        alert('✅ Metadata updated successfully!')
      } else {
        throw new Error(data.error || 'Failed to update metadata')
      }
    } catch (error) {
      console.error('Error updating metadata:', error)
      alert('Failed to update metadata: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setEditLoading(false)
    }
  }

  const generateAIMetadata = async () => {
    if (!editingArtifact) return

    setGenerateAILoading(true)
    try {
      const response = await fetch(`/api/admin/artifacts/${editingArtifact.id}/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (data.success) {
        // Update the form with AI-generated metadata
        setEditForm({
          displayTitle: data.artifact.displayTitle || "",
          displayDescription: data.artifact.displayDescription || "",
          category: data.artifact.category || "",
          previewImageUrl: data.artifact.previewImageUrl || ""
        })

        // Update the artifacts state
        setArtifacts(artifacts.map(artifact =>
          artifact.id === editingArtifact.id
            ? { ...artifact, ...data.artifact }
            : artifact
        ))

        alert('✅ AI metadata generated successfully!')
      } else {
        throw new Error(data.error || 'Failed to generate metadata')
      }
    } catch (error) {
      console.error('Error generating AI metadata:', error)
      alert('Failed to generate AI metadata: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setGenerateAILoading(false)
    }
  }

  const saveConfiguration = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/admin/demo-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demoCaseIds,
          featuredIds
        })
      })

      const data = await response.json()

      if (data.success) {
        setLastSaved(new Date())
        console.log('✅ Configuration saved successfully')
        alert('✅ Configuration saved! Changes are now live on the frontend.')
      } else {
        throw new Error(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      alert('Failed to save configuration: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const generateCode = async () => {
    try {
      const response = await fetch('/api/admin/demo-cases', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demoCaseIds
        })
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedCode(data.codeToUpdate)
        setGenerateCodeModal(true)
      } else {
        throw new Error(data.error || 'Failed to generate code')
      }
    } catch (error) {
      console.error('Error generating code:', error)
      alert('Failed to generate code: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const exportConfiguration = () => {
    const config = {
      demoCaseIds,
      featuredIds: featuredIds,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'demo-cases-config.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
      .then(() => alert('Code copied to clipboard!'))
      .catch(err => console.error('Failed to copy code:', err))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-taupe mx-auto mb-4"></div>
            <p className="text-gray-500">Loading artifacts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-serif font-medium tracking-tight text-gray-800 mb-2">
                Demo Cases Portal
              </h1>
              <p className="text-gray-600">
                Manage featured artifacts and demo cases for the front page
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={saveConfiguration}
                disabled={saving}
                className="bg-taupe hover:bg-taupe/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Config'}
              </Button>

              <Button
                onClick={generateCode}
                variant="outline"
              >
                <Code className="h-4 w-4 mr-2" />
                Generate Code
              </Button>

              <Button onClick={exportConfiguration} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Save Status */}
          {lastSaved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                Configuration saved at {lastSaved.toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-taupe" />
                  <div>
                    <p className="text-sm text-gray-500">Total Artifacts</p>
                    <p className="text-xl font-semibold">{artifacts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">In Demo Cases</p>
                    <p className="text-xl font-semibold">{demoCaseIds.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-500">Featured</p>
                    <p className="text-xl font-semibold">{featuredIds.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Views</p>
                    <p className="text-xl font-semibold">
                      {artifacts.reduce((sum, artifact) => sum + artifact.views, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search artifacts by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Artifacts</TabsTrigger>
            <TabsTrigger value="demo">Demo Cases ({demoCaseIds.length})</TabsTrigger>
            <TabsTrigger value="featured">Featured ({featuredIds.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ArtifactGrid
              artifacts={filteredArtifacts}
              onToggleDemoCase={toggleDemoCase}
              onToggleFeatured={toggleFeatured}
              onEditMetadata={openEditModal}
              updatingArtifact={updatingArtifact}
            />
          </TabsContent>

          <TabsContent value="demo" className="space-y-4">
            <ArtifactGrid
              artifacts={filteredArtifacts.filter(a => a.isInDemoCases)}
              onToggleDemoCase={toggleDemoCase}
              onToggleFeatured={toggleFeatured}
              onEditMetadata={openEditModal}
              updatingArtifact={updatingArtifact}
            />
          </TabsContent>

          <TabsContent value="featured" className="space-y-4">
            <ArtifactGrid
              artifacts={filteredArtifacts.filter(a => a.isFeatured)}
              onToggleDemoCase={toggleDemoCase}
              onToggleFeatured={toggleFeatured}
              onEditMetadata={openEditModal}
              updatingArtifact={updatingArtifact}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Code Generation Modal */}
      {generateCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Code for Frontend</h2>
              <button
                onClick={() => setGenerateCodeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Replace the <code className="bg-gray-100 px-1 rounded">artifactIds</code> array in <code className="bg-gray-100 px-1 rounded">app/page.tsx</code> with the following code:
            </p>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
              <pre className="text-sm">{generatedCode}</pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyCodeToClipboard} className="flex-1">
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => setGenerateCodeModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editModal && editingArtifact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Metadata - {editingArtifact.name}</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Title
                </label>
                <Input
                  value={editForm.displayTitle}
                  onChange={(e) => setEditForm({ ...editForm, displayTitle: e.target.value })}
                  placeholder="Enter a catchy title for the front page"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Description
                </label>
                <Textarea
                  value={editForm.displayDescription}
                  onChange={(e) => setEditForm({ ...editForm, displayDescription: e.target.value })}
                  placeholder="Enter an engaging description (10-20 words)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview Image URL
                </label>
                <Input
                  value={editForm.previewImageUrl}
                  onChange={(e) => setEditForm({ ...editForm, previewImageUrl: e.target.value })}
                  placeholder="Enter image URL for preview (optional)"
                />
              </div>

              {/* AI Generate Button */}
              <div className="border-t pt-4">
                <Button
                  onClick={generateAIMetadata}
                  disabled={generateAILoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generateAILoading ? 'Generating...' : 'Generate with AI'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Use AI to automatically generate metadata based on the artifact content
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={saveMetadata}
                disabled={editLoading}
                className="flex-1 bg-taupe hover:bg-taupe/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={closeEditModal}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ArtifactGridProps {
  artifacts: Artifact[]
  onToggleDemoCase: (id: string) => void
  onToggleFeatured: (id: string) => void
  onEditMetadata: (artifact: Artifact) => void
  updatingArtifact: string | null
}

function ArtifactGrid({ artifacts, onToggleDemoCase, onToggleFeatured, onEditMetadata, updatingArtifact }: ArtifactGridProps) {
  if (artifacts.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No artifacts found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artifacts.map((artifact) => (
        <Card key={artifact.id} className="overflow-hidden">
          <CardHeader className="p-0">
            {/* Preview Image */}
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {artifact.previewImageUrl ? (
                <Image
                  src={artifact.previewImageUrl}
                  alt={artifact.displayTitle || artifact.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-beige to-taupe/20 flex items-center justify-center">
                  <Folder className="w-12 h-12 text-taupe/50" />
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-2 left-2 flex gap-2">
                {artifact.isFeatured && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {artifact.isInDemoCases && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Demo
                  </Badge>
                )}
              </div>

              {/* Category Badge */}
              {artifact.category && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-white/90">
                    {artifact.category}
                  </Badge>
                </div>
              )}

              {/* Edit Button */}
              <div className="absolute bottom-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEditMetadata(artifact)}
                  className="bg-white/90 hover:bg-white"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Title and Description */}
              <div>
                {artifact.conversation?.shareSlug ? (
                  <Link
                    href={`/shared/conversation/${artifact.conversation.shareSlug}`}
                    target="_blank"
                    className="block group"
                  >
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-taupe transition-colors cursor-pointer flex items-center gap-1">
                      {artifact.displayTitle || artifact.name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </h3>
                  </Link>
                ) : (
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {artifact.displayTitle || artifact.name}
                  </h3>
                )}
                {artifact.displayDescription && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {artifact.displayDescription}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <Eye className="h-3 w-3" />
                  <span>{artifact.views} views</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(artifact.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* User */}
              {artifact.user && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>{artifact.user.name || 'Anonymous'}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant={artifact.isInDemoCases ? "default" : "outline"}
                  onClick={() => onToggleDemoCase(artifact.id)}
                  disabled={updatingArtifact === artifact.id}
                  className="flex-1"
                >
                  {artifact.isInDemoCases ? (
                    <>
                      <Minus className="h-3 w-3 mr-1" />
                      Remove from Demo
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Add to Demo
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant={artifact.isFeatured ? "default" : "outline"}
                  onClick={() => onToggleFeatured(artifact.id)}
                  disabled={updatingArtifact === artifact.id}
                  className={artifact.isFeatured ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                >
                  <Star className="h-3 w-3" />
                </Button>

                {artifact.shareSlug && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    title="View artifact directly"
                  >
                    <Link href={`/shared/artifact/${artifact.id}`} target="_blank">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 
