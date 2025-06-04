"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, LogOut, MessageSquare, Plus, Search, Trash2, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useEffect, useState } from "react"

type ChatSession = {
  id: string
  title: string
  timestamp: number
}

type ChatSidebarProps = {
  onNewChat: () => void
  onLoadConversation?: (conversationId: string) => void
  currentConversationId?: string
  refreshTrigger?: number
}

export function ChatSidebar({ onNewChat, onLoadConversation, currentConversationId, refreshTrigger }: ChatSidebarProps) {
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("")
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  // Generate session ID for anonymous users
  const [sessionId] = useState(() =>
    typeof window !== 'undefined'
      ? sessionStorage.getItem('camus-session-id') || (() => {
        const id = Date.now().toString()
        sessionStorage.setItem('camus-session-id', id)
        return id
      })()
      : null
  )

  // Fetch conversations on mount and when session changes
  useEffect(() => {
    fetchConversations()
  }, [session])

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0 && !isLoading) {
      console.log("🔄 Sidebar: Refresh triggered", { refreshTrigger })
      fetchConversations()
    }
  }, [refreshTrigger])

  // Handle clicking outside user dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showUserDropdown && !target.closest('.user-profile-container')) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown])

  const fetchConversations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (sessionId && !session?.user?.id) {
        params.append('sessionId', sessionId)
      }

      const response = await fetch(`/api/conversations?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setChatSessions(data.conversations || [])
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load conversations')
      // Keep the mock data as fallback
      setChatSessions([
        { id: "1", title: "Useless Website Generator", timestamp: Date.now() - 86400000 },
        { id: "2", title: "Pointless Animation Creator", timestamp: Date.now() - 172800000 },
        { id: "3", title: "Meaningless Chart Builder", timestamp: Date.now() - 259200000 },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    onNewChat()
    // Note: Refresh will be triggered by parent component via refreshTrigger
  }

  const handleConversationClick = async (conversationId: string) => {
    if (onLoadConversation) {
      try {
        await onLoadConversation(conversationId)
      } catch (err) {
        console.error('Error loading conversation:', err)
        setError('Failed to load conversation')
      }
    }
  }

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering the conversation click

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete conversation')
      }

      // Remove from local state
      setChatSessions(prev => prev.filter(conv => conv.id !== conversationId))

      // If this was the current conversation, start a new one
      if (conversationId === currentConversationId) {
        onNewChat()
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
      setError('Failed to delete conversation')
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const truncateTitle = (title: string, maxLength: number = 25): string => {
    if (title.length <= maxLength) {
      return title
    }
    return title.substring(0, maxLength) + "..."
  }

  const filteredSessions = chatSessions.filter(session =>
    sidebarSearchQuery === "" ||
    session.title.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
  )

  return (
    <div className="w-64 bg-white border-r border-gray-300 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-serif font-medium text-gray-800">Camus AI</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={sidebarSearchQuery}
            onChange={(e) => setSidebarSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 border-gray-300 bg-white text-black focus:border-taupe focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Recent Conversations</h3>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded">
            {error}
            <button
              onClick={fetchConversations}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="space-y-2">
          {filteredSessions.map((conversationSession) => (
            <div
              key={conversationSession.id}
              className={`group w-full flex items-start p-3 text-left hover:bg-gray-50 rounded-lg border transition-colors relative ${currentConversationId === conversationSession.id
                ? 'border-taupe bg-gray-50'
                : 'border-transparent hover:border-gray-200'
                }`}
            >
              <button
                onClick={() => handleConversationClick(conversationSession.id)}
                className="flex-1 flex items-start text-left"
              >
                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 mr-3 group-hover:text-taupe" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900" title={conversationSession.title}>
                    {truncateTitle(conversationSession.title)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(conversationSession.timestamp)}
                  </p>
                </div>
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => handleDeleteConversation(conversationSession.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                title="Delete conversation"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {filteredSessions.length === 0 && sidebarSearchQuery !== "" && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No conversations found</p>
          </div>
        )}

        {filteredSessions.length === 0 && sidebarSearchQuery === "" && !isLoading && !error && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new task to begin!</p>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-300 relative user-profile-container">
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="flex items-center space-x-3 w-full hover:bg-gray-50 rounded-lg p-2 transition-colors group"
        >
          <div className="w-10 h-10 bg-taupe rounded-full flex items-center justify-center overflow-hidden">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">
              {session?.user?.name || "Anonymous User"}
            </p>
            <p className="text-xs text-gray-500">
              {session?.user?.email || "Not signed in"}
            </p>
          </div>
        </button>

        {/* User Dropdown Menu */}
        {showUserDropdown && (
          <div className="absolute bottom-full left-4 right-4 mb-2 rounded-lg border border-gray-300 bg-white py-1 shadow-lg z-50">
            <button
              onClick={() => {
                signOut()
                setShowUserDropdown(false)
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 hover:text-gray-900"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 
