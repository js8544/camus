import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get recent credit milestone analytics events
    const recentMilestones = await prisma.analytics.findMany({
      where: {
        userId,
        event: {
          in: ['conversation_view_milestone', 'artifact_view_milestone']
        },
        // Look for milestones in the last hour
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000)
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 5
    })

    // Format the response with details about milestones
    const milestones = await Promise.all(recentMilestones.map(async (milestone) => {
      const itemType = milestone.event.startsWith('conversation') ? 'conversation' : 'artifact'
      const itemId = itemType === 'conversation'
        ? milestone.conversationId
        : milestone.artifactId

      let itemName = 'Shared content'

      // Get the item name if available
      if (itemId) {
        if (itemType === 'conversation') {
          const conversation = await prisma.conversation.findUnique({
            where: { id: itemId || '' },
            select: { title: true }
          })
          if (conversation?.title) {
            itemName = conversation.title
          }
        } else {
          const artifact = await prisma.artifact.findUnique({
            where: { id: itemId || '' },
            select: { name: true }
          })
          if (artifact?.name) {
            itemName = artifact.name
          }
        }
      }

      // Extract metadata
      const metadata = milestone.metadata as Prisma.JsonObject || {}
      const viewCount = typeof metadata.viewCount === 'number' ? metadata.viewCount : 100
      const creditsAwarded = typeof metadata.creditsAwarded === 'number' ? metadata.creditsAwarded : 3

      return {
        id: milestone.id,
        type: itemType,
        itemId,
        itemName,
        viewCount,
        creditsAwarded,
        timestamp: milestone.timestamp
      }
    }))

    return NextResponse.json({ milestones })
  } catch (error) {
    console.error("Error fetching credit milestones:", error)
    return NextResponse.json(
      { error: "Failed to fetch credit milestones" },
      { status: 500 }
    )
  }
} 
