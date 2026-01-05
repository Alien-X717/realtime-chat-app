import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { POST as LoginPOST } from '@/app/api/auth/login/route'
import { db, pool } from '@/db'
import { users } from '@/db/schema'
import { NextRequest } from 'next/server'
import { createUser } from '@/lib/db/users'
import { hashPassword } from '@/lib/auth/password'

describe('POST /api/auth/login', () => {
  // Set up test environment variables
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
  })

  beforeEach(async () => {
    // Clean up users before each test
    await db.delete(users)

    // Create a test user for login tests
    await createUser({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: await hashPassword('Test123!@#'),
      displayName: 'Test User',
    })
  })

  afterAll(async () => {
    await db.delete(users)
    await pool.end()
  })

  it('should login with valid credentials and return access token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
      }),
    })

    const response = await LoginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeTruthy()
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.username).toBe('testuser')
    expect(data.user.displayName).toBe('Test User')
    expect(data.user.passwordHash).toBeUndefined() // Should not return password
    expect(data.accessToken).toBeTruthy()
    expect(typeof data.accessToken).toBe('string')
  })

  it('should set refresh token cookie on successful login', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
      }),
    })

    const response = await LoginPOST(request)
    const setCookieHeaders = response.headers.getSetCookie()

    expect(setCookieHeaders).toBeTruthy()
    expect(setCookieHeaders.length).toBeGreaterThan(0)
    const cookieHeader = setCookieHeaders[0]
    expect(cookieHeader).toContain('refreshToken=')
    expect(cookieHeader).toContain('HttpOnly')
    expect(cookieHeader).toContain('Path=/')
  })

  it('should login with case-insensitive email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'TEST@EXAMPLE.COM',
        password: 'Test123!@#',
      }),
    })

    const response = await LoginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.email).toBe('test@example.com')
  })

  it('should return 400 for missing email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: 'Test123!@#',
      }),
    })

    const response = await LoginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should return 400 for missing password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    })

    const response = await LoginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeTruthy()
  })

  it('should return 401 for non-existent email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'Test123!@#',
      }),
    })

    const response = await LoginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid')
  })

  it('should return 401 for incorrect password', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WrongPassword123!',
      }),
    })

    const response = await LoginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('Invalid')
  })
})
