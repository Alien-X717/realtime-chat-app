import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, AuthenticationError } from '@/lib/auth/middleware'
import { getConversationMessages } from '@/lib/db/messages'
import { isParticipant, findConversationById } from '@/lib/db/conversations'

class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * GET /api/conversations/[id]/messages
 * Get messages in a conversation with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    const conversationId = params.id

    // Check if conversation exists
    const conversation = await findConversationById(conversationId)
    if (!conversation) {
      throw new NotFoundError('Conversation not found')
    }

    // Check if user is a participant
    const userIsParticipant = await isParticipant(conversationId, user.userId)
    if (!userIsParticipant) {
      throw new ForbiddenError('You must be a participant in this conversation')
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const beforeParam = searchParams.get('before')
    const before = beforeParam ? new Date(beforeParam) : undefined

    // Get messages
    const messagesList = await getConversationMessages(conversationId, {
      limit,
      before,
    })

    return NextResponse.json({ messages: messagesList }, { status: 200 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
