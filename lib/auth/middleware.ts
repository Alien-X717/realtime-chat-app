import type { NextRequest } from 'next/server'

import type { AccessTokenPayload } from './jwt'
import { verifyAccessToken } from './jwt'

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Extract and verify user from Authorization header
 * Returns user payload if valid, null otherwise
 */
export function extractUserFromRequest(request: NextRequest): AccessTokenPayload | null {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return null
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!token || token.trim().length === 0) {
      return null
    }

    // Verify and decode the token
    const payload = verifyAccessToken(token)

    return payload
  } catch (error) {
    return null
  }
}

/**
 * Authenticate request or throw error
 * Throws AuthenticationError if request is not authenticated
 */
export function authenticateRequest(request: NextRequest): AccessTokenPayload {
  const user = extractUserFromRequest(request)

  if (!user) {
    throw new AuthenticationError('Unauthorized')
  }

  return user
}
