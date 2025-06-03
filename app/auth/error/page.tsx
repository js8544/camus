"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, RefreshCw, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Configuration Error",
    description: "There's an issue with the server configuration. Please try again later."
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in with this account."
  },
  Verification: {
    title: "Verification Error",
    description: "The verification link may have expired or already been used. Please request a new one."
  },
  CredentialsSignin: {
    title: "Sign In Failed",
    description: "Please verify your email address before signing in, or check your login credentials."
  },
  Default: {
    title: "Authentication Error",
    description: "Something went wrong during authentication. Please try again."
  }
}

function AuthErrorPageContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error") || "Default"

  const errorInfo = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen bg-beige text-gray-700 font-sans">
      {/* Navigation */}
      <nav className="border-b border-gray-300 bg-white">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/camus_logo.png"
                alt="Camus Logo"
                width={32}
                height={32}
                className="mr-2 h-8 w-8"
              />
              <span className="font-serif text-xl font-medium tracking-tight">CAMUS</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="font-serif text-3xl font-medium text-gray-800">{errorInfo.title}</h1>
            <p className="mt-2 text-gray-500">{errorInfo.description}</p>
          </div>

          <div className="rounded-sm border border-gray-300 bg-white p-6 shadow-sm">
            {/* Error Details */}
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Oops! Even beautiful uselessness has its limits.
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    We encountered an issue while trying to get you into the wonderfully pointless world of Camus.
                  </p>
                </div>
              </div>
            </div>

            {/* Specific Error Help */}
            {error === "Verification" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4 mb-6">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Verification Link Issues?
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Links expire after 24 hours for security</li>
                  <li>• Each link can only be used once</li>
                  <li>• Make sure you're using the latest email</li>
                </ul>
              </div>
            )}

            {/* Recovery Actions */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-800">What you can do:</h3>

              <div className="flex flex-col space-y-3">
                <Link href="/auth/signin">
                  <Button className="w-full bg-taupe hover:bg-taupe/90 text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Signing In Again
                  </Button>
                </Link>

                <Link href="/">
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Homepage
                  </Button>
                </Link>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gray-50 rounded-sm p-4 mt-6">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                Still having trouble?
              </h4>
              <p className="text-sm text-gray-600">
                Even in the realm of beautiful uselessness, we want your experience to be smooth.
                Feel free to try again or contact us if the issue persists.
              </p>
            </div>

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 rounded-sm p-3 mt-4">
                <p className="text-xs font-mono text-gray-600">
                  Error Code: {error}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Note: Authentication errors are just another form of beautiful uselessness in the CAMUS experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-beige text-gray-700 font-sans flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-taupe mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-serif">Loading error page...</p>
        </div>
      </div>
    }>
      <AuthErrorPageContent />
    </Suspense>
  )
} 
