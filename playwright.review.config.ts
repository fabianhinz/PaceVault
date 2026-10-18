import { defineConfig, devices } from '@playwright/test';

/**
 * Review screenshots: `vp run workbench:capture [-- workbench/<f>/review]` runs every
 * `workbench/<f>/review/capture.spec.ts`. Kept apart from the e2e suite (`testDir: './e2e'`).
 */
const PORT = 5176;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './workbench',
  testMatch: '**/review/capture.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 180_000,

  use: {
    ...devices['Desktop Chrome'],
    baseURL: ORIGIN,
    timezoneId: 'Europe/Berlin',
    contextOptions: { reducedMotion: 'reduce' },
    launchOptions: {
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },

  webServer: {
    command: `vp dev --port ${PORT} --strictPort`,
    url: ORIGIN,
    reuseExistingServer: false,
  },
});
