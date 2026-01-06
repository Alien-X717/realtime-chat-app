import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

/**
 * Custom render function that wraps components with necessary providers
 * Add providers here as the app grows (AuthProvider, ThemeProvider, etc.)
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'

// Override render with custom render
export { customRender as render }
