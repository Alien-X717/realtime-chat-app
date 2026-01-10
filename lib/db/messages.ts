import { eq, and, desc, isNull, lt } from 'drizzle-orm'

import { db } from '@/db'
import { messages } from '@/db/schema'

export interface CreateMessageInput {
  conversationId: string
  senderId: string
  content: string
  replyToId?: string
}

export interface GetMessagesOptions {
  limit: number
  before?: Date
}

/**
 * Create a new message in a conversation
 */
export async function createMessage(input: CreateMessageInput) {
  const { conversationId, senderId, content, replyToId } = input

  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId,
      content,
      replyToId: replyToId || null,
    })
    .returning()

  return message
}

/**
 * Find a message by ID (excludes soft-deleted messages)
 */
export async function findMessageById(messageId: string) {
  const [message] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
    .limit(1)

  return message || null
}

/**
 * Get messages in a conversation with pagination
 * @param conversationId - The conversation ID
 * @param options - Pagination options (limit and cursor-based before)
 * @returns Array of messages ordered by createdAt DESC (newest first)
 */
export async function getConversationMessages(
  conversationId: string,
  options: GetMessagesOptions
) {
  const { limit, before } = options

  const conditions = [
    eq(messages.conversationId, conversationId),
    isNull(messages.deletedAt),
  ]

  if (before) {
    conditions.push(lt(messages.createdAt, before))
  }

  return await db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
}

/**
 * Update a message
 */
export async function updateMessage(messageId: string, updates: { content: string }) {
  const [updated] = await db
    .update(messages)
    .set({
      content: updates.content,
      updatedAt: new Date(),
    })
    .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
    .returning()

  return updated || null
}

/**
 * Soft delete a message
 */
export async function deleteMessage(messageId: string) {
  await db
    .update(messages)
    .set({
      deletedAt: new Date(),
    })
    .where(eq(messages.id, messageId))
}
