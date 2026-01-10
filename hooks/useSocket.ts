'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import { useAuth } from './useAuth'

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

interface TypingEvent {
  userId: string
  conversationId: string
}

interface UseSocketReturn {
  isConnected: boolean
  joinConversation: (conversationId: string) => Promise<void>
  leaveConversation: (conversationId: string) => void
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string
  ) => Promise<Message | null>
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
  onNewMessage: (callback: (message: Message) => void) => () => void
  onTypingStart: (callback: (event: TypingEvent) => void) => () => void
  onTypingStop: (callback: (event: TypingEvent) => void) => () => void
}

export function useSocket(): UseSocketReturn {
  const { accessToken } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Initialize socket connection
  useEffect(() => {
    if (!accessToken) {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    // Create socket connection with auth
    const socket = io({
      auth: {
        token: accessToken,
      },
      autoConnect: true,
    })

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', () => {
      setIsConnected(false)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [accessToken])

  // Join a conversation room
  const joinConversation = useCallback(async (conversationId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'))
        return
      }

      socketRef.current.emit(
        'conversation:join',
        conversationId,
        (response: { success?: boolean; error?: string }) => {
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve()
          }
        }
      )
    })
  }, [])

  // Leave a conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:leave', conversationId)
    }
  }, [])

  // Send a message
  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      replyToId?: string
    ): Promise<Message | null> => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current?.connected) {
          reject(new Error('Socket not connected'))
          return
        }

        socketRef.current.emit(
          'message:send',
          { conversationId, content, replyToId },
          (response: { success?: boolean; message?: Message; error?: string }) => {
            if (response.error) {
              reject(new Error(response.error))
            } else {
              resolve(response.message || null)
            }
          }
        )
      })
    },
    []
  )

  // Start typing indicator
  const startTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:start', { conversationId })
    }
  }, [])

  // Stop typing indicator
  const stopTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:stop', { conversationId })
    }
  }, [])

  // Subscribe to new messages
  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    if (!socketRef.current) return () => {}

    socketRef.current.on('message:new', callback)

    return () => {
      socketRef.current?.off('message:new', callback)
    }
  }, [])

  // Subscribe to typing start events
  const onTypingStart = useCallback((callback: (event: TypingEvent) => void) => {
    if (!socketRef.current) return () => {}

    socketRef.current.on('typing:start', callback)

    return () => {
      socketRef.current?.off('typing:start', callback)
    }
  }, [])

  // Subscribe to typing stop events
  const onTypingStop = useCallback((callback: (event: TypingEvent) => void) => {
    if (!socketRef.current) return () => {}

    socketRef.current.on('typing:stop', callback)

    return () => {
      socketRef.current?.off('typing:stop', callback)
    }
  }, [])

  return {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    onNewMessage,
    onTypingStart,
    onTypingStop,
  }
}
