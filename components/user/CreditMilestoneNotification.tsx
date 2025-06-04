"use client"

import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from 'react'

type MilestoneType = {
  id: string
  type: 'conversation' | 'artifact'
  itemId: string | null
  itemName: string
  viewCount: number
  creditsAwarded: number
  timestamp: string
}

export function CreditMilestoneNotification() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Check for milestones when the component mounts
  useEffect(() => {
    // Only check once per session to avoid spamming the user
    const hasCheckedMilestones = sessionStorage.getItem('has_checked_credit_milestones')
    if (hasCheckedMilestones) return

    async function checkMilestones() {
      try {
        setLoading(true)
        const response = await fetch('/api/user/credits/milestone')

        if (!response.ok) {
          return
        }

        const data = await response.json()

        // Show toast for each milestone
        if (data.milestones && data.milestones.length > 0) {
          // Get the most recent milestone only to avoid overwhelming the user
          const recentMilestone = data.milestones[0] as MilestoneType

          toast({
            title: "Credit Bonus!",
            description: `Your ${recentMilestone.itemName} reached ${recentMilestone.viewCount} views. You earned +${recentMilestone.creditsAwarded} credits!`,
            duration: 5000,
          })
        }

        // Mark that we've checked for milestones
        sessionStorage.setItem('has_checked_credit_milestones', 'true')
      } catch (err) {
        console.error('Error checking for credit milestones:', err)
      } finally {
        setLoading(false)
      }
    }

    // Wait a few seconds before checking to let the page load
    const timer = setTimeout(() => {
      checkMilestones()
    }, 2000)

    return () => clearTimeout(timer)
  }, [toast])

  // This component doesn't render anything directly
  return null
} 
