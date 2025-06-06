"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { FormEvent } from "react"

type EmptyChatInterfaceProps = {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: FormEvent) => void
  isLoading: boolean
}

const demoExamples = [
  "Write the lyric of Taylor Swift's new song",
  "Write a bedtime story for a 31 year old guy",
  "Plan an 3-day trip itinerary in Tokyo, Japan",
  "Design the 2026 investment strategy for A16Z",
  "Predict the stock performance of Nvidia Q4",
  "Generate a website for selling homemade products",
  "Design a productivity app that makes me rich",
  "Make a playable game featuring Trump and Biden",
  "Build a business plan for a new consumer product",
  "Make a presentation for Tesla's new car launch"
]

export function EmptyChatInterface({ input, setInput, onSubmit, isLoading }: EmptyChatInterfaceProps) {
  const handleExampleClick = (example: string) => {
    setInput(example)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      if (input.trim()) {
        onSubmit(e)
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-beige">
      {/* Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-serif text-5xl font-medium tracking-tight text-gray-800 mb-6">
              Welcome to <span className="text-taupe">CAMUS</span>
            </h1>
            <p className="text-2xl text-gray-600 mb-4">
              The world's first truly useless AI Agent
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Ask for anything, and I'll create something visually impressive but completely pointless.
            </p>
          </div>

          {/* Centered Input Box */}
          <div className="mb-12 max-w-2xl mx-auto">
            <form onSubmit={onSubmit} className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask for anything (it will be useless anyway)..."
                className="w-full h-14 pr-14 text-lg border-gray-300 bg-white text-black focus:border-taupe focus-visible:ring-0 rounded-xl shadow-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-3 h-8 w-8 p-0 bg-taupe hover:bg-taupe/90 text-white rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Simple Examples */}
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-gray-400 mb-6 uppercase tracking-wide">Try these examples</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {demoExamples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="p-4 text-left border border-gray-200 rounded-xl hover:border-taupe hover:shadow-sm transition-all duration-200 bg-white/50 text-gray-700 hover:text-gray-900"
                >
                  <span className="text-sm">{example}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
