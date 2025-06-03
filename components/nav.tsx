"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function Navigation() {
  return (
    <nav className="border-b border-gray-300 bg-white">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/camus_logo.png"
            alt="Camus Logo"
            width={32}
            height={32}
            className="mr-2 h-8 w-8"
          />
          <span className="font-serif text-xl font-medium tracking-tight">CAMUS</span>
        </Link>

        <div className="hidden space-x-1 md:flex">
          {["Solutions", "Enterprise", "Resources", "About", "Contact"].map((item) => (
            <button
              key={item}
              className="rounded-sm px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/agent">
            <Button
              size="sm"
              className="bg-taupe text-white hover:bg-taupe/90"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
} 
