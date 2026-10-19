import { defineConfig, devices } from '@playwright/test';

/**
 * Review screenshots: `vp run workbench:capture [-- backlog/<f>/review]` runs every
 * `tools/workbench/backlog/<f>/review/capture.spec.ts`: PWA specs against the web app's dev
 * server (baseURL, port 5176), board specs against the workbench board (port 4321, a board the
 * owner already runs is reused). Kept apart from the e2e suite (`apps/web/e2e`).
 */
const PORT = 5176;
const ORIGIN = `http://localhost:${PORT}`;
const BOARD_PORT = 4321;

export default defineConfig({
  testDir: './backlog',
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

  webServer: [
    {
      command: `vp dev --port ${PORT} --strictPort`,
      cwd: '../../apps/web',
      url: ORIGIN,
      reuseExistingServer: false,
    },
    {
      command: `vp exec astro dev --root site --port ${BOARD_PORT}`,
      url: `http://localhost:${BOARD_PORT}`,
      reuseExistingServer: true,
    },
  ],
});
