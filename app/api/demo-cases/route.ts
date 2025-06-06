import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Public endpoint to get demo cases configuration
export async function GET() {
  try {
    // Get configuration from database
    const config = await prisma.configuration.findUnique({
      where: { key: "demo_cases" }
    })

    if (config) {
      const data = config.value as { demoCaseIds: string[], featuredIds: string[] }
      return NextResponse.json({
        success: true,
        demoCaseIds: data.demoCaseIds || []
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

      return NextResponse.json({
        success: true,
        demoCaseIds
      })
    }

  } catch (error) {
    console.error("❌ Public Demo Cases API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch demo cases",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
