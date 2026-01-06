import { describe, it, expect } from 'vitest'

import { hashPassword, verifyPassword, validatePassword } from './password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'Test123!@#'
      const hash = await hashPassword(password)

      expect(hash).toBeTruthy()
      expect(hash).not.toBe(password)
      expect(hash).toMatch(/^\$argon2id\$/)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'Test123!@#'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow()
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'Test123!@#'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(hash, password)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'Test123!@#'
      const wrongPassword = 'WrongPass123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(hash, wrongPassword)

      expect(isValid).toBe(false)
    })

    it('should reject empty password', async () => {
      const hash = await hashPassword('Test123!@#')
      const isValid = await verifyPassword(hash, '')

      expect(isValid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const result = validatePassword('Test123!@#')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Test1!')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('test123!@#')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      )
    })

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('TEST123!@#')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      )
    })

    it('should reject password without number', () => {
      const result = validatePassword('TestTest!@#')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should reject password without special character', () => {
      const result = validatePassword('TestTest123')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      )
    })

    it('should accumulate multiple errors', () => {
      const result = validatePassword('test')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })
})
