import { Socket, Server } from 'socket.io'
import { createMessage } from '../db/messages'
import { isParticipant } from '../db/conversations'

/**
 * Socket.io event handlers for real-time messaging
 */

interface SendMessagePayload {
  conversationId: string
  content: string
  replyToId?: string
}

interface TypingPayload {
  conversationId: string
}

/**
 * Register message event handlers on a socket
 */
export function registerMessageEvents(socket: Socket, io: Server) {
  const user = socket.data.user

  /**
   * Join a conversation room for real-time updates
   */
  socket.on('conversation:join', async (conversationId: string, callback) => {
    try {
      // Verify user is a participant
      const userIsParticipant = await isParticipant(conversationId, user.userId)

      if (!userIsParticipant) {
        callback?.({ error: 'Not a participant in this conversation' })
        return
      }

      // Join the room
      socket.join(`conversation:${conversationId}`)
      callback?.({ success: true })
    } catch (error) {
      callback?.({ error: 'Failed to join conversation' })
    }
  })

  /**
   * Leave a conversation room
   */
  socket.on('conversation:leave', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`)
  })

  /**
   * Send a message to a conversation
   */
  socket.on('message:send', async (payload: SendMessagePayload, callback) => {
    try {
      const { conversationId, content, replyToId } = payload

      // Validate
      if (!conversationId || content === undefined) {
        callback?.({ error: 'Missing required fields' })
        return
      }

      // Verify user is a participant
      const userIsParticipant = await isParticipant(conversationId, user.userId)
      if (!userIsParticipant) {
        callback?.({ error: 'Not a participant in this conversation' })
        return
      }

      // Create the message
      const message = await createMessage({
        conversationId,
        senderId: user.userId,
        content,
        replyToId,
      })

      // Broadcast to all participants in the conversation room
      io.to(`conversation:${conversationId}`).emit('message:new', message)

      // Acknowledge to sender
      callback?.({ success: true, message })
    } catch (error) {
      callback?.({ error: 'Failed to send message' })
    }
  })

  /**
   * Typing indicator
   */
  socket.on('typing:start', async (payload: TypingPayload) => {
    const { conversationId } = payload

    // Verify participant
    const userIsParticipant = await isParticipant(conversationId, user.userId)
    if (!userIsParticipant) return

    // Broadcast to others in the conversation (excluding sender)
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      userId: user.userId,
      conversationId,
    })
  })

  /**
   * Stop typing indicator
   */
  socket.on('typing:stop', async (payload: TypingPayload) => {
    const { conversationId } = payload

    // Verify participant
    const userIsParticipant = await isParticipant(conversationId, user.userId)
    if (!userIsParticipant) return

    // Broadcast to others in the conversation (excluding sender)
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      userId: user.userId,
      conversationId,
    })
  })
}
