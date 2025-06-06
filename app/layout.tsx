import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Camus - The world's first genuinely useless AI agent",
  description: "Creating Absurd, Meaningless and Useless Stuff",
  generator: 'v0.dev',
  icons: {
    icon: '/camus_logo.png',
    shortcut: '/camus_logo.png',
    apple: '/camus_logo.png',
  },
  openGraph: {
    title: "Camus - The world's first genuinely useless AI agent",
    description: "Creating Absurd, Meaningless and Useless Stuff",
    images: ['/camus_logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Camus - The world's first genuinely useless AI agent",
    description: "Creating Absurd, Meaningless and Useless Stuff",
    images: ['/camus_logo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {/* <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange> */}
          {children}
          <Toaster />
          {/* </ThemeProvider> */}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
