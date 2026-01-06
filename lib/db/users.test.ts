import { describe, it, expect, beforeEach, afterAll } from 'vitest'

import { db, pool } from '@/db'
import { users } from '@/db/schema'

import { hashPassword } from '../auth/password'

import { createUser, findUserByEmail, findUserById, updateUser } from './users'

describe('User Database Operations', () => {
  // Clean up test users after all tests
  afterAll(async () => {
    await db.delete(users)
    await pool.end()
  })

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: await hashPassword('Test123!@#'),
        displayName: 'Test User',
      }

      const user = await createUser(userData)

      expect(user).toBeTruthy()
      expect(user.id).toBeTruthy()
      expect(user.username).toBe(userData.username)
      expect(user.email).toBe(userData.email)
      expect(user.passwordHash).toBe(userData.passwordHash)
      expect(user.displayName).toBe(userData.displayName)
      expect(user.status).toBe('offline')
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it('should create user with minimal fields', async () => {
      const userData = {
        username: 'minimaluser',
        email: 'minimal@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      const user = await createUser(userData)

      expect(user).toBeTruthy()
      expect(user.username).toBe(userData.username)
      expect(user.email).toBe(userData.email)
      expect(user.displayName).toBeNull()
    })

    it('should throw error for duplicate email', async () => {
      const userData = {
        username: 'user1',
        email: 'duplicate@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      await createUser(userData)

      const duplicateUser = {
        username: 'user2',
        email: 'duplicate@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      await expect(createUser(duplicateUser)).rejects.toThrow()
    })

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'duplicateusername',
        email: 'user1@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      await createUser(userData)

      const duplicateUser = {
        username: 'duplicateusername',
        email: 'user2@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      await expect(createUser(duplicateUser)).rejects.toThrow()
    })
  })

  describe('findUserByEmail', () => {
    beforeEach(async () => {
      await db.delete(users)
    })

    it('should find user by email', async () => {
      const userData = {
        username: 'findtest',
        email: 'find@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      await createUser(userData)
      const foundUser = await findUserByEmail('find@example.com')

      expect(foundUser).toBeTruthy()
      expect(foundUser?.email).toBe('find@example.com')
      expect(foundUser?.username).toBe('findtest')
    })

    it('should return null for non-existent email', async () => {
      const foundUser = await findUserByEmail('nonexistent@example.com')

      expect(foundUser).toBeNull()
    })

    it('should be case-insensitive', async () => {
      const userData = {
        username: 'casetest',
        email: 'CasE@ExAmPlE.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      await createUser(userData)
      const foundUser = await findUserByEmail('case@example.com')

      expect(foundUser).toBeTruthy()
      expect(foundUser?.email).toBe('CasE@ExAmPlE.com')
    })
  })

  describe('findUserById', () => {
    beforeEach(async () => {
      await db.delete(users)
    })

    it('should find user by ID', async () => {
      const userData = {
        username: 'idtest',
        email: 'id@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      const createdUser = await createUser(userData)
      const foundUser = await findUserById(createdUser.id)

      expect(foundUser).toBeTruthy()
      expect(foundUser?.id).toBe(createdUser.id)
      expect(foundUser?.email).toBe('id@example.com')
    })

    it('should return null for non-existent ID', async () => {
      const foundUser = await findUserById('00000000-0000-0000-0000-000000000000')

      expect(foundUser).toBeNull()
    })
  })

  describe('updateUser', () => {
    beforeEach(async () => {
      await db.delete(users)
    })

    it('should update user display name', async () => {
      const userData = {
        username: 'updatetest',
        email: 'update@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      const createdUser = await createUser(userData)
      const updatedUser = await updateUser(createdUser.id, {
        displayName: 'Updated Name',
      })

      expect(updatedUser).toBeTruthy()
      expect(updatedUser?.displayName).toBe('Updated Name')
    })

    it('should update user status', async () => {
      const userData = {
        username: 'statustest',
        email: 'status@example.com',
        passwordHash: await hashPassword('Test123!@#'),
      }

      const createdUser = await createUser(userData)
      const updatedUser = await updateUser(createdUser.id, {
        status: 'online',
      })

      expect(updatedUser?.status).toBe('online')
    })

    it('should return null for non-existent user', async () => {
      const updatedUser = await updateUser('00000000-0000-0000-0000-000000000000', {
        displayName: 'Test',
      })

      expect(updatedUser).toBeNull()
    })
  })
})
