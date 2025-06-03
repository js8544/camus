"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, RefreshCw, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

function VerifyRequestPageContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [showEmailInput, setShowEmailInput] = useState(false)

  useEffect(() => {
    // Try to get email from URL params first, then from localStorage
    const emailFromParams = searchParams.get('email')
    const emailFromStorage = localStorage.getItem('verificationEmail')

    if (emailFromParams) {
      setEmail(emailFromParams)
      localStorage.setItem('verificationEmail', emailFromParams)
    } else if (emailFromStorage) {
      setEmail(emailFromStorage)
    } else {
      setShowEmailInput(true)
    }
  }, [searchParams])

  const handleResendEmail = async () => {
    if (!email) {
      setResendMessage("Please enter your email address")
      return
    }

    setIsResending(true)
    setResendMessage("")

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage("✅ Verification email sent successfully! Check your inbox.")
      } else {
        setResendMessage(`❌ ${data.error || "Failed to send email"}`)
      }
    } catch (error) {
      setResendMessage("❌ An error occurred. Please try again.")
    } finally {
      setIsResending(false)
    }
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
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Mail className="h-16 w-16 text-taupe" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </div>
            <h1 className="font-serif text-3xl font-medium text-gray-800">Check Your Email</h1>
            <p className="mt-2 text-gray-500">We've sent you a magical verification link</p>
          </div>

          <div className="rounded-sm border border-gray-300 bg-white p-6 shadow-sm">
            {/* Success Message */}
            <div className="bg-taupe/10 border border-taupe/20 rounded-sm p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-taupe mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-taupe">
                    Welcome to the Art of Beautiful Uselessness!
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {email ? `We've sent a verification email to ${email}.` : "We've sent you an elegantly crafted email with a verification link."}
                    Click it to enter the wonderfully pointless world of Camus.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-medium text-gray-800">What to do next:</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-taupe/20 text-taupe rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span>Check your email inbox (and spam folder, just in case)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-taupe/20 text-taupe rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span>Look for an email from Camus with the subject "Verify Your Email - Camus"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-taupe/20 text-taupe rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <span>Click the "Verify Email" button</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-taupe/20 text-taupe rounded-full flex items-center justify-center text-xs font-medium">4</span>
                  <span>Begin your journey into purposeful purposelessness</span>
                </li>
              </ol>
            </div>

            {/* Troubleshooting */}
            <div className="bg-gray-50 rounded-sm p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                Don't see the email?
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email address</li>
                <li>• The link expires in 24 hours for security</li>
              </ul>
            </div>

            {/* Email Input (if needed) */}
            {showEmailInput && (
              <div className="space-y-3 mb-6">
                <Label htmlFor="email">Enter your email to resend verification:</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300 focus-visible:ring-taupe"
                />
              </div>
            )}

            {/* Resend Message */}
            {resendMessage && (
              <div className={`rounded-sm p-3 mb-4 text-sm ${resendMessage.includes('✅')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                {resendMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={handleResendEmail}
                disabled={isResending || !email}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? "Sending..." : "Resend Email"}
              </Button>

              <Link href="/auth/signin">
                <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                  Try Different Email
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Note: Even our verification emails are crafted with beautiful uselessness in mind.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-beige text-gray-700 font-sans flex items-center justify-center">
        <div className="text-center">
          <Mail className="h-8 w-8 text-taupe mx-auto mb-4" />
          <p className="text-gray-600 font-serif">Loading verification page...</p>
        </div>
      </div>
    }>
      <VerifyRequestPageContent />
    </Suspense>
  )
} 
