import { NextRequest } from 'next/server'
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'

import { POST } from '@/app/api/auth/signup/route'
import { db, pool } from '@/db'
import { users } from '@/db/schema'

describe('POST /api/auth/signup', () => {
  // Set up test environment variables
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
  })

  beforeEach(async () => {
    // Clean up users before each test
    await db.delete(users)
  })

  afterAll(async () => {
    await db.delete(users)
    await pool.end()
  })

  it('should create a new user and return access token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        displayName: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user).toBeTruthy()
    expect(data.user.username).toBe('testuser')
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.displayName).toBe('Test User')
    expect(data.user.passwordHash).toBeUndefined() // Should not return password
    expect(data.accessToken).toBeTruthy()
    expect(typeof data.accessToken).toBe('string')
  })

  it('should create user without optional displayName', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'minimaluser',
        email: 'minimal@example.com',
        password: 'Test123!@#',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.username).toBe('minimaluser')
    expect(data.user.displayName).toBeNull()
  })

  it('should set refresh token cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'cookieuser',
        email: 'cookie@example.com',
        password: 'Test123!@#',
      }),
    })

    const response = await POST(request)
    const setCookieHeaders = response.headers.getSetCookie()

    expect(setCookieHeaders).toBeTruthy()
    expect(setCookieHeaders.length).toBeGreaterThan(0)
    const cookieHeader = setCookieHeaders[0]
    expect(cookieHeader).toContain('refreshToken=')
    expect(cookieHeader).toContain('HttpOnly')
    expect(cookieHeader).toContain('Path=/')
  })

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        // missing email and password
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should return 400 for weak password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
    expect(data.errors).toBeTruthy()
    expect(data.errors.length).toBeGreaterThan(0)
  })

  it('should return 400 for duplicate email', async () => {
    // Create first user
    const firstRequest = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'Test123!@#',
      }),
    })
    await POST(firstRequest)

    // Try to create second user with same email
    const secondRequest = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'Test123!@#',
      }),
    })

    const response = await POST(secondRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('already exists')
  })

  it('should return 400 for duplicate username', async () => {
    // Create first user
    const firstRequest = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'duplicateuser',
        email: 'user1@example.com',
        password: 'Test123!@#',
      }),
    })
    await POST(firstRequest)

    // Try to create second user with same username
    const secondRequest = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'duplicateuser',
        email: 'user2@example.com',
        password: 'Test123!@#',
      }),
    })

    const response = await POST(secondRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('already exists')
  })

  it('should return 400 for invalid email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'invalid-email',
        password: 'Test123!@#',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })
})
