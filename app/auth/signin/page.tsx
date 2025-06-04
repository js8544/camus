"use client"

import type React from "react"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, Sparkles } from "lucide-react"
import { signIn } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

function AuthPageContent() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationStep, setVerificationStep] = useState<'button' | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is coming from email verification
  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setVerificationStep('button')
    }
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      // First, check if the user exists and if their email is verified
      const checkResponse = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (checkResponse.ok) {
        const userData = await checkResponse.json()

        if (userData.exists && !userData.emailVerified) {
          // User exists but email is not verified - redirect to verification page
          localStorage.setItem('verificationEmail', email)
          router.push(`/auth/verify-request?email=${encodeURIComponent(email)}`)
          return
        }
      }

      // Proceed with normal authentication
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password. Please try again.")
      } else if (result?.ok) {
        router.push("/agent")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const invitationCode = formData.get("invitationCode") as string

    // Additional validation before sending
    if (!invitationCode || invitationCode.trim() === '') {
      setError("Please enter an invitation code")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: `${firstName} ${lastName}`,
          invitationCode: invitationCode.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
      } else {
        // Redirect to verification page with email parameter
        localStorage.setItem('verificationEmail', email)
        router.push(`/auth/verify-request?email=${encodeURIComponent(email)}`)
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    setIsLoading(true)
    setError(null)
    signIn("google", { callbackUrl: "/agent" })
  }

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
            <h1 className="font-serif text-3xl font-medium text-gray-800">
              {verificationStep ? "Email Verification" : "Welcome to CAMUS"}
            </h1>
            <p className="mt-2 text-gray-500">
              {verificationStep === 'button' && "Complete your account verification"}
              {!verificationStep && "Sign in to experience perfect uselessness"}
            </p>
          </div>

          <div className="rounded-sm border border-gray-300 bg-white p-6 shadow-sm">
            {verificationStep === 'button' && (
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-serif text-xl font-medium text-gray-800 mb-2">
                    Email Verified Successfully!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your email has been verified. Now you can sign in with your credentials to access the world of beautiful uselessness.
                  </p>
                </div>

                <Button
                  onClick={() => setVerificationStep(null)}
                  className="w-full bg-taupe hover:bg-taupe/90 text-white"
                >
                  Continue to Sign In
                </Button>

                <p className="text-xs text-gray-400 mt-4">
                  You're about to join an exclusive community dedicated to sophisticated pointlessness.
                </p>
              </div>
            )}

            {!verificationStep && (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger
                    value="signin"
                    className="rounded-sm data-[state=active]:bg-taupe data-[state=active]:text-white"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-sm data-[state=active]:bg-taupe data-[state=active]:text-white"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-signin">Email</Label>
                      <Input
                        id="email-signin"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="border-gray-300 focus-visible:ring-taupe"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password-signin">Password</Label>
                        <Link href="#" className="text-xs text-taupe hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password-signin"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="border-gray-300 focus-visible:ring-taupe"
                      />
                    </div>

                    {error && <div className="rounded-sm bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                    <Button type="submit" className="w-full bg-taupe hover:bg-taupe/90 text-white" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="first-name"
                          name="firstName"
                          placeholder="John"
                          required
                          className="border-gray-300 focus-visible:ring-taupe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="last-name"
                          name="lastName"
                          placeholder="Doe"
                          required
                          className="border-gray-300 focus-visible:ring-taupe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-signup">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email-signup"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="border-gray-300 focus-visible:ring-taupe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invitation-code">
                        Invitation Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="invitation-code"
                        name="invitationCode"
                        type="text"
                        placeholder="Enter any code (e.g., TEST123)"
                        defaultValue="PUSH-THE-ROCK"
                        required
                        className="border-gray-300 focus-visible:ring-taupe"
                      />
                      <p className="text-xs text-gray-500">
                        Required to join the exclusive world of uselessness.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-signup">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="password-signup"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="border-gray-300 focus-visible:ring-taupe"
                      />
                      <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
                    </div>

                    {error && <div className="rounded-sm bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                    <Button type="submit" className="w-full bg-taupe hover:bg-taupe/90 text-white" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </Tabs>
            )}
          </div>

          <div className="mt-8 text-center">
            {!verificationStep && (
              <>
                <p className="text-sm text-gray-500">
                  By signing in, you agree to our{" "}
                  <Link href="#" className="text-taupe hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-taupe hover:underline">
                    Privacy Policy
                  </Link>
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Note: This authentication process is entirely pointless, as all CAMUS features are equally useless
                  regardless of authentication status.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-beige text-gray-700 font-sans flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-taupe mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-serif">Loading authentication...</p>
        </div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  )
} 
