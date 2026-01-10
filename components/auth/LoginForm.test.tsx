import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { AuthContext } from '@/contexts/AuthContext'
import type { AuthContextType } from '@/types/auth'

import { LoginForm } from './LoginForm'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const mockLogin = vi.fn()
const mockAuthContext: AuthContextType = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  login: mockLogin,
  signup: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
}

const renderWithAuth = (context: Partial<AuthContextType> = {}) => {
  return render(
    <AuthContext.Provider value={{ ...mockAuthContext, ...context }}>
      <LoginForm />
    </AuthContext.Provider>
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with all fields', () => {
    renderWithAuth()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const submitButton = screen.getByRole('button', { name: /login/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('calls login function with correct data on valid submission', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce(undefined)
    renderWithAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('displays error message when login fails', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValueOnce(new Error(errorMessage))
    renderWithAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('disables form while submitting', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))
    renderWithAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(screen.getByText(/logging in.../i)).toBeInTheDocument()
  })

  it('clears field error when user starts typing', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    // Submit to show errors
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })

    // Start typing
    await user.type(emailInput, 't')

    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    })
  })

  it('has link to signup page', () => {
    renderWithAuth()

    const signupLink = screen.getByRole('link', { name: /sign up/i })
    expect(signupLink).toBeInTheDocument()
    expect(signupLink).toHaveAttribute('href', '/signup')
  })
})
