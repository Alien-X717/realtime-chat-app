import { describe, it, expect, beforeEach, afterAll } from 'vitest'

import { db, pool } from '@/db'
import { users, conversations, conversationParticipants, messages } from '@/db/schema'

import { hashPassword } from '../auth/password'

import { createConversation } from './conversations'
import {
  createMessage,
  findMessageById,
  getConversationMessages,
  deleteMessage,
  updateMessage,
} from './messages'
import { createUser } from './users'

describe('Message Database Queries', () => {
  let testUser1Id: string
  let testUser2Id: string
  let testConversationId: string

  beforeEach(async () => {
    // Clean up before each test
    await db.delete(messages)
    await db.delete(conversationParticipants)
    await db.delete(conversations)
    await db.delete(users)

    // Create test users
    const user1 = await createUser({
      username: 'user1',
      email: 'user1@example.com',
      passwordHash: await hashPassword('Password123!'),
      displayName: 'User One',
    })
    testUser1Id = user1.id

    const user2 = await createUser({
      username: 'user2',
      email: 'user2@example.com',
      passwordHash: await hashPassword('Password123!'),
      displayName: 'User Two',
    })
    testUser2Id = user2.id

    // Create test conversation
    const conversation = await createConversation({
      type: 'dm',
      createdBy: testUser1Id,
      participantIds: [testUser1Id, testUser2Id],
    })
    testConversationId = conversation.id
  })

  afterAll(async () => {
    await db.delete(messages)
    await db.delete(conversationParticipants)
    await db.delete(conversations)
    await db.delete(users)
    await pool.end()
  })

  describe('createMessage', () => {
    it('should create a message in a conversation', async () => {
      const message = await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: 'Hello, World!',
      })

      expect(message).toBeTruthy()
      expect(message.id).toBeTruthy()
      expect(message.conversationId).toBe(testConversationId)
      expect(message.senderId).toBe(testUser1Id)
      expect(message.content).toBe('Hello, World!')
      expect(message.deletedAt).toBeNull()
    })

    it('should create a message with empty content (for file-only messages)', async () => {
      const message = await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: '',
      })

      expect(message.content).toBe('')
    })

    it('should create a reply to another message', async () => {
      const originalMessage = await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: 'Original message',
      })

      const reply = await createMessage({
        conversationId: testConversationId,
        senderId: testUser2Id,
        content: 'Reply to message',
        replyToId: originalMessage.id,
      })

      expect(reply.replyToId).toBe(originalMessage.id)
    })
  })

  describe('findMessageById', () => {
    it('should find message by ID', async () => {
      const created = await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: 'Test message',
      })

      const found = await findMessageById(created.id)

      expect(found).toBeTruthy()
      expect(found?.id).toBe(created.id)
      expect(found?.content).toBe('Test message')
    })

    it('should return null for non-existent message', async () => {
      const found = await findMessageById('00000000-0000-0000-0000-000000000000')
      expect(found).toBeNull()
    })

    it('should not return soft-deleted messages', async () => {
      const message = await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: 'Test message',
      })

      await deleteMessage(message.id)

      const found = await findMessageById(message.id)
      expect(found).toBeNull()
    })
  })

  describe('getConversationMessages', () => {
    beforeEach(async () => {
      // Create multiple messages
      await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: 'Message 1',
      })
      await createMessage({
        conversationId: testConversationId,
        senderId: testUser2Id,
        content: 'Message 2',
      })
      await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: 'Message 3',
      })
    })

    it('should get all messages in a conversation', async () => {
      const result = await getConversationMessages(testConversationId, {
        limit: 50,
      })

      expect(result).toHaveLength(3)
      // Should be ordered by createdAt DESC (newest first)
      expect(result[0].content).toBe('Message 3')
      expect(result[1].content).toBe('Message 2')
      expect(result[2].content).toBe('Message 1')
    })

    it('should support pagination with limit', async () => {
      const result = await getConversationMessages(testConversationId, {
        limit: 2,
      })

      expect(result).toHaveLength(2)
      expect(result[0].content).toBe('Message 3')
      expect(result[1].content).toBe('Message 2')
    })

    it('should support pagination with cursor (before)', async () => {
      const firstPage = await getConversationMessages(testConversationId, {
        limit: 2,
      })

      const secondPage = await getConversationMessages(testConversationId, {
        limit: 2,
        before: firstPage[1].createdAt,
      })

      expect(secondPage).toHaveLength(1)
      expect(secondPage[0].content).toBe('Message 1')
    })

    it('should not return soft-deleted messages', async () => {
      const allMessages = await getConversationMessages(testConversationId, {
        limit: 50,
      })
      const messageToDelete = allMessages[1]

      await deleteMessage(messageToDelete.id)

      const messagesAfterDelete = await getConversationMessages(testConversationId, {
        limit: 50,
      })

      expect(messagesAfterDelete).toHaveLength(2)
      expect(messagesAfterDelete.find((m) => m.id === messageToDelete.id)).toBeUndefined()
    })
  })

  describe('updateMessage', () => {
    it('should update message content', async () => {
      const message = await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: 'Original content',
      })

      const updated = await updateMessage(message.id, {
        content: 'Updated content',
      })

      expect(updated).toBeTruthy()
      expect(updated?.content).toBe('Updated content')
      expect(updated?.updatedAt).not.toBe(message.updatedAt)
    })

    it('should return null for non-existent message', async () => {
      const updated = await updateMessage('00000000-0000-0000-0000-000000000000', {
        content: 'Updated content',
      })

      expect(updated).toBeNull()
    })
  })

  describe('deleteMessage', () => {
    it('should soft delete a message', async () => {
      const message = await createMessage({
        conversationId: testConversationId,
        senderId: testUser1Id,
        content: 'Message to delete',
      })

      await deleteMessage(message.id)

      const found = await findMessageById(message.id)
      expect(found).toBeNull()
    })
  })
})
