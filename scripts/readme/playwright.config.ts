import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { readmeLocale } from './env.ts';

const repoRoot = resolve(import.meta.dirname, '../..');
const BROWSER_LOCALES = { de: 'de-DE', en: 'en-US' } as const;

export default defineConfig({
  testDir: '.',
  testMatch: '*.readme.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 180_000,

  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173',
    locale: BROWSER_LOCALES[readmeLocale()],
    timezoneId: 'Europe/Berlin',
    contextOptions: { reducedMotion: 'reduce' },
    deviceScaleFactor: 2,
    // The full Chromium build in new-headless mode renders on the real GPU. The default
    // headless shell (and SwiftShader) composites `backdrop-filter` only partly, so map
    // streets showed through the glass cards.
    channel: 'chromium',
  },

  projects: [{ name: 'readme' }],

  webServer: {
    command: 'vp dev',
    cwd: repoRoot,
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
