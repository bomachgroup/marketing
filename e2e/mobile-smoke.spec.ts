import { expect, test } from '@playwright/test'

test('unauthenticated Marketing deep links use Bomach OS login and preserve the return path', async ({ page }) => {
  await page.route('**/api/v1/auth/me*', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ detail: 'Authentication credentials were not provided.' }),
  }))
  await page.route('**/api/v1/auth/browser/refresh*', (route) => route.fulfill({
    status: 403,
    contentType: 'application/json',
    body: JSON.stringify({ detail: 'No active browser session.' }),
  }))

  await page.goto('/marketing/dashboard?cycle=2026')
  await expect(page).toHaveURL(/\/login\?/)
  await expect.poll(() => new URL(page.url()).searchParams.get('returnTo'))
    .toBe('/marketing/dashboard?cycle=2026')

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1
  })

  expect(hasHorizontalOverflow).toBe(false)
})
