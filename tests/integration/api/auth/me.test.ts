import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { GET } from '@/app/api/auth/me/route'
import { db, pool } from '@/db'
import { users } from '@/db/schema'
import { NextRequest } from 'next/server'
import { createUser } from '@/lib/db/users'
import { hashPassword } from '@/lib/auth/password'
import { generateAccessToken } from '@/lib/auth/jwt'
import { eq } from 'drizzle-orm'

describe('GET /api/auth/me', () => {
  let testUserId: string
  let testAccessToken: string

  // Set up test environment variables
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
  })

  beforeEach(async () => {
    // Clean up users before each test
    await db.delete(users)

    // Create a test user
    const user = await createUser({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: await hashPassword('Test123!@#'),
      displayName: 'Test User',
    })

    testUserId = user.id

    // Generate access token for the test user
    testAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    })
  })

  afterAll(async () => {
    await db.delete(users)
    await pool.end()
  })

  it('should return current user with valid access token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${testAccessToken}`,
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(testUserId)
    expect(data.username).toBe('testuser')
    expect(data.email).toBe('test@example.com')
    expect(data.displayName).toBe('Test User')
    expect(data.status).toBe('offline')
    expect(data.createdAt).toBeTruthy()
    expect(data.passwordHash).toBeUndefined() // Should not return password
  })

  it('should return 401 for missing Authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/me')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Unauthorized')
  })

  it('should return 401 for invalid token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: {
        Authorization: 'Bearer invalid.token.here',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Unauthorized')
  })

  it('should return 401 for malformed Authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: {
        Authorization: 'NotBearer token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Unauthorized')
  })

  it('should return 404 if user no longer exists', async () => {
    // Delete the user but keep the valid token
    await db.delete(users).where(eq(users.id, testUserId))

    const request = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${testAccessToken}`,
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('User not found')
  })
})
