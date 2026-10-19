import { defineConfig, devices } from '@playwright/test';

let retries = 0;
if (process.env.CI) {
  retries = 2;
}

let workers: number | undefined = undefined;
if (process.env.CI) {
  workers = 1;
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries,
  workers,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/mobile/**',
    },
    {
      name: 'mobile',
      testDir: './e2e/mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: 'vp dev --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
  },
});
