"use client"

import { Sparkles } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

interface AuthGuardProps {
  children: ReactNode
  redirectTo?: string
  requireEmailVerification?: boolean
}

export function AuthGuard({
  children,
  redirectTo = "/auth/signin",
  requireEmailVerification = true
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      // Not authenticated - redirect to sign in
      const url = new URL(redirectTo, window.location.origin)
      url.searchParams.set('callbackUrl', window.location.pathname)
      router.push(url.toString())
      return
    }

    // For credential users, check email verification if required
    if (requireEmailVerification && session.user.email) {
      // This would be handled by middleware in most cases,
      // but this provides additional client-side checking
      fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      })
        .then(res => res.json())
        .then(data => {
          if (data.exists && !data.emailVerified) {
            const verifyUrl = new URL('/auth/verify-request', window.location.origin)
            verifyUrl.searchParams.set('email', session.user.email!)
            router.push(verifyUrl.toString())
          }
        })
        .catch(error => {
          console.error('Error checking email verification:', error)
        })
    }
  }, [session, status, router, redirectTo, requireEmailVerification])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin">
            <Sparkles className="h-8 w-8 text-taupe mx-auto mb-4" />
          </div>
          <p className="text-gray-600 font-serif">
            Preparing your journey into beautiful uselessness...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-taupe mx-auto mb-4" />
          <p className="text-gray-600 font-serif">
            Redirecting to authentication...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 
