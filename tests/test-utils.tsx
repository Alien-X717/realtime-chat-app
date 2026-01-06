import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'

/**
 * Custom render function that wraps components with necessary providers
 * Add providers here as the app grows (AuthProvider, ThemeProvider, etc.)
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'

// Override render with custom render
export { customRender as render }
