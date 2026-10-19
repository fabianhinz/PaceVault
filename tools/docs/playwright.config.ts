import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import {
  BANNER_ORIGIN,
  BANNER_PORT,
  README_ORIGIN,
  README_PORT,
  readmeLocale,
} from './banner/env.ts';

const webApp = resolve(import.meta.dirname, '../../apps/web');
const BROWSER_LOCALES = { de: 'de-DE', en: 'en-US' } as const;

export default defineConfig({
  testDir: './banner',
  testMatch: 'capture.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 180_000,

  use: {
    ...devices['Desktop Chrome'],
    baseURL: README_ORIGIN,
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

  webServer: [
    {
      command: `vp dev --port ${README_PORT} --strictPort`,
      cwd: webApp,
      url: README_ORIGIN,
      reuseExistingServer: false,
    },
    {
      command: `vp dev --port ${BANNER_PORT} --strictPort`,
      cwd: import.meta.dirname,
      url: `${BANNER_ORIGIN}/banner/page/index.html`,
      reuseExistingServer: false,
    },
  ],
});
