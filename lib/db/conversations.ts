import { eq, and } from 'drizzle-orm'

import { db } from '@/db'
import { conversations, conversationParticipants } from '@/db/schema'

export interface CreateConversationInput {
  type: 'dm' | 'group'
  name?: string
  createdBy: string
  participantIds: string[]
}

/**
 * Create a new conversation (DM or group)
 * Also adds all participants to the conversation
 */
export async function createConversation(input: CreateConversationInput) {
  const { type, name, createdBy, participantIds } = input

  // Create conversation
  const [conversation] = await db
    .insert(conversations)
    .values({
      type,
      name: name || null,
      createdBy,
    })
    .returning()

  // Add participants
  const participantRecords = participantIds.map((userId) => ({
    conversationId: conversation.id,
    userId,
    role: userId === createdBy ? ('admin' as const) : ('member' as const),
  }))

  await db.insert(conversationParticipants).values(participantRecords)

  return conversation
}

/**
 * Find a conversation by ID
 */
export async function findConversationById(conversationId: string) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)

  return conversation || null
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string) {
  const result = await db
    .select({
      id: conversations.id,
      type: conversations.type,
      name: conversations.name,
      createdBy: conversations.createdBy,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversationParticipants.conversationId, conversations.id)
    )
    .where(eq(conversationParticipants.userId, userId))
    .orderBy(conversations.updatedAt)

  return result
}

/**
 * Add a participant to a conversation
 */
export async function addParticipant(conversationId: string, userId: string) {
  // Check if participant already exists
  const existing = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  const [participant] = await db
    .insert(conversationParticipants)
    .values({
      conversationId,
      userId,
      role: 'member',
    })
    .returning()

  return participant
}

/**
 * Remove a participant from a conversation
 */
export async function removeParticipant(conversationId: string, userId: string) {
  await db
    .delete(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
}

/**
 * Check if a user is a participant in a conversation
 */
export async function isParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      )
    )
    .limit(1)

  return !!participant
}
