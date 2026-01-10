import { eq } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'

import { POST } from '@/app/api/conversations/route'
import { db, pool } from '@/db'
import { users, conversations, conversationParticipants } from '@/db/schema'
import { generateAccessToken } from '@/lib/auth/jwt'
import { hashPassword } from '@/lib/auth/password'
import { createUser } from '@/lib/db/users'

describe('POST /api/conversations', () => {
  let testUser1Id: string
  let testUser2Id: string
  let testUser1Token: string

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
  })

  beforeEach(async () => {
    // Clean up
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
  })

  afterAll(async () => {
    await db.delete(conversationParticipants)
    await db.delete(conversations)
    await db.delete(users)
    await pool.end()
  })

  it('should create a DM conversation', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        type: 'dm',
        participantIds: [testUser2Id],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBeTruthy()
    expect(data.type).toBe('dm')
    expect(data.name).toBeNull()
    expect(data.createdBy).toBe(testUser1Id)
  })

  it('should create a group conversation', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        type: 'group',
        name: 'Test Group',
        participantIds: [testUser2Id],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.type).toBe('group')
    expect(data.name).toBe('Test Group')
  })

  it('should automatically include creator in participants', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        type: 'dm',
        participantIds: [testUser2Id],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Check participants
    const participants = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, data.id))

    expect(participants).toHaveLength(2)
    expect(participants.some((p) => p.userId === testUser1Id)).toBe(true)
    expect(participants.some((p) => p.userId === testUser2Id)).toBe(true)
  })

  it('should return 401 for missing authorization', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'dm',
        participantIds: [testUser2Id],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBeTruthy()
  })

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        // Missing type
        participantIds: [testUser2Id],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should return 400 for group without name', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUser1Token}`,
      },
      body: JSON.stringify({
        type: 'group',
        participantIds: [testUser2Id],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('name')
  })
})
