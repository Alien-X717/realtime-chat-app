import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettierConfig from 'eslint-config-prettier'
import eslintPluginImport from 'eslint-plugin-import'

const eslintConfig = defineConfig([
  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'next-env.d.ts',
    'node_modules/**',
    'coverage/**',
    'test-results/**',
    'playwright-report/**',
  ]),

  // Next.js base configs
  ...nextVitals,
  ...nextTs,

  // Base configuration for all TS/JS files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      import: eslintPluginImport,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
        },
      ],

      // Import organization
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': 'warn',
      'import/no-duplicates': 'error',

      // General code quality
      'no-unused-vars': 'off', // Use TS version
      'prefer-const': 'warn',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'no-console': 'warn', // Default, overridden below
    },
  },

  // Strict rules for app/ and lib/ (production code)
  {
    files: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Relaxed rules for infrastructure files
  {
    files: [
      'server.ts',
      'db/**/*.ts',
      '*.config.{js,ts,mjs}',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Most relaxed for test files
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'tests/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Disable Prettier conflicts (must be last)
  prettierConfig,
])

export default eslintConfig
