import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { AuthProvider, AuthContext } from './AuthContext';

import type { ReactNode } from 'react';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial auth state', () => {
    const { result } = renderHook(() => {
      const context = AuthContext;
      return context;
    });

    expect(result.current).toBeDefined();
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date().toISOString(),
    };

    const mockResponse = {
      user: mockUser,
      accessToken: 'mock-token',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(
      () => {
        const context = React.useContext(AuthContext);
        if (!context) throw new Error('Context not found');
        return context;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.login({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('mock-token');
      expect(result.current.error).toBeNull();
    });
  });

  it('handles login failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    const { result } = renderHook(
      () => {
        const context = React.useContext(AuthContext);
        if (!context) throw new Error('Context not found');
        return context;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(
      result.current.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('handles successful signup', async () => {
    const mockUser = {
      id: '1',
      username: 'newuser',
      email: 'new@example.com',
      displayName: 'New User',
      createdAt: new Date().toISOString(),
    };

    const mockResponse = {
      user: mockUser,
      accessToken: 'mock-token',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(
      () => {
        const context = React.useContext(AuthContext);
        if (!context) throw new Error('Context not found');
        return context;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.signup({
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123!',
      displayName: 'New User',
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('mock-token');
    });
  });

  it('handles logout', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: new Date().toISOString(),
    };

    // Mock login first
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        accessToken: 'mock-token',
      }),
    });

    const { result } = renderHook(
      () => {
        const context = React.useContext(AuthContext);
        if (!context) throw new Error('Context not found');
        return context;
      },
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.login({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Mock logout
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out successfully' }),
    });

    await result.current.logout();

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
    });
  });
});

// Add React import for JSX
import React from 'react';
