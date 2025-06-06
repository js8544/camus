import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// For now, we'll store the configuration in a JSON file or database
// In a production setup, you might want to store this in a dedicated configuration table

// Get demo cases configuration from database
export async function GET() {
  try {
    // Try to get configuration from database
    const config = await prisma.configuration.findUnique({
      where: { key: "demo_cases" }
    })

    if (config) {
      // Return stored configuration
      const data = config.value as { demoCaseIds: string[], featuredIds: string[] }
      return NextResponse.json({
        success: true,
        demoCaseIds: data.demoCaseIds || [],
        featuredIds: data.featuredIds || []
      })
    } else {
      // Return default configuration if none exists
      const demoCaseIds = [
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
      const featuredIds = demoCaseIds.slice(0, 4)

      // Store default configuration in database
      await prisma.configuration.create({
        data: {
          key: "demo_cases",
          value: { demoCaseIds, featuredIds }
        }
      })

      return NextResponse.json({
        success: true,
        demoCaseIds,
        featuredIds
      })
    }

  } catch (error) {
    console.error("❌ Demo Cases Config API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch demo cases configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Save demo cases configuration to database
export async function POST(request: NextRequest) {
  try {
    const { demoCaseIds, featuredIds } = await request.json()

    if (!Array.isArray(demoCaseIds)) {
      return NextResponse.json(
        { error: "demoCaseIds must be an array" },
        { status: 400 }
      )
    }

    if (!Array.isArray(featuredIds)) {
      return NextResponse.json(
        { error: "featuredIds must be an array" },
        { status: 400 }
      )
    }

    // Validate that all artifact IDs exist
    const existingArtifacts = await prisma.artifact.findMany({
      where: {
        id: { in: [...demoCaseIds, ...featuredIds] }
      },
      select: { id: true }
    })

    const existingIds = existingArtifacts.map(a => a.id)
    const invalidDemoCaseIds = demoCaseIds.filter(id => !existingIds.includes(id))
    const invalidFeaturedIds = featuredIds.filter(id => !existingIds.includes(id))

    if (invalidDemoCaseIds.length > 0 || invalidFeaturedIds.length > 0) {
      return NextResponse.json(
        {
          error: "Some artifact IDs do not exist",
          invalidDemoCaseIds,
          invalidFeaturedIds
        },
        { status: 400 }
      )
    }

    // Store configuration in database using upsert
    await prisma.configuration.upsert({
      where: { key: "demo_cases" },
      update: {
        value: { demoCaseIds, featuredIds }
      },
      create: {
        key: "demo_cases",
        value: { demoCaseIds, featuredIds }
      }
    })

    console.log("📝 Demo Cases Configuration Updated in Database:", {
      demoCaseIds,
      featuredIds,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Demo cases configuration updated successfully",
      demoCaseIds,
      featuredIds
    })

  } catch (error) {
    console.error("❌ Demo Cases Update API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update demo cases configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Generate code for manual update (still useful for debugging)
export async function PUT(request: NextRequest) {
  try {
    const { demoCaseIds } = await request.json()

    if (!Array.isArray(demoCaseIds)) {
      return NextResponse.json(
        { error: "demoCaseIds must be an array" },
        { status: 400 }
      )
    }

    // Generate the code to update the frontend
    const artifactIdsCode = demoCaseIds.map(id => `    "${id}"`).join(",\n")

    const codeToUpdate = `  const artifactIds = [
${artifactIdsCode}
  ]`

    return NextResponse.json({
      success: true,
      message: "Generated code for frontend update",
      codeToUpdate,
      demoCaseIds,
      instructions: "Replace the artifactIds array in app/page.tsx with the provided code"
    })

  } catch (error) {
    console.error("❌ Demo Cases Code Generation Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate demo cases code",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
