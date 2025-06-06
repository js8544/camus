import { generateArtifactMetadata } from "@/lib/ai"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Update artifact metadata
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { displayTitle, displayDescription, category, previewImageUrl } = await request.json()

    // Validate that the artifact exists
    const existingArtifact = await prisma.artifact.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!existingArtifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      )
    }

    // Update the artifact
    const updatedArtifact = await prisma.artifact.update({
      where: { id },
      data: {
        displayTitle,
        displayDescription,
        category,
        previewImageUrl
      },
      select: {
        id: true,
        displayTitle: true,
        displayDescription: true,
        category: true,
        previewImageUrl: true
      }
    })

    console.log(`✅ Updated metadata for artifact ${id}`)

    return NextResponse.json({
      success: true,
      artifact: updatedArtifact
    })

  } catch (error) {
    console.error("❌ Error updating artifact metadata:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update artifact metadata",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Generate metadata using AI
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Get the artifact with its content
    const artifact = await prisma.artifact.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        content: true
      }
    })

    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      )
    }

    console.log(`🤖 Generating AI metadata for artifact ${id}`)

    // Generate metadata using AI
    const metadata = await generateArtifactMetadata(artifact.name, artifact.content)

    // Update the artifact with generated metadata
    const updatedArtifact = await prisma.artifact.update({
      where: { id },
      data: {
        displayTitle: metadata.displayTitle,
        displayDescription: metadata.displayDescription,
        category: metadata.category,
        previewImageUrl: metadata.previewImageUrl
      },
      select: {
        id: true,
        displayTitle: true,
        displayDescription: true,
        category: true,
        previewImageUrl: true
      }
    })

    console.log(`✅ Generated and saved AI metadata for artifact ${id}`)

    return NextResponse.json({
      success: true,
      artifact: updatedArtifact,
      generated: true
    })

  } catch (error) {
    console.error("❌ Error generating artifact metadata:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate artifact metadata",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
