/// <reference lib="dom" />
/**
 * Review capture helpers for `tools/workbench/backlog/<f>/review/capture.spec.ts`
 * (run with `vp run workbench:capture -- backlog/<f>/review`).
 *
 *   test('…', async ({ page }) => {
 *     await prepare(page, 'en');
 *     await seedSessions(page, [{ sport: 'running', date: … }]);   // or: await loadDemoData(page)
 *     await shootAll(page, 'dashboard', async (p) => {
 *       await p.goto('/');
 *     });
 *   });
 *
 * `shootAll` writes review/after/<d|p>-<en|de>-<name>.png next to the spec, or review/before/
 * with WB_SHOTS=before (first round, before any code change).
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { openMeteoFixture } from '../../../apps/web/e2e/helpers/openMeteo.ts';
import { seedOnboardingComplete, seedWithSessions } from '../../../apps/web/e2e/helpers/seed.ts';
import { expect, test, type Page } from '../../../apps/web/e2e/helpers/test.ts';

export { expect, test, type Locator, type Page } from '../../../apps/web/e2e/helpers/test.ts';

export type Locale = 'en' | 'de';
export type Device = 'd' | 'p';
export type Shot = { device: Device; locale: Locale };

const LOCALES: Locale[] = ['en', 'de'];
const VIEWPORTS: Record<Device, { width: number; height: number }> = {
  d: { width: 1280, height: 800 }, // the shell's desktop frame and the template's --w: 1280px
  p: { width: 390, height: 844 },
};
const ANCHOR = new Date('2026-09-16T12:00:00+02:00'); // as tools/docs/banner/capture.ts
const LOCALE_KEY = 'wb-locale'; // sessionStorage override, so shootAll can switch per shot

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const messages = (locale: Locale) =>
  z
    .record(z.string(), z.unknown())
    .parse(
      JSON.parse(
        readFileSync(resolve(repoRoot, 'packages/i18n/messages', `${locale}.json`), 'utf8'),
      ),
    );
const t = (locale: Locale, key: string) => {
  const value = messages(locale)[key];
  if (typeof value !== 'string') throw new Error(`message "${key}" is not a plain string`);
  return value;
};

const pageLocale = new WeakMap<Page, Locale>();
const currentLocale = (page: Page) => pageLocale.get(page) ?? 'en';

/** Fixed clock, app locale, Open-Meteo answered from the e2e fixture. Call once, before seeding. */
export const prepare = async (page: Page, locale: Locale) => {
  pageLocale.set(page, locale);
  await page.clock.setFixedTime(ANCHOR);
  await page.addInitScript(
    (args) => {
      const override = sessionStorage.getItem(args.key);
      localStorage.setItem('PARAGLIDE_LOCALE', override ?? args.locale);
    },
    { key: LOCALE_KEY, locale },
  );
  await page.route('**/*open-meteo.com/**', (route) =>
    route.fulfill({ json: openMeteoFixture(new URL(route.request().url())) }),
  );
};

type SeedSession = Parameters<typeof seedWithSessions>[1][number];

/** Onboarding done plus summary-only sessions (no records, no GPS); [] gives an empty library. */
export const seedSessions = async (page: Page, sessions: SeedSession[]) => {
  if (sessions.length === 0) {
    await seedOnboardingComplete(page);
    return [];
  }
  return seedWithSessions(page, sessions);
};

/** The onboarding demo-data button: a year of sessions with records and GPS. */
export const loadDemoData = async (page: Page) => {
  const locale = currentLocale(page);
  await page.goto('/');
  await page
    .getByRole('button', { name: t(locale, 'ui_onboarding_demo_title'), exact: true })
    .click({ timeout: 30_000 });
  const summary = page.getByTestId('import-summary');
  await expect(summary).toBeVisible({ timeout: 60_000 });
  await summary.getByRole('button', { name: t(locale, 'ui_import_close'), exact: true }).click();
  await expect(summary).toBeHidden();
  await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30_000 });
};

/**
 * `networkidle` is only a head start, bounded as in tools/docs/banner/capture.ts: in dev,
 * StrictMode terminates the first GPS worker while its module imports are in flight, and
 * Playwright keeps those requests pending forever (seen on full loads of /settings, /labs).
 */
const NETWORK_IDLE_MS = 10_000;

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => undefined);
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
    for (let frame = 0; frame < 3; frame++) {
      await new Promise((done) => requestAnimationFrame(done));
    }
  });
};

/**
 * Runs `scene` for desktop (d, 1280×800) and phone (p, 390×844) in en and de, and writes
 * review/<after|before>/<d|p>-<en|de>-<name>.png next to the calling spec. Each shot starts
 * with a reload in that locale and viewport; `scene` navigates and sets the screen up.
 */
export const shootAll = async (
  page: Page,
  name: string,
  scene: (page: Page, shot: Shot) => Promise<void>,
) => {
  let round = 'after';
  if (process.env.WB_SHOTS === 'before') round = 'before';
  const outDir = resolve(dirname(test.info().file), round);
  mkdirSync(outDir, { recursive: true });
  for (const locale of LOCALES) {
    for (const device of ['d', 'p'] as const) {
      await page.setViewportSize(VIEWPORTS[device]);
      await page.evaluate((args) => sessionStorage.setItem(args.key, args.locale), {
        key: LOCALE_KEY,
        locale,
      });
      pageLocale.set(page, locale);
      await page.reload();
      await scene(page, { device, locale });
      await settle(page);
      await page.mouse.move(2, VIEWPORTS[device].height - 2);
      await page.screenshot({ path: resolve(outDir, `${device}-${locale}-${name}.png`) });
    }
  }
};
