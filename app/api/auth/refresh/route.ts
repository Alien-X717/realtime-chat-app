import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth/jwt'
import { findUserById } from '@/lib/db/users'

/**
 * POST /api/auth/refresh
 * Use refresh token cookie to get a new access token
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    // Find user
    const user = await findUserById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    })
    const newRefreshToken = generateRefreshToken({ userId: user.id })

    // Return user data and new access token
    const { passwordHash: _, ...userWithoutPassword } = user

    const response = NextResponse.json(
      {
        user: userWithoutPassword,
        accessToken: newAccessToken,
      },
      { status: 200 }
    )

    // Set new refresh token cookie
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
  }
}
