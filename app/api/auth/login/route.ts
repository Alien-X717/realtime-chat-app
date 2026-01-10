import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { verifyPassword } from '@/lib/auth/password'
import { findUserByEmail } from '@/lib/db/users'

class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email (case-insensitive)
    const user = await findUserByEmail(email)
    if (!user) {
      throw new AuthError('Invalid email or password')
    }

    // Verify password
    const isPasswordValid = await verifyPassword(user.passwordHash, password)
    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password')
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    })
    const refreshToken = generateRefreshToken({ userId: user.id })

    // Return user data (without password) and access token
    const { passwordHash: _, ...userWithoutPassword } = user

    const response = NextResponse.json(
      {
        user: userWithoutPassword,
        accessToken,
      },
      { status: 200 }
    )

    // Set refresh token as httpOnly cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
