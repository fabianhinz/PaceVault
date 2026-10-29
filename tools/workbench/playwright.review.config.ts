import { defineConfig, devices } from '@playwright/test';

const PORT = 5176;
const ORIGIN = `http://localhost:${PORT}`;
const BOARD_PORT = 4321;

const mapLaunchOptions = () => {
  if (process.platform === 'darwin' && !process.env.CI) {
    return {
      channel: 'chromium',
      args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
    };
  }
  return {
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  };
};

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
    launchOptions: mapLaunchOptions(),
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
