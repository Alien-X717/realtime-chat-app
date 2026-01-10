import { NextRequest } from 'next/server'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'

import { GET } from '@/app/api/conversations/[id]/messages/route'
import { db, pool } from '@/db'
import { users, conversations, conversationParticipants, messages } from '@/db/schema'
import { generateAccessToken } from '@/lib/auth/jwt'
import { hashPassword } from '@/lib/auth/password'
import { createConversation } from '@/lib/db/conversations'
import { createMessage } from '@/lib/db/messages'
import { createUser } from '@/lib/db/users'

describe('GET /api/conversations/[id]/messages', () => {
  let testUser1Id: string
  let testUser2Id: string
  let testUser1Token: string
  let testConversationId: string

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
  })

  beforeEach(async () => {
    // Clean up
    await db.delete(messages)
    await db.delete(conversationParticipants)
    await db.delete(conversations)
    await db.delete(users)

    // Create test users
    const user1 = await createUser({
      username: 'user1',
      email: 'user1@example.com',
      passwordHash: await hashPassword('Test123!@#'),
      displayName: 'User One',
    })
    testUser1Id = user1.id

    const user2 = await createUser({
      username: 'user2',
      email: 'user2@example.com',
      passwordHash: await hashPassword('Test123!@#'),
      displayName: 'User Two',
    })
    testUser2Id = user2.id

    // Generate token for user1
    testUser1Token = generateAccessToken({
      userId: user1.id,
      email: user1.email,
    })

    // Create test conversation
    const conversation = await createConversation({
      type: 'dm',
      createdBy: testUser1Id,
      participantIds: [testUser1Id, testUser2Id],
    })
    testConversationId = conversation.id

    // Create some messages
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

  afterAll(async () => {
    await db.delete(messages)
    await db.delete(conversationParticipants)
    await db.delete(conversations)
    await db.delete(users)
    await pool.end()
  })

  it('should get messages in a conversation', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/conversations/${testConversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${testUser1Token}`,
        },
      }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: testConversationId }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.messages).toHaveLength(3)
    // Should be ordered newest first
    expect(data.messages[0].content).toBe('Message 3')
    expect(data.messages[1].content).toBe('Message 2')
    expect(data.messages[2].content).toBe('Message 1')
  })

  it('should support pagination with limit', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/conversations/${testConversationId}/messages?limit=2`,
      {
        headers: {
          Authorization: `Bearer ${testUser1Token}`,
        },
      }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: testConversationId }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.messages).toHaveLength(2)
    expect(data.messages[0].content).toBe('Message 3')
    expect(data.messages[1].content).toBe('Message 2')
  })

  it('should return 401 for missing authorization', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/conversations/${testConversationId}/messages`
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: testConversationId }),
    })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('should return 403 if user is not a participant', async () => {
    // Create another user who is not in the conversation
    const user3 = await createUser({
      username: 'user3',
      email: 'user3@example.com',
      passwordHash: await hashPassword('Test123!@#'),
      displayName: 'User Three',
    })

    const user3Token = generateAccessToken({
      userId: user3.id,
      email: user3.email,
    })

    const request = new NextRequest(
      `http://localhost:3000/api/conversations/${testConversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${user3Token}`,
        },
      }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: testConversationId }),
    })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('participant')
  })

  it('should return 404 for non-existent conversation', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/conversations/00000000-0000-0000-0000-000000000000/messages',
      {
        headers: {
          Authorization: `Bearer ${testUser1Token}`,
        },
      }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('not found')
  })
})
