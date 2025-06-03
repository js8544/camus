import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const artifacts = await prisma.artifact.findMany({
      select: {
        id: true,
        name: true,
        isPublic: true,
        shareSlug: true,
        createdAt: true,
        messageId: true,
        userId: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to last 20 artifacts
    })

    return Response.json({
      total: artifacts.length,
      artifacts: artifacts.map(artifact => ({
        id: artifact.id,
        name: artifact.name,
        isPublic: artifact.isPublic,
        shareSlug: artifact.shareSlug,
        createdAt: artifact.createdAt.toISOString(),
        messageId: artifact.messageId,
        userId: artifact.userId
      }))
    })

  } catch (error) {
    console.error("❌ Debug Artifacts Error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to fetch artifacts",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 
