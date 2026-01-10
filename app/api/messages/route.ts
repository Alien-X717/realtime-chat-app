import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authenticateRequest, AuthenticationError } from '@/lib/auth/middleware'
import { isParticipant } from '@/lib/db/conversations'
import { createMessage } from '@/lib/db/messages'

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * POST /api/messages
 * Create a new message in a conversation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    const body = await request.json()
    const { conversationId, content, replyToId } = body

    // Validate required fields
    if (!conversationId) {
      throw new ValidationError('Conversation ID is required')
    }

    if (content === undefined) {
      throw new ValidationError(
        'Content is required (can be empty for file-only messages)'
      )
    }

    // Check if user is a participant in the conversation
    const userIsParticipant = await isParticipant(conversationId, user.userId)
    if (!userIsParticipant) {
      throw new ForbiddenError('You must be a participant in this conversation')
    }

    // Create the message
    const message = await createMessage({
      conversationId,
      senderId: user.userId,
      content,
      replyToId,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
