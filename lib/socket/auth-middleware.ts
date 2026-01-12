import type { Socket, ExtendedError } from 'socket.io'

import { verifyAccessToken, AccessTokenPayload } from '../auth/jwt'
import './types' // Import type augmentation

/**
 * Socket.io authentication middleware
 *
 * This middleware:
 * - Extracts JWT token from socket handshake auth object
 * - Verifies the token using verifyAccessToken
 * - Attaches user data to socket.data.user
 * - Rejects unauthorized connections with a generic error message
 *
 * @param socket - Socket.io socket instance
 * @param next - Callback to continue or reject the connection
 */
export function authMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void
): void {
  try {
    // Extract token from socket handshake auth object
    const token = extractToken(socket)

    // If no token provided, reject the connection
    if (!token) {
      return next(new Error('Authentication failed'))
    }

    // Verify the token
    const payload = verifyAccessToken(token)

    // If token is invalid or verification fails, reject the connection
    if (!payload) {
      return next(new Error('Authentication failed'))
    }

    // Attach user data to socket
    socket.data.user = payload

    // Allow the connection
    next()
  } catch (error) {
    // Return generic error message to avoid leaking sensitive information
    next(new Error('Authentication failed'))
  }
}

/**
 * Extract and clean token from socket handshake auth object
 *
 * Supports:
 * - Direct token: { auth: { token: "xyz" } }
 * - Bearer format: { auth: { token: "Bearer xyz" } }
 * - Handles whitespace trimming
 *
 * @param socket - Socket.io socket instance
 * @returns Cleaned token string or null if not found/invalid
 */
function extractToken(socket: Socket): string | null {
  const auth = socket.handshake.auth

  // Check if auth object exists and has token
  if (!auth || typeof auth !== 'object') {
    return null
  }

  let token = auth.token

  // Check if token exists and is a string
  if (!token || typeof token !== 'string') {
    return null
  }

  // Trim whitespace
  token = token.trim()

  // If empty after trimming, return null
  if (token.length === 0) {
    return null
  }

  // Handle Bearer token format
  if (token.startsWith('Bearer ')) {
    token = token.substring(7).trim()
  }

  // If empty after removing Bearer prefix, return null
  if (token.length === 0) {
    return null
  }

  return token
}
