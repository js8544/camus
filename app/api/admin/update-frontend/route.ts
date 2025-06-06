import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from "next/server"
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { demoCaseIds } = await request.json()

    if (!Array.isArray(demoCaseIds)) {
      return NextResponse.json(
        { error: "demoCaseIds must be an array" },
        { status: 400 }
      )
    }

    // Path to the page.tsx file
    const pagePath = path.join(process.cwd(), 'app', 'page.tsx')

    // Read the current file
    const fileContent = await fs.readFile(pagePath, 'utf8')

    // Create the new artifact IDs array string
    const newArtifactIds = demoCaseIds.map(id => `    "${id}"`).join(',\n')
    const newArtifactIdsSection = `  const artifactIds = [\n${newArtifactIds}\n  ]`

    // Regular expression to find and replace the artifactIds array
    const artifactIdsRegex = /const artifactIds = \[\s*(?:[^[\]]*(?:\[[^[\]]*\])?)*\s*\]/

    let updatedContent = fileContent

    if (artifactIdsRegex.test(fileContent)) {
      // Replace the existing array
      updatedContent = fileContent.replace(artifactIdsRegex, newArtifactIdsSection)
    } else {
      return NextResponse.json(
        {
          error: "Could not find artifactIds array in page.tsx",
          suggestion: "Please manually update the artifactIds array"
        },
        { status: 400 }
      )
    }

    // Write the updated content back to the file
    await fs.writeFile(pagePath, updatedContent, 'utf8')

    console.log('✅ Successfully updated app/page.tsx with new artifact IDs')

    return NextResponse.json({
      success: true,
      message: "Frontend page.tsx updated successfully",
      updatedArtifactIds: demoCaseIds,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Frontend Update Error:", error)

    // Check if it's a file permission error
    if (error instanceof Error && error.message.includes('EACCES')) {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied: Cannot write to page.tsx file",
          suggestion: "Check file permissions or manually update the file"
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update frontend file",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 
