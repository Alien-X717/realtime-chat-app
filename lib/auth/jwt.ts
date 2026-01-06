import jwt from 'jsonwebtoken'

export interface AccessTokenPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  iat?: number
  exp?: number
}

/**
 * Generate an access token (short-lived: 15 minutes)
 */
export function generateAccessToken(payload: {
  userId: string
  email: string
}): string {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not defined')
  }

  const expiresIn = process.env.JWT_ACCESS_EXPIRY || '15m'
  // @ts-expect-error - jsonwebtoken types expect StringValue but process.env returns string
  return jwt.sign(payload, secret, { expiresIn })
}

/**
 * Generate a refresh token (long-lived: 7 days)
 */
export function generateRefreshToken(payload: { userId: string }): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined')
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRY || '7d'
  // @ts-expect-error - jsonwebtoken types expect StringValue but process.env returns string
  return jwt.sign(payload, secret, { expiresIn })
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const secret = process.env.JWT_ACCESS_SECRET
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not defined')
    }

    const payload = jwt.verify(token, secret) as AccessTokenPayload
    return payload
  } catch (error) {
    return null
  }
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const secret = process.env.JWT_REFRESH_SECRET
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined')
    }

    const payload = jwt.verify(token, secret) as RefreshTokenPayload
    return payload
  } catch (error) {
    return null
  }
}
