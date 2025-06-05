import { ConversationService } from "@/lib/db/conversation-service"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category') || undefined

    // Get public artifacts with metadata
    const artifacts = await ConversationService.getPublicArtifactsWithMetadata(
      Math.min(limit, 50), // Cap at 50
      Math.max(offset, 0), // Ensure non-negative
      category
    )

    // Get categories for filtering
    const categories = await ConversationService.getArtifactCategories()

    return NextResponse.json({
      artifacts,
      categories,
      pagination: {
        limit,
        offset,
        hasMore: artifacts.length === limit // Simple has-more logic
      }
    })

  } catch (error) {
    console.error("❌ Public Artifacts API Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch public artifacts",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
