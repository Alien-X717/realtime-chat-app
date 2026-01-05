import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from '@/app/api/auth/logout/route'
import { pool } from '@/db'
import { NextRequest } from 'next/server'

describe('POST /api/auth/logout', () => {
  // Set up test environment variables
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
  })

  afterAll(async () => {
    await pool.end()
  })

  it('should logout successfully and clear refresh token cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBeTruthy()
    expect(data.message).toContain('Logged out')
  })

  it('should set refresh token cookie to expired', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    })

    const response = await POST(request)
    const setCookieHeaders = response.headers.getSetCookie()

    expect(setCookieHeaders).toBeTruthy()
    expect(setCookieHeaders.length).toBeGreaterThan(0)
    const cookieHeader = setCookieHeaders[0]
    expect(cookieHeader).toContain('refreshToken=')
    expect(cookieHeader).toContain('HttpOnly')
    // Cookie should have maxAge=0 or be expired
    expect(cookieHeader).toContain('Max-Age=0')
  })
})
