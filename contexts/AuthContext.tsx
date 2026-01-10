'use client'

import React, { createContext, useCallback, useEffect, useState } from 'react'

import type {
  AuthContextType,
  AuthState,
  LoginCredentials,
  SignupData,
  AuthResponse,
  User,
} from '@/types/auth'

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: true,
  error: null,
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState)

  // Refresh token - uses httpOnly refresh token cookie to get new access token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      })

      if (!response.ok) {
        return false
      }

      const data: AuthResponse = await response.json()
      setState({
        user: data.user,
        accessToken: data.accessToken,
        loading: false,
        error: null,
      })
      return true
    } catch {
      return false
    }
  }, [])

  // Fetch current user using access token
  const refreshUser = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await refreshToken()
          if (!refreshed) {
            setState({ ...initialState, loading: false })
          }
          return
        }
        throw new Error('Failed to fetch user')
      }

      const user: User = await response.json()
      setState((prev) => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }))
    } catch {
      setState((prev) => ({
        ...prev,
        user: null,
        loading: false,
        error: 'Failed to fetch user',
      }))
    }
  }, [state.accessToken, refreshToken])

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data: AuthResponse = await response.json()
      setState({
        user: data.user,
        accessToken: data.accessToken,
        loading: false,
        error: null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }))
      throw error
    }
  }, [])

  // Signup function
  const signup = useCallback(async (data: SignupData) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Signup failed')
      }

      const responseData: AuthResponse = await response.json()
      setState({
        user: responseData.user,
        accessToken: responseData.accessToken,
        loading: false,
        error: null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      }))
      throw error
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      })

      setState(initialState)
    } catch (error) {
      // Clear state anyway on logout
      setState(initialState)
    }
  }, [state.accessToken])

  // On mount, try to refresh token if we don't have an access token
  // This handles page reloads where access token is lost but refresh token cookie exists
  useEffect(() => {
    let mounted = true

    async function initAuth() {
      // If we already have an access token and user, we're good
      if (state.accessToken && state.user) {
        return
      }

      // If we have an access token but no user, fetch the user
      if (state.accessToken && !state.user) {
        await refreshUser()
        return
      }

      // No access token - try to refresh using httpOnly cookie
      const refreshed = await refreshToken()
      if (mounted && !refreshed) {
        // No valid refresh token, set loading to false
        setState((prev) => ({ ...prev, loading: false }))
      }
    }

    initAuth()

    return () => {
      mounted = false
    }
  }, [state.accessToken, state.user, refreshUser, refreshToken])

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
