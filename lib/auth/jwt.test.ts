import { describe, it, expect, beforeAll } from 'vitest'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt'

describe('JWT Utilities', () => {
  const testUserId = '123e4567-e89b-12d3-a456-426614174000'
  const testEmail = 'test@example.com'

  // Set test secrets
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
  })

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken({ userId: testUserId, email: testEmail })

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include user data in token payload', () => {
      const token = generateAccessToken({ userId: testUserId, email: testEmail })
      const payload = verifyAccessToken(token)

      expect(payload).toBeTruthy()
      expect(payload?.userId).toBe(testUserId)
      expect(payload?.email).toBe(testEmail)
    })

    it('should set expiration time', () => {
      const token = generateAccessToken({ userId: testUserId, email: testEmail })
      const payload = verifyAccessToken(token)

      expect(payload?.exp).toBeTruthy()
      expect(payload?.iat).toBeTruthy()
      expect(payload!.exp! > payload!.iat!).toBe(true)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken({ userId: testUserId })

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should include user ID in token payload', () => {
      const token = generateRefreshToken({ userId: testUserId })
      const payload = verifyRefreshToken(token)

      expect(payload).toBeTruthy()
      expect(payload?.userId).toBe(testUserId)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken({ userId: testUserId, email: testEmail })
      const payload = verifyAccessToken(token)

      expect(payload).toBeTruthy()
      expect(payload?.userId).toBe(testUserId)
      expect(payload?.email).toBe(testEmail)
    })

    it('should return null for invalid token', () => {
      const payload = verifyAccessToken('invalid.token.here')

      expect(payload).toBeNull()
    })

    it('should return null for token with wrong secret', () => {
      const token = generateAccessToken({ userId: testUserId, email: testEmail })

      // Temporarily change secret
      const originalSecret = process.env.JWT_ACCESS_SECRET
      process.env.JWT_ACCESS_SECRET = 'different-secret'

      const payload = verifyAccessToken(token)

      // Restore secret
      process.env.JWT_ACCESS_SECRET = originalSecret

      expect(payload).toBeNull()
    })

    it('should return null for empty token', () => {
      const payload = verifyAccessToken('')

      expect(payload).toBeNull()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken({ userId: testUserId })
      const payload = verifyRefreshToken(token)

      expect(payload).toBeTruthy()
      expect(payload?.userId).toBe(testUserId)
    })

    it('should return null for invalid token', () => {
      const payload = verifyRefreshToken('invalid.token.here')

      expect(payload).toBeNull()
    })

    it('should return null for access token (wrong secret)', () => {
      const accessToken = generateAccessToken({
        userId: testUserId,
        email: testEmail,
      })
      const payload = verifyRefreshToken(accessToken)

      expect(payload).toBeNull()
    })
  })
})
