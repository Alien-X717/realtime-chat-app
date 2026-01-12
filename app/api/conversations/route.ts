import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authenticateRequest, AuthenticationError } from '@/lib/auth/middleware'
import { createConversation, getUserConversations } from '@/lib/db/conversations'

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * POST /api/conversations
 * Create a new conversation (DM or group)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    const body = await request.json()
    const { type, name, participantIds } = body

    // Validate required fields
    if (!type || !participantIds) {
      throw new ValidationError('Type and participant IDs are required')
    }

    if (type !== 'dm' && type !== 'group') {
      throw new ValidationError('Type must be either "dm" or "group"')
    }

    if (!Array.isArray(participantIds)) {
      throw new ValidationError('Participant IDs must be an array')
    }

    // Group conversations must have a name
    if (type === 'group' && !name) {
      throw new ValidationError('Group conversations must have a name')
    }

    // DM conversations should have exactly 1 other participant
    if (type === 'dm' && participantIds.length !== 1) {
      throw new ValidationError('DM conversations must have exactly 1 other participant')
    }

    // Create conversation with creator included in participants
    const allParticipantIds = Array.from(new Set([user.userId, ...participantIds]))

    const conversation = await createConversation({
      type,
      name: type === 'group' ? name : undefined,
      createdBy: user.userId,
      participantIds: allParticipantIds,
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/conversations
 * Get all conversations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)

    const conversations = await getUserConversations(user.userId)

    return NextResponse.json({ conversations }, { status: 200 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
