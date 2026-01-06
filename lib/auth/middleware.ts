import { NextRequest } from 'next/server'
import { verifyAccessToken, AccessTokenPayload } from './jwt'

/**
 * Extract and verify user from Authorization header
 * Returns user payload if valid, null otherwise
 */
export function extractUserFromRequest(
  request: NextRequest
): AccessTokenPayload | null {
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
