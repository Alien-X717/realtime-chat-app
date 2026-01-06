import { eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { users } from '@/db/schema'

export interface CreateUserData {
  username: string
  email: string
  passwordHash: string
  displayName?: string
}

export interface UpdateUserData {
  displayName?: string
  avatarUrl?: string
  status?: string
  lastSeenAt?: Date
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData) {
  const [user] = await db
    .insert(users)
    .values({
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      displayName: data.displayName || null,
      status: 'offline',
    })
    .returning()

  return user
}

/**
 * Find user by email (case-insensitive)
 */
export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = LOWER(${email})`)
    .limit(1)

  return user || null
}

/**
 * Alias for findUserByEmail
 */
export async function getUserByEmail(email: string) {
  return findUserByEmail(email)
}

/**
 * Find user by username
 */
export async function getUserByUsername(username: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.username}) = LOWER(${username})`)
    .limit(1)

  return user || null
}

/**
 * Find user by ID
 */
export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)

  return user || null
}

/**
 * Alias for findUserById
 */
export async function getUserById(id: string) {
  return findUserById(id)
}

/**
 * Update user information
 */
export async function updateUser(id: string, data: UpdateUserData) {
  const [user] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning()

  return user || null
}
