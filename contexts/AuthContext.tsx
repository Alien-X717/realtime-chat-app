'use client';

import React, { createContext, useCallback, useEffect, useState } from 'react';
import type {
  AuthContextType,
  AuthState,
  LoginCredentials,
  SignupData,
  AuthResponse,
  User,
} from '@/types/auth';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: true,
  error: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  // Fetch current user on mount
  const refreshUser = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear auth state
          setState(initialState);
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const user: User = await response.json();
      setState((prev) => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [state.accessToken]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      setState({
        user: data.user,
        accessToken: data.accessToken,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  }, []);

  // Signup function
  const signup = useCallback(async (data: SignupData) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const responseData: AuthResponse = await response.json();
      setState({
        user: responseData.user,
        accessToken: responseData.accessToken,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      }));
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
        },
      });

      setState(initialState);
    } catch (error) {
      // Clear state anyway on logout
      setState(initialState);
    }
  }, [state.accessToken]);

  // Auto-fetch user on mount if we have a token
  useEffect(() => {
    if (state.accessToken && !state.user) {
      refreshUser();
    } else if (!state.accessToken) {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.accessToken, state.user, refreshUser]);

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
