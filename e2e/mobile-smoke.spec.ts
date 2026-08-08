import { expect, test } from '@playwright/test'

test('auth screen fits the mobile viewport', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByPlaceholder('admin@bomachgroup.com')).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1
  })

  expect(hasHorizontalOverflow).toBe(false)
})
