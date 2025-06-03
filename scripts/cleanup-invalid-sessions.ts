#!/usr/bin/env tsx

import { ConversationService } from '../lib/db/conversation-service'

async function main() {
  console.log('Starting cleanup of invalid session references...')

  try {
    const cleanedCount = await ConversationService.cleanupInvalidSessionReferences()

    if (cleanedCount > 0) {
      console.log(`✅ Successfully cleaned up ${cleanedCount} conversations with invalid session references.`)
    } else {
      console.log('✅ No conversations with invalid session references found.')
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }

  console.log('Cleanup completed.')
  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
}) 
