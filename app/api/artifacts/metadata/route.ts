import { generateArtifactMetadata } from "@/lib/ai"
import { extractHtmlTitle, extractPreviewImageUrl } from "@/lib/artifact-utils"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Generate metadata using the AI function from ai.ts
async function generateMetadata(content: string, name: string) {
  try {
    // Use the AI-powered metadata generation
    return await generateArtifactMetadata(name, content)
  } catch (error) {
    console.error('AI metadata generation failed, using fallback:', error)

    // Fallback to simple extraction
    const title = extractHtmlTitle(content) || name
    const previewImageUrl = extractPreviewImageUrl(content)

    // Simple category assignment based on content patterns
    let category = "Other"
    const contentLower = content.toLowerCase()

    if (contentLower.includes("chart") || contentLower.includes("graph") || contentLower.includes("data")) {
      category = "Business"
    } else if (contentLower.includes("travel") || contentLower.includes("destination") || contentLower.includes("itinerary")) {
      category = "Lifestyle"
    } else if (contentLower.includes("recipe") || contentLower.includes("food") || contentLower.includes("cooking")) {
      category = "Lifestyle"
    } else if (contentLower.includes("workout") || contentLower.includes("exercise") || contentLower.includes("fitness")) {
      category = "Lifestyle"
    } else if (contentLower.includes("business") || contentLower.includes("strategy") || contentLower.includes("corporate")) {
      category = "Business"
    } else if (contentLower.includes("game") || contentLower.includes("quiz") || contentLower.includes("interactive")) {
      category = "Game"
    } else if (contentLower.includes("learn") || contentLower.includes("course") || contentLower.includes("tutorial")) {
      category = "Education"
    } else if (contentLower.includes("research") || contentLower.includes("study") || contentLower.includes("analysis")) {
      category = "Research"
    } else if (contentLower.includes("book") || contentLower.includes("story") || contentLower.includes("literature")) {
      category = "Literature"
    } else if (contentLower.includes("productivity") || contentLower.includes("tool") || contentLower.includes("utility")) {
      category = "Productivity"
    }

    return {
      displayTitle: title.length > 60 ? title.substring(0, 57) + "..." : title,
      displayDescription: "An interactive artifact featuring unique functionality and design. Explore this creation and discover its capabilities.",
      category,
      previewImageUrl
    }
  }
}

// Helper function to map categories to IDs (convert to lowercase)
function getCategoryId(category: string): string {
  return category.toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const { artifactIds } = await request.json()

    if (!artifactIds || !Array.isArray(artifactIds)) {
      return NextResponse.json(
        { error: "artifactIds array is required" },
        { status: 400 }
      )
    }

    console.log("🔍 Fetching metadata for artifacts:", artifactIds)

    // Fetch all artifacts with their conversation's shareSlug
    const artifacts = await prisma.artifact.findMany({
      where: {
        id: { in: artifactIds }
      },
      select: {
        id: true,
        name: true,
        content: true,
        displayTitle: true,
        displayDescription: true,
        category: true,
        previewImageUrl: true,
        shareSlug: true,
        conversationId: true,
        createdAt: true,
        conversation: {
          select: {
            shareSlug: true
          }
        }
      }
    })

    console.log(`📋 Found ${artifacts.length} artifacts out of ${artifactIds.length} requested`)

    // Process each artifact to ensure metadata exists
    const processedArtifacts = await Promise.all(
      artifacts.map(async (artifact) => {
        let needsUpdate = false
        let updates: any = {}

        // Check if metadata fields are missing
        if (!artifact.displayTitle || !artifact.displayDescription || !artifact.category) {
          console.log(`🔧 Generating metadata for artifact ${artifact.id}`)

          const metadata = await generateMetadata(artifact.content, artifact.name)

          if (!artifact.displayTitle) {
            updates.displayTitle = metadata.displayTitle
            needsUpdate = true
          }
          if (!artifact.displayDescription) {
            updates.displayDescription = metadata.displayDescription
            needsUpdate = true
          }
          if (!artifact.category) {
            updates.category = metadata.category
            needsUpdate = true
          }
          if (!artifact.previewImageUrl && metadata.previewImageUrl) {
            updates.previewImageUrl = metadata.previewImageUrl
            needsUpdate = true
          }
        }

        // Update the artifact if needed
        if (needsUpdate) {
          await prisma.artifact.update({
            where: { id: artifact.id },
            data: updates
          })

          console.log(`✅ Updated metadata for artifact ${artifact.id}`)

          // Return updated artifact
          return {
            ...artifact,
            ...updates
          }
        }

        return artifact
      })
    )

    // Create the response with properly formatted data
    const artifactsWithUrls = await Promise.all(
      processedArtifacts.map(async (artifact) => {
        let shareUrl = null

        // Check if conversation has a shareSlug
        if (artifact.conversation?.shareSlug) {
          shareUrl = `/shared/conversation/${artifact.conversation.shareSlug}`
        } else {
          // Auto-share the conversation if it doesn't have a shareSlug
          try {
            const shareSlug = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

            await prisma.conversation.update({
              where: { id: artifact.conversationId },
              data: {
                isPublic: true,
                shareSlug: shareSlug
              }
            })

            shareUrl = `/shared/conversation/${shareSlug}`
            console.log(`🔗 Auto-shared conversation ${artifact.conversationId} with slug ${shareSlug}`)
          } catch (shareError) {
            console.error(`❌ Failed to auto-share conversation ${artifact.conversationId}:`, shareError)
            shareUrl = null
          }
        }

        return {
          id: artifact.id,
          title: artifact.displayTitle || artifact.name,
          description: artifact.displayDescription || "A mysteriously purposeless creation.",
          category: artifact.category || "Other",
          categoryId: getCategoryId(artifact.category || "Other"),
          previewImageUrl: artifact.previewImageUrl,
          shareUrl,
          createdAt: artifact.createdAt
        }
      })
    )

    console.log(`🎯 Returning ${artifactsWithUrls.length} processed artifacts`)

    return NextResponse.json({
      success: true,
      artifacts: artifactsWithUrls
    })

  } catch (error) {
    console.error("❌ Error fetching artifact metadata:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch artifact metadata"
      },
      { status: 500 }
    )
  }
} 
