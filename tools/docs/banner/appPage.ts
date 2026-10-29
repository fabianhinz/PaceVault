/// <reference lib="dom" />
import { expect, type Page } from '@playwright/test';
import { openMeteoFixture } from '@pacevault/web/e2e/openMeteo';
import { bannerLocale } from './env.ts';
import { escapeRegExp, messageText } from './messages.ts';
import { findPositionDot } from './png.ts';
import { waitForStill } from './stillness.ts';

const LOCALE = bannerLocale();

const FROZEN_CLOCK_TIME = new Date('2026-09-16T12:00:00+02:00');
export const UI_READY_TIMEOUT_MS = 15_000;
const DEMO_IMPORT_TIMEOUT_MS = 60_000;
const DOCK_READY_TIMEOUT_MS = 30_000;
const SESSION_SCROLL_PAUSE_MS = 100;
const SESSION_SCROLL_MAX_STEPS = 200;
const PARKED_MOUSE_INSET = 2;
const HOVER_SETTLE_FRAME_COUNT = 4;

type LayoutStoreModule = typeof import('@pacevault/web/store/layout');

export const prepareContext = async (page: Page) => {
  await page.clock.setFixedTime(FROZEN_CLOCK_TIME);
  await page.addInitScript((locale) => {
    localStorage.setItem('PARAGLIDE_LOCALE', locale);
  }, LOCALE);
  await page
    .context()
    .route('**/*open-meteo.com/**', (route) =>
      route.fulfill({ json: openMeteoFixture(new URL(route.request().url())) }),
    );
};

export const loadDemoData = async (page: Page) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: messageText('ui_onboarding_demo_title'), exact: true })
    .click({ timeout: UI_READY_TIMEOUT_MS });
  const summary = page.getByTestId('import-summary');
  await expect(summary).toBeVisible({ timeout: DEMO_IMPORT_TIMEOUT_MS });
  await summary
    .getByRole('button', { name: new RegExp(escapeRegExp(messageText('ui_btn_close')), 'i') })
    .click();
  await expect(page.locator('[data-layout="dock"]')).toBeVisible({
    timeout: DOCK_READY_TIMEOUT_MS,
  });
};

export const hideOverlays = async (page: Page) => {
  const bannerText = messageText('ui_demo_banner_text');
  await page.getByText(bannerText).waitFor({ state: 'attached' });
  await page.evaluate((text) => {
    for (const overlay of document.querySelectorAll<HTMLElement>(
      '.tsqd-open-btn-container, button.tsqd-open-btn, .tsqd-parent-container',
    )) {
      overlay.style.display = 'none';
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent?.trim() !== text) continue;
      const banner = node.parentElement?.closest<HTMLElement>('.mb-4');
      if (banner) banner.style.display = 'none';
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, bannerText);
  await expect(page.getByText(bannerText)).toBeHidden();
  await expect(page.locator('button.tsqd-open-btn')).toBeHidden();
};

export const parkMouse = async (page: Page) => {
  const viewport = page.viewportSize();
  if (!viewport) return;
  await page.mouse.move(PARKED_MOUSE_INSET, viewport.height - PARKED_MOUSE_INSET);
};

export const openSession = async (name: string, page: Page) => {
  await page.goto('/sessions');
  const items = page.getByTestId('session-item');
  const item = items.filter({ hasText: name }).first();
  await expect(items.first()).toBeVisible({ timeout: UI_READY_TIMEOUT_MS });
  for (let i = 0; i < SESSION_SCROLL_MAX_STEPS && (await item.count()) === 0; i++) {
    await items.last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(SESSION_SCROLL_PAUSE_MS);
  }
  await item.click();
  await page.waitForURL(/\/sessions\/.+/);
  await expect(page.getByTestId('color-by-pill')).toBeVisible({ timeout: UI_READY_TIMEOUT_MS });
};

export const isOverTrack = (point: { x: number; y: number }, page: Page) =>
  page.evaluate(
    async (probe) => {
      for (let frame = 0; frame < probe.settleFrameCount; frame++) {
        await new Promise((done) => requestAnimationFrame(done));
      }
      const element = document.elementFromPoint(probe.x, probe.y);
      return element !== null && getComputedStyle(element).cursor === 'pointer';
    },
    { x: point.x, y: point.y, settleFrameCount: HOVER_SETTLE_FRAME_COUNT },
  );

export const nextTrackPoint = async (
  { points, from }: { points: { x: number; y: number }[]; from: number },
  page: Page,
) => {
  for (let i = from; i < points.length; i++) {
    const point = points[i];
    if (!point) break;
    await page.mouse.move(point.x, point.y);
    if (await isOverTrack(point, page)) return i;
  }
  return -1;
};

export const popover = (page: Page) =>
  page.locator('[data-radix-popper-content-wrapper]').getByRole('dialog');

export const locate = async (page: Page) => {
  await page.getByRole('button', { name: messageText('ui_dock_locate_me') }).click();
  await waitForStill(page);
  return findPositionDot(page);
};

export const sheet = (page: Page) => page.locator('[data-sheet-position]');

export const sheetHandle = (page: Page) => sheet(page).locator('[data-sheet-handle]');

export const sheetScroller = (page: Page) => page.locator('[data-layout="main"]').locator('..');

export const pinSheetPosition = (position: number, page: Page) =>
  page.evaluate(
    async (input) => {
      const layout: LayoutStoreModule = await import(input.module);
      layout.useLayoutStore.getState().setMobileSheetPosition(input.position);
    },
    { module: '/src/store/layout.ts', position },
  );
