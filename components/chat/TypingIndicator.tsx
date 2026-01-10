'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'

interface TypingIndicatorProps {
  conversationId: string
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { onTypingStart, onTypingStop } = useSocket()
  const { user } = useAuth()
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const unsubStart = onTypingStart((event) => {
      if (event.conversationId === conversationId && event.userId !== user?.id) {
        setTypingUsers((prev) => new Set([...prev, event.userId]))
      }
    })

    const unsubStop = onTypingStop((event) => {
      if (event.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev)
          next.delete(event.userId)
          return next
        })
      }
    })

    return () => {
      unsubStart()
      unsubStop()
    }
  }, [conversationId, onTypingStart, onTypingStop, user?.id])

  if (typingUsers.size === 0) {
    return null
  }

  return (
    <div className="text-muted-foreground px-4 py-2 text-sm">
      <span className="inline-flex items-center gap-1">
        <span className="flex gap-1">
          <span
            className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: '300ms' }}
          />
        </span>
        <span className="ml-2">
          {typingUsers.size === 1
            ? 'Someone is typing...'
            : `${typingUsers.size} people are typing...`}
        </span>
      </span>
    </div>
  )
}
