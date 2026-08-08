import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5178',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run dev -- --host 127.0.0.1 --port 5178',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
