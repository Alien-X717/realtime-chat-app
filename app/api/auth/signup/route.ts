import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { hashPassword, validatePassword } from '@/lib/auth/password'
import { createUser, findUserByEmail } from '@/lib/db/users'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, displayName } = body

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          errors: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    try {
      const user = await createUser({
        username,
        email,
        passwordHash,
        displayName: displayName || undefined,
      })

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
        { status: 201 }
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
    } catch (error: unknown) {
      // Handle duplicate username/email errors from database
      // Check both error.code and error.cause.code for PostgreSQL errors
      const err = error as { code?: string; cause?: { code?: string } }
      const errorCode = err.code || err.cause?.code
      if (errorCode === '23505') {
        // PostgreSQL unique violation
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
