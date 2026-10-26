/// <reference lib="dom" />
import type { Page } from '@playwright/test';

const STILL_POLL_MS = 500;
const STILL_MAX_POLLS = 60;
const NETWORK_IDLE_MS = 10_000;
const SETTLE_FRAME_COUNT = 3;

// Always compares whole-window shots: a `clip` screenshot in headless Chromium re-renders
// the page for the capture and drops `backdrop-filter`, so glass cards show crisp map
// streets through them — something the app never paints.
// `networkidle` is only a head start: in dev, StrictMode terminates the first GPS worker
// while its module imports are in flight, and Playwright keeps those requests pending
// forever. The frame comparison below is the real check.
export const waitForStill = async (page: Page) => {
  await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => undefined);
  await page.evaluate(async (settleFrameCount) => {
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
    for (let frame = 0; frame < settleFrameCount; frame++) {
      await new Promise((done) => requestAnimationFrame(done));
    }
  }, SETTLE_FRAME_COUNT);
  let previous: Buffer | null = null;
  for (let i = 0; i < STILL_MAX_POLLS; i++) {
    await page.waitForTimeout(STILL_POLL_MS);
    const frame = await page.screenshot({ scale: 'css' });
    if (previous && frame.equals(previous)) return;
    previous = frame;
  }
  throw new Error('the page never stopped changing');
};
