#!/bin/bash

# Frontend Authentication Implementation - Git Commands
# Run these commands to commit and push the changes

# Ensure you're on the correct branch
git checkout feat-frontend-auth

# Stage and commit: Authentication context and state management
git add types/ contexts/ hooks/ app/providers.tsx
git commit -m "$(cat <<'EOF'
feat: add authentication context and state management

- Create AuthContext with login, signup, logout, and user state
- Add useAuth hook for consuming auth context
- Define authentication types and interfaces
- Add Providers wrapper component for app-wide context
- Auto-fetch user on mount and handle token refresh
- Store access token in memory with proper state management

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Stage and commit: UI components
git add components/ui/
git commit -m "$(cat <<'EOF'
feat: add UI components for authentication forms

- Add Button component with variants (default, destructive, outline, etc.)
- Add Input component with proper styling and accessibility
- Add Label component for form labels
- Add Card components for layout containers
- All components use Tailwind CSS and class-variance-authority

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Stage and commit: Authentication forms
git add components/auth/LoginForm.tsx components/auth/SignupForm.tsx
git commit -m "$(cat <<'EOF'
feat: add login and signup forms with validation

- Create LoginForm with email/password validation
- Create SignupForm with comprehensive validation:
  - Username format and length validation
  - Email format validation
  - Password strength requirements (8+ chars, upper, lower, number, special)
- Add real-time error clearing on user input
- Implement loading states and error display
- Add proper ARIA attributes for accessibility

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Stage and commit: Authentication pages and protected routes
git add app/login/ app/signup/ components/auth/ProtectedRoute.tsx
git commit -m "$(cat <<'EOF'
feat: add authentication pages and protected routes

- Create /login page with redirect logic for authenticated users
- Create /signup page with redirect logic for authenticated users
- Add ProtectedRoute component for route protection
- Implement loading states while checking authentication
- Add automatic redirects based on auth status

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Stage and commit: API routes
git add app/api/ lib/db/users.ts
git commit -m "$(cat <<'EOF'
feat: add authentication API routes

- Implement POST /api/auth/signup with validation and password hashing
- Implement POST /api/auth/login with credential verification
- Implement POST /api/auth/logout to clear refresh token
- Implement GET /api/auth/me to fetch current user
- Add getUserByEmail, getUserByUsername, getUserById to users lib
- Set refresh token as httpOnly cookie
- Return access token in response body

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Stage and commit: Tests
git add contexts/AuthContext.test.tsx components/auth/*.test.tsx tests/test-utils.tsx
git commit -m "$(cat <<'EOF'
test: add comprehensive tests for authentication

- Add AuthContext tests for login, signup, logout flows
- Add LoginForm tests for validation, submission, and error handling
- Add SignupForm tests for all validation rules and user interactions
- Update test-utils to include AuthProvider wrapper
- Test loading states, error displays, and field clearing
- All tests use React Testing Library and Vitest

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Stage and commit: App layout update
git add app/layout.tsx
git commit -m "$(cat <<'EOF'
chore: update app layout with providers

- Wrap app with Providers component
- Update metadata for chat application
- Enable AuthContext throughout the app

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Stage and commit: Documentation
git add IMPLEMENTATION_SUMMARY.md GIT_COMMANDS.sh
git commit -m "$(cat <<'EOF'
docs: add implementation summary and git commands

- Document all implemented features and files
- Provide step-by-step git commands for commits
- Include PR template and test plan

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Run typecheck before pushing
echo "Running typecheck..."
yarn typecheck

# Run tests before pushing
echo "Running tests..."
yarn test

# Push branch to remote
echo "Pushing to remote..."
git push -u origin feat-frontend-auth

echo "Done! Create a PR at: https://github.com/YOUR_USERNAME/realtime-chat-app/compare/main...feat-frontend-auth"
