import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import {
  BANNER_ORIGIN,
  BANNER_PORT,
  WEB_APP_ORIGIN,
  WEB_APP_PORT,
  bannerLocale,
} from './banner/env.ts';
import type { BannerLocale } from './banner/locales.ts';

const CAPTURE_TIMEOUT_MS = 180_000;
const WEB_APP_DIR = resolve(import.meta.dirname, '../../apps/web');
const BROWSER_LOCALE_BY_BANNER_LOCALE = { de: 'de-DE', en: 'en-US' } satisfies Record<
  BannerLocale,
  string
>;

export default defineConfig({
  testDir: './banner',
  testMatch: 'capture.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: CAPTURE_TIMEOUT_MS,

  use: {
    ...devices['Desktop Chrome'],
    baseURL: WEB_APP_ORIGIN,
    locale: BROWSER_LOCALE_BY_BANNER_LOCALE[bannerLocale()],
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
      command: `vp dev --port ${WEB_APP_PORT} --strictPort`,
      cwd: WEB_APP_DIR,
      url: WEB_APP_ORIGIN,
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
