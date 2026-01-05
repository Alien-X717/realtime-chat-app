import { test, expect } from '@playwright/test'

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/')

  // Check that the page loaded
  await expect(page).toHaveTitle(/Create Next App/)
})

test('has Next.js link', async ({ page }) => {
  await page.goto('/')

  // Expect a link to Next.js docs
  const learnMoreLink = page.getByRole('link', { name: /Learn/i })
  await expect(learnMoreLink).toBeVisible()
})
