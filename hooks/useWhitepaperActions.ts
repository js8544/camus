'use client'

import { useCallback, useState } from 'react';

export function useWhitepaperActions() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const downloadPdf = useCallback(async () => {
    try {
      setIsGeneratingPdf(true)

      // Create a download link for the static PDF
      const link = document.createElement('a')
      link.href = '/Camus-AI-Whitepaper.pdf'
      link.download = 'camus-whitepaper-v0.6.9.pdf'
      link.target = '_blank'

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [])

  const shareWhitepaper = useCallback(async () => {
    try {
      setIsSharing(true)

      const shareData = {
        title: 'CAMUS: The Art of Perfect Uselessness and Meaninglessness',
        text: 'A Comprehensive Analysis of AI Agent Creating Absurd, Meaningless and Useless Stuff - Official Whitepaper v0.6.9',
        url: window.location.href
      }

      // Check if Web Share API is supported (mainly mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href)

        // You could replace this with a toast notification
        alert('Link copied to clipboard!')

        // Optional: Open share modal with social media options
        // You could implement a more sophisticated share modal here
      }

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error)

        // Fallback: Try to copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href)
          alert('Link copied to clipboard!')
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError)
          alert('Unable to share. Please copy the URL manually.')
        }
      }
    } finally {
      setIsSharing(false)
    }
  }, [])

  const shareToSocial = useCallback((platform: string) => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent('CAMUS: The Art of Perfect Uselessness and Meaninglessness')
    const description = encodeURIComponent('A Comprehensive Analysis of AI Agent Creating Absurd, Meaningless and Useless Stuff')

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      reddit: `https://reddit.com/submit?url=${url}&title=${title}`,
      hackernews: `https://news.ycombinator.com/submitlink?u=${url}&t=${title}`,
      email: `mailto:?subject=${title}&body=${description}%0A%0A${url}`
    }

    const shareUrl = shareUrls[platform as keyof typeof shareUrls]
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
  }, [])

  return {
    downloadPdf,
    shareWhitepaper,
    shareToSocial,
    isGeneratingPdf,
    isSharing
  }
} 
