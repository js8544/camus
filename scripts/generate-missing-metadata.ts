#!/usr/bin/env tsx

// IMPORTANT: Load environment variables FIRST, before any other imports
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Try to load multiple env files in order of precedence
const envFiles = ['.env.local', '.env', '.env.development.local', '.env.development']
let envLoaded = false

for (const envFile of envFiles) {
  const envPath = resolve(process.cwd(), envFile)
  if (existsSync(envPath)) {
    console.log(`📄 Loading environment from: ${envFile}`)
    const result = config({ path: envPath })
    if (result.error) {
      console.error(`❌ Error loading ${envFile}:`, result.error)
    } else {
      envLoaded = true
      break
    }
  }
}

if (!envLoaded) {
  console.error('❌ No environment file found. Looking for:', envFiles.join(', '))
}

// Debug: Check if OPENAI_API_KEY is available
console.log(`🔑 OPENAI_API_KEY present: ${!!process.env.OPENAI_API_KEY}`)
console.log(`🗄️ DATABASE_URL present: ${!!process.env.DATABASE_URL}`)

// Now we can safely import modules that depend on environment variables
import { ConversationService } from '../lib/db/conversation-service'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('🚀 Starting metadata generation for artifacts without metadata...')

  // Verify required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required')
    console.error('💡 Make sure it\'s set in your .env.local file')
    console.error('📋 Expected format: OPENAI_API_KEY=sk-...')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    console.error('💡 Make sure it\'s set in your .env.local file')
    process.exit(1)
  }

  console.log('✅ Environment variables loaded successfully')

  try {
    // Find all artifacts that are missing metadata
    const artifactsWithoutMetadata = await prisma.artifact.findMany({
      where: {
        OR: [
          { displayTitle: null },
          { displayDescription: null },
          { category: null },
          { previewImageUrl: null }
        ]
      },
      select: {
        id: true,
        name: true,
        content: true,
        displayTitle: true,
        displayDescription: true,
        category: true,
        previewImageUrl: true
      }
    })

    console.log(`📊 Found ${artifactsWithoutMetadata.length} artifacts without complete metadata`)

    if (artifactsWithoutMetadata.length === 0) {
      console.log('✅ All artifacts already have metadata generated!')
      process.exit(0)
    }

    let processed = 0
    let succeeded = 0
    let failed = 0

    // Process artifacts in batches to avoid overwhelming the AI service
    const batchSize = 5
    for (let i = 0; i < artifactsWithoutMetadata.length; i += batchSize) {
      const batch = artifactsWithoutMetadata.slice(i, i + batchSize)

      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(artifactsWithoutMetadata.length / batchSize)} (${batch.length} artifacts)`)

      // Process batch concurrently
      const batchPromises = batch.map(async (artifact) => {
        try {
          console.log(`⚡ Generating metadata for: ${artifact.name.substring(0, 50)}...`)

          await ConversationService.generateArtifactMetadataAsync(
            artifact.id,
            artifact.name,
            artifact.content
          )

          console.log(`✅ Generated metadata for: ${artifact.name.substring(0, 50)}`)
          return { success: true, artifactId: artifact.id }
        } catch (error) {
          console.error(`❌ Failed to generate metadata for ${artifact.id}:`, error)
          return { success: false, artifactId: artifact.id, error }
        }
      })

      const batchResults = await Promise.all(batchPromises)

      // Count results
      batchResults.forEach(result => {
        processed++
        if (result.success) {
          succeeded++
        } else {
          failed++
        }
      })

      // Add a small delay between batches to be respectful to the AI service
      if (i + batchSize < artifactsWithoutMetadata.length) {
        console.log('⏳ Waiting 2 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log('\n📈 Summary:')
    console.log(`   Total processed: ${processed}`)
    console.log(`   ✅ Succeeded: ${succeeded}`)
    console.log(`   ❌ Failed: ${failed}`)

    if (failed > 0) {
      console.log('\n⚠️  Some artifacts failed to generate metadata. Check the logs above for details.')
      process.exit(1)
    } else {
      console.log('\n🎉 Successfully generated metadata for all artifacts!')
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Unexpected error during metadata generation:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
}) 
