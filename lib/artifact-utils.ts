// Utility functions for artifact management

/**
 * Generates a consistent artifact ID based on conversation ID and content hash
 * This ensures the same content in the same conversation always gets the same ID
 */
export function generateArtifactId(conversationId: string, content: string): string {
  // Simple but consistent hash function
  const hash = content.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)

  // Convert to positive number and base36 for shorter ID
  const hashStr = Math.abs(hash).toString(36)

  return `${conversationId}-${hashStr}`
}

/**
 * Extracts HTML title from content
 */
export function extractHtmlTitle(html: string): string {
  const titleMatch = html.match(/<title>(.*?)<\/title>/)
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1]
  }

  // Try to extract h1 if no title
  const h1Match = html.match(/<h1>(.*?)<\/h1>/)
  if (h1Match && h1Match[1]) {
    return h1Match[1]
  }

  return 'Generated Artifact'
}

/**
 * Extracts artifact content from message content
 */
export function extractArtifactFromMessage(content: string) {
  const artifactMatch = content.match(/```artifact\n([\s\S]*?)\n```/)
  if (artifactMatch) {
    return artifactMatch[1]
  }
  return null
}

/**
 * Extract the first suitable image URL from HTML content
 * Prioritizes larger images and avoids icons/avatars
 */
export function extractPreviewImageUrl(htmlContent: string): string | null {
  try {
    // Simple regex to find img tags with src attributes
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    const matches = Array.from(htmlContent.matchAll(imgRegex))

    if (matches.length === 0) {
      return null
    }

    // Filter out likely icons, avatars, or very small images
    const suitableImages = matches
      .map(match => match[1])
      .filter(src => {
        const lowerSrc = src.toLowerCase()
        // Skip common icon/avatar patterns
        if (lowerSrc.includes('icon') ||
          lowerSrc.includes('avatar') ||
          lowerSrc.includes('logo') ||
          lowerSrc.includes('favicon') ||
          lowerSrc.includes('16x16') ||
          lowerSrc.includes('32x32') ||
          lowerSrc.includes('48x48')) {
          return false
        }
        // Prefer common image formats
        return lowerSrc.includes('.jpg') ||
          lowerSrc.includes('.jpeg') ||
          lowerSrc.includes('.png') ||
          lowerSrc.includes('.webp') ||
          lowerSrc.includes('unsplash') ||
          lowerSrc.includes('blob.vercel-storage.com')
      })

    // Return the first suitable image, or fallback to first image if none found
    return suitableImages[0] || matches[0][1] || null
  } catch (error) {
    console.error('Error extracting preview image URL:', error)
    return null
  }
} 
