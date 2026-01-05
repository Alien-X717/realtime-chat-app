import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/db/users'
import { verifyPassword } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'

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
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(user.passwordHash, password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
