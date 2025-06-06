import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined

    // Build where clause
    const whereClause: any = {}

    if (category && category !== 'All') {
      whereClause.category = category
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayTitle: { contains: search, mode: 'insensitive' } },
        { displayDescription: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch artifacts with metadata
    const artifacts = await prisma.artifact.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200), // Cap at 200
      skip: Math.max(offset, 0),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true
          }
        },
        conversation: {
          select: {
            id: true,
            title: true,
            shareSlug: true
          }
        }
      }
    })

    // Format response and auto-share conversations if needed
    const formattedArtifacts = await Promise.all(artifacts.map(async (artifact) => {
      let conversation = artifact.conversation

      // Auto-share conversation if it doesn't have a shareSlug
      if (conversation && !conversation.shareSlug) {
        try {
          const shareSlug = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              isPublic: true,
              shareSlug: shareSlug
            }
          })

          conversation = {
            ...conversation,
            shareSlug: shareSlug
          }

          console.log(`🔗 Auto-shared conversation ${conversation.id} with slug ${shareSlug}`)
        } catch (shareError) {
          console.error(`❌ Failed to auto-share conversation ${conversation.id}:`, shareError)
        }
      }

      return {
        id: artifact.id,
        name: artifact.name,
        displayTitle: artifact.displayTitle,
        displayDescription: artifact.displayDescription,
        category: artifact.category,
        previewImageUrl: artifact.previewImageUrl,
        views: artifact.views,
        createdAt: artifact.createdAt.toISOString(),
        shareSlug: artifact.shareSlug,
        isPublic: artifact.isPublic,
        user: artifact.user ? {
          id: artifact.user.id,
          name: artifact.user.name,
          avatar: artifact.user.avatar || artifact.user.image
        } : null,
        conversation: conversation
      }
    }))

    // Get total count for pagination
    const totalCount = await prisma.artifact.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      artifacts: formattedArtifacts,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (offset + limit) < totalCount
      }
    })

  } catch (error) {
    console.error("❌ Admin Artifacts API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch artifacts",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
