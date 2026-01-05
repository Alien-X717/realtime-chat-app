import argon2 from 'argon2'

/**
 * Hash a password using Argon2id
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty')
  }

  return argon2.hash(password, {
    type: argon2.argon2id, // Argon2id is the recommended variant
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3, // Number of iterations
    parallelism: 1, // Number of threads
  })
}

/**
 * Verify a password against a hash
 * @param hash - The hashed password from database
 * @param password - Plain text password to verify
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  if (!password || password.length === 0) {
    return false
  }

  try {
    return await argon2.verify(hash, password)
  } catch (error) {
    // Invalid hash format or other error
    return false
  }
}

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns PasswordValidationResult - Validation result with errors
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
