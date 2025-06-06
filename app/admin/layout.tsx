"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Shield } from "lucide-react"
import { SessionProvider } from "next-auth/react"
import Link from "next/link"
import { AdminUserInfo } from "./components/admin-user-info"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Site
                </Link>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <h1 className="text-lg font-semibold text-gray-900">CAMUS Admin Portal</h1>
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                    RESTRICTED ACCESS
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <AdminUserInfo />
                <Link href="/agent">
                  <Button variant="outline" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Main App
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Content */}
        <main>
          {children}
        </main>
      </div>
    </SessionProvider>
  )
} 
