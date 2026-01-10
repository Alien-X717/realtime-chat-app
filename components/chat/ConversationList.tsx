'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  type: 'dm' | 'group'
  name: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface ConversationListProps {
  selectedId?: string
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { accessToken } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConversations() {
      if (!accessToken) return

      try {
        setLoading(true)
        const response = await fetch('/api/conversations', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch conversations')
        }

        const data = await response.json()
        setConversations(data.conversations)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [accessToken])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">No conversations yet</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          className={cn(
            'flex flex-col items-start gap-1 rounded-lg p-3 text-left text-sm transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            selectedId === conversation.id && 'bg-accent text-accent-foreground'
          )}
        >
          <div className="flex w-full items-center justify-between">
            <span className="font-medium">
              {conversation.type === 'group' ? conversation.name : 'Direct Message'}
            </span>
            <span className="text-muted-foreground text-xs">
              {conversation.type === 'group' ? 'Group' : 'DM'}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
