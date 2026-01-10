'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  replyToId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

interface MessageListProps {
  conversationId: string
}

export function MessageList({ conversationId }: MessageListProps) {
  const { accessToken, user } = useAuth()
  const { joinConversation, leaveConversation, onNewMessage } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      if (!accessToken || !conversationId) return

      try {
        setLoading(true)
        const response = await fetch(
          `/api/conversations/${conversationId}/messages?limit=50`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch messages')
        }

        const data = await response.json()
        // Messages come newest-first, reverse for display
        setMessages(data.messages.reverse())
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [accessToken, conversationId])

  // Join conversation room for real-time updates
  useEffect(() => {
    if (!conversationId) return

    joinConversation(conversationId).catch(() => {
      // Silently handle join errors
    })

    return () => {
      leaveConversation(conversationId)
    }
  }, [conversationId, joinConversation, leaveConversation])

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = onNewMessage((message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message])
      }
    })

    return unsubscribe
  }, [conversationId, onNewMessage])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto">
      {messages.map((message) => {
        const isOwn = message.senderId === user?.id
        return (
          <div
            key={message.id}
            className={cn(
              'flex flex-col max-w-[70%] rounded-lg p-3',
              isOwn
                ? 'self-end bg-primary text-primary-foreground'
                : 'self-start bg-muted'
            )}
          >
            <p className="text-sm">{message.content}</p>
            <span
              className={cn(
                'text-xs mt-1',
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
