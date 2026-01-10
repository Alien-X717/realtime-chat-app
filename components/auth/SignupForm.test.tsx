import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { AuthContext } from '@/contexts/AuthContext'
import type { AuthContextType } from '@/types/auth'

import { SignupForm } from './SignupForm'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const mockSignup = vi.fn()
const mockAuthContext: AuthContextType = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  login: vi.fn(),
  signup: mockSignup,
  logout: vi.fn(),
  refreshUser: vi.fn(),
}

const renderWithAuth = (context: Partial<AuthContextType> = {}) => {
  return render(
    <AuthContext.Provider value={{ ...mockAuthContext, ...context }}>
      <SignupForm />
    </AuthContext.Provider>
  )
}

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders signup form with all fields', () => {
    renderWithAuth()

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/display name \(optional\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const submitButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('validates username format', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const usernameInput = screen.getByLabelText(/username/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    // Test short username
    await user.type(usernameInput, 'ab')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/username must be at least 3 characters/i)
      ).toBeInTheDocument()
    })

    await user.clear(usernameInput)

    // Test invalid characters
    await user.type(usernameInput, 'user@name')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/username can only contain letters, numbers, and underscores/i)
      ).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const emailInput = screen.getByLabelText(/^email/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('validates password strength - missing uppercase', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(passwordInput, 'password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/password must contain at least one uppercase letter/i)
      ).toBeInTheDocument()
    })
  })

  it('validates password strength - missing lowercase', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(passwordInput, 'PASSWORD123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/password must contain at least one lowercase letter/i)
      ).toBeInTheDocument()
    })
  })

  it('validates password strength - missing number', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(passwordInput, 'Password!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/password must contain at least one number/i)
      ).toBeInTheDocument()
    })
  })

  it('validates password strength - missing special character', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(passwordInput, 'Password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/password must contain at least one special character/i)
      ).toBeInTheDocument()
    })
  })

  it('validates password strength - too short', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(passwordInput, 'Pass1!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument()
    })
  })

  it('calls signup function with correct data on valid submission', async () => {
    const user = userEvent.setup()
    mockSignup.mockResolvedValueOnce(undefined)
    renderWithAuth()

    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/^email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const displayNameInput = screen.getByLabelText(/display name \(optional\)/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(displayNameInput, 'Test User')
    await user.type(passwordInput, 'Password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      })
    })
  })

  it('uses username as displayName if displayName is empty', async () => {
    const user = userEvent.setup()
    mockSignup.mockResolvedValueOnce(undefined)
    renderWithAuth()

    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/^email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'testuser',
      })
    })
  })

  it('displays error message when signup fails', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Username already exists'
    mockSignup.mockRejectedValueOnce(new Error(errorMessage))
    renderWithAuth()

    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/^email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(usernameInput, 'existinguser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('disables form while submitting', async () => {
    const user = userEvent.setup()
    mockSignup.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )
    renderWithAuth()

    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/^email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    await user.type(usernameInput, 'testuser')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(usernameInput).toBeDisabled()
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(screen.getByText(/creating account.../i)).toBeInTheDocument()
  })

  it('has link to login page', () => {
    renderWithAuth()

    const loginLink = screen.getByRole('link', { name: /login/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })
})
