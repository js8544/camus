"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Square } from "lucide-react"
import { FormEvent } from "react"

type ChatInputProps = {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: FormEvent) => void
  onStop?: () => void
  isLoading: boolean
}

export function ChatInput({ input, setInput, onSubmit, onStop, isLoading }: ChatInputProps) {
  const handleStop = () => {
    if (onStop) {
      onStop()
    }
  }

  return (
    <div className="border-t border-gray-300 bg-white p-4">
      <form onSubmit={onSubmit} className="flex items-center space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for anything (it will be useless anyway)..."
          className="border-gray-300 bg-white text-black focus:border-taupe focus-visible:ring-0"
          disabled={isLoading}
        />
        {isLoading ? (
          <Button
            type="button"
            onClick={handleStop}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim()}
            className="bg-taupe hover:bg-taupe/90 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  )
} 
