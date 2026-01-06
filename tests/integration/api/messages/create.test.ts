import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { POST } from '@/app/api/messages/route'
import { db, pool } from '@/db'
import { users, conversations, conversationParticipants, messages } from '@/db/schema'
import { NextRequest } from 'next/server'
import { createUser } from '@/lib/db/users'
import { createConversation } from '@/lib/db/conversations'
import { hashPassword } from '@/lib/auth/password'
import { generateAccessToken } from '@/lib/auth/jwt'

describe('POST /api/messages', () => {
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
  })

  afterAll(async () => {
    await db.delete(messages)
    await db.delete(conversationParticipants)
    await db.delete(conversations)
    await db.delete(users)
    await pool.end()
  })

  it('should create a message in a conversation', async () => {
    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        content: 'Hello, World!',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBeTruthy()
    expect(data.conversationId).toBe(testConversationId)
    expect(data.senderId).toBe(testUser1Id)
    expect(data.content).toBe('Hello, World!')
  })

  it('should create a reply to another message', async () => {
    // Create original message
    const originalRequest = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        content: 'Original message',
      }),
    })

    const originalResponse = await POST(originalRequest)
    const originalData = await originalResponse.json()

    // Create reply
    const replyRequest = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        content: 'Reply message',
        replyToId: originalData.id,
      }),
    })

    const replyResponse = await POST(replyRequest)
    const replyData = await replyResponse.json()

    expect(replyResponse.status).toBe(201)
    expect(replyData.replyToId).toBe(originalData.id)
  })

  it('should return 401 for missing authorization', async () => {
    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        content: 'Test message',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        // Missing conversationId
        content: 'Test message',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
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

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3Token}`,
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        content: 'Unauthorized message',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('participant')
  })

  it('should allow empty content for file-only messages', async () => {
    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        content: '',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.content).toBe('')
  })
})
