"use client"

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Coins } from 'lucide-react'
import { useEffect, useState } from 'react'

export function UserCreditsDisplay() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCredits() {
      try {
        setLoading(true)
        const response = await fetch('/api/user/credits')

        if (!response.ok) {
          throw new Error('Failed to fetch credits')
        }

        const data = await response.json()
        setCredits(data.credits)
      } catch (err) {
        console.error('Error fetching credits:', err)
        setError('Failed to load credits')
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Coins size={16} /> Loading...
      </div>
    )
  }

  if (error || credits === null) {
    return null // Don't show anything if there's an error
  }

  const creditsColor = credits > 3 ? 'bg-green-100 text-green-800' :
    credits > 0 ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <Coins size={16} className="text-muted-foreground" />
            <Badge variant="outline" className={`${creditsColor} font-medium`}>
              {credits} {credits === 1 ? 'Credit' : 'Credits'}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>You get +5 additional credits daily when you first login</p>
          <p>Earn 3 bonus credits when your shared content reaches 100 views</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 
