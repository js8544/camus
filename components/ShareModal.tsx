'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Copy, Facebook, Link, Mail, Share2, Twitter } from "lucide-react"
import { useState } from "react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
  title?: string
}

export function ShareModal({ isOpen, onClose, shareUrl, title = "CAMUS" }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareToSocialMedia = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(title)

    let sharingUrl = '';

    switch (platform) {
      case 'twitter':
        sharingUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'facebook':
        sharingUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        sharingUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'reddit':
        sharingUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'email':
        sharingUrl = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
        break;
    }

    if (sharingUrl) {
      window.open(sharingUrl, '_blank', 'noopener,noreferrer');
    }
  }

  const socialButtons = [
    {
      name: 'Twitter',
      platform: 'twitter',
      icon: <Twitter className="h-5 w-5" />,
      color: 'hover:bg-[#1DA1F2] hover:text-white',
    },
    {
      name: 'Facebook',
      platform: 'facebook',
      icon: <Facebook className="h-5 w-5" />,
      color: 'hover:bg-[#4267B2] hover:text-white',
    },
    {
      name: 'LinkedIn',
      platform: 'linkedin',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      color: 'hover:bg-[#0077b5] hover:text-white',
    },
    {
      name: 'Reddit',
      platform: 'reddit',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      ),
      color: 'hover:bg-[#ff4500] hover:text-white',
    },
    {
      name: 'Email',
      platform: 'email',
      icon: <Mail className="h-5 w-5" />,
      color: 'hover:bg-gray-700 hover:text-white',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md w-[90vw] bg-white border border-gray-200 shadow-lg p-4 overflow-hidden">
        <DialogHeader className="pb-2 mb-2 border-b border-gray-100">
          <DialogTitle className="flex items-center text-lg">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-hidden">
          {/* Copy Link */}
          <div className="rounded-lg border border-gray-200 p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Share Link</h4>
                <p className="text-xs text-gray-500">Copy or share directly</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className={copied ? "bg-green-50 border-green-200 text-green-700 h-8 px-2" : "h-8 px-2"}
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    <span className="text-xs">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </Button>
            </div>
            <div className="p-2 bg-gray-50 rounded flex items-center border border-gray-100 overflow-hidden text-ellipsis">
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-700 font-mono truncate">
                  {shareUrl}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="ml-1 p-1 h-6 w-6 flex-shrink-0"
              >
                <Link className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Social Platforms */}
          <div>
            <h4 className="mb-2 font-medium text-gray-900 text-sm">Share on Social Media</h4>
            <div className="grid grid-cols-5 gap-1">
              {socialButtons.map((option) => (
                <Button
                  key={option.platform}
                  variant="outline"
                  onClick={() => shareToSocialMedia(option.platform)}
                  className={`flex flex-col items-center justify-center p-2 h-auto transition-colors border border-gray-200 ${option.color}`}
                >
                  <div className="mb-1">{option.icon}</div>
                  <span className="text-[10px]">{option.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
