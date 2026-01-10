import { eq } from 'drizzle-orm'
import { describe, it, expect, beforeEach, afterAll } from 'vitest'

import { db, pool } from '@/db'
import { users, conversations, conversationParticipants } from '@/db/schema'

import { hashPassword } from '../auth/password'

import {
  createConversation,
  findConversationById,
  getUserConversations,
  addParticipant,
  removeParticipant,
  isParticipant,
} from './conversations'
import { createUser } from './users'

describe('Conversation Database Queries', () => {
  let testUser1Id: string
  let testUser2Id: string
  let testUser3Id: string

  beforeEach(async () => {
    // Clean up before each test
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

    const user3 = await createUser({
      username: 'user3',
      email: 'user3@example.com',
      passwordHash: await hashPassword('Password123!'),
      displayName: 'User Three',
    })
    testUser3Id = user3.id
  })

  afterAll(async () => {
    await db.delete(conversationParticipants)
    await db.delete(conversations)
    await db.delete(users)
    await pool.end()
  })

  describe('createConversation', () => {
    it('should create a DM conversation between two users', async () => {
      const conversation = await createConversation({
        type: 'dm',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      expect(conversation).toBeTruthy()
      expect(conversation.id).toBeTruthy()
      expect(conversation.type).toBe('dm')
      expect(conversation.name).toBeNull()
      expect(conversation.createdBy).toBe(testUser1Id)
    })

    it('should create a group conversation with name', async () => {
      const conversation = await createConversation({
        type: 'group',
        name: 'Test Group',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id, testUser3Id],
      })

      expect(conversation).toBeTruthy()
      expect(conversation.type).toBe('group')
      expect(conversation.name).toBe('Test Group')
      expect(conversation.createdBy).toBe(testUser1Id)
    })

    it('should add participants to conversation', async () => {
      const conversation = await createConversation({
        type: 'group',
        name: 'Test Group',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      const isUser1Participant = await isParticipant(conversation.id, testUser1Id)
      const isUser2Participant = await isParticipant(conversation.id, testUser2Id)

      expect(isUser1Participant).toBe(true)
      expect(isUser2Participant).toBe(true)
    })

    it('should set creator as admin role', async () => {
      const conversation = await createConversation({
        type: 'group',
        name: 'Test Group',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      // Query participants to check role
      const participants = await db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id))

      const creatorParticipant = participants.find((p) => p.userId === testUser1Id)
      expect(creatorParticipant?.role).toBe('admin')
    })
  })

  describe('findConversationById', () => {
    it('should find conversation by ID', async () => {
      const created = await createConversation({
        type: 'dm',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      const found = await findConversationById(created.id)

      expect(found).toBeTruthy()
      expect(found?.id).toBe(created.id)
      expect(found?.type).toBe('dm')
    })

    it('should return null for non-existent conversation', async () => {
      const found = await findConversationById('00000000-0000-0000-0000-000000000000')
      expect(found).toBeNull()
    })
  })

  describe('getUserConversations', () => {
    it('should get all conversations for a user', async () => {
      await createConversation({
        type: 'dm',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      await createConversation({
        type: 'group',
        name: 'Group Chat',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id, testUser3Id],
      })

      const conversations = await getUserConversations(testUser1Id)

      expect(conversations).toHaveLength(2)
    })

    it('should return empty array if user has no conversations', async () => {
      const conversations = await getUserConversations(testUser1Id)
      expect(conversations).toHaveLength(0)
    })
  })

  describe('addParticipant', () => {
    it('should add a participant to conversation', async () => {
      const conversation = await createConversation({
        type: 'group',
        name: 'Test Group',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      await addParticipant(conversation.id, testUser3Id)

      const isUser3Participant = await isParticipant(conversation.id, testUser3Id)
      expect(isUser3Participant).toBe(true)
    })

    it('should not duplicate participant if already exists', async () => {
      const conversation = await createConversation({
        type: 'group',
        name: 'Test Group',
        createdBy: testUser1Id,
        participantIds: [testUser1Id],
      })

      await addParticipant(conversation.id, testUser1Id)
      await addParticipant(conversation.id, testUser1Id)

      const participants = await db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conversation.id))

      expect(participants).toHaveLength(1)
    })
  })

  describe('removeParticipant', () => {
    it('should remove a participant from conversation', async () => {
      const conversation = await createConversation({
        type: 'group',
        name: 'Test Group',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      await removeParticipant(conversation.id, testUser2Id)

      const isUser2Participant = await isParticipant(conversation.id, testUser2Id)
      expect(isUser2Participant).toBe(false)
    })
  })

  describe('isParticipant', () => {
    it('should return true if user is participant', async () => {
      const conversation = await createConversation({
        type: 'dm',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      const result = await isParticipant(conversation.id, testUser1Id)
      expect(result).toBe(true)
    })

    it('should return false if user is not participant', async () => {
      const conversation = await createConversation({
        type: 'dm',
        createdBy: testUser1Id,
        participantIds: [testUser1Id, testUser2Id],
      })

      const result = await isParticipant(conversation.id, testUser3Id)
      expect(result).toBe(false)
    })
  })
})
