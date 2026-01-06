import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/auth/middleware'
import { findUserById } from '@/lib/db/users'

export async function GET(request: NextRequest) {
  try {
    // Extract and verify user from Authorization header
    const authUser = extractUserFromRequest(request)

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      )
    }

    // Fetch full user data from database
    const user = await findUserById(authUser.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data without password
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword, { status: 200 })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
