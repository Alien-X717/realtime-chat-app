'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSocket } from '@/hooks/useSocket'

interface MessageInputProps {
  conversationId: string
  disabled?: boolean
}

export function MessageInput({ conversationId, disabled }: MessageInputProps) {
  const { sendMessage, startTyping, stopTyping, isConnected } = useSocket()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      startTyping(conversationId)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      stopTyping(conversationId)
    }, 2000)
  }, [conversationId, startTyping, stopTyping])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const trimmedContent = content.trim()
      if (!trimmedContent || sending || !isConnected) return

      try {
        setSending(true)

        // Stop typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        if (isTypingRef.current) {
          isTypingRef.current = false
          stopTyping(conversationId)
        }

        await sendMessage(conversationId, trimmedContent)
        setContent('')
      } catch (err) {
        // Handle error silently or show toast
      } finally {
        setSending(false)
      }
    },
    [content, conversationId, sendMessage, stopTyping, sending, isConnected]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
    },
    [handleSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <Input
        type="text"
        placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          handleTyping()
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled || !isConnected || sending}
        className="flex-1"
        aria-label="Message input"
      />
      <Button
        type="submit"
        disabled={disabled || !isConnected || sending || !content.trim()}
      >
        {sending ? 'Sending...' : 'Send'}
      </Button>
    </form>
  )
}
