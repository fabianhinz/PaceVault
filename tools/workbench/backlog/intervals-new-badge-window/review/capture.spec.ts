import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { RUNNING_FIT } from '../../../../../apps/web/e2e/helpers/seed.ts';
import {
  expect,
  prepare,
  shootAll,
  test,
  type Locale,
  type Page,
} from '../../../shared/capture';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const t = (locale: Locale, key: string) => {
  const messages = z
    .record(z.string(), z.string())
    .parse(
      JSON.parse(
        readFileSync(resolve(repoRoot, 'packages/i18n/messages', `${locale}.json`), 'utf8'),
      ),
    );
  const value = messages[key];
  if (value === undefined) throw new Error(`message "${key}" is missing`);
  return value;
};
const startsWith = (text: string) =>
  new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

const LISTING = [
  { id: 'i100', name: 'Laufen', type: 'Run', source: 'GARMIN_CONNECT', file_type: 'fit' },
  { id: 'i200', name: 'Z2', type: 'Ride', source: 'GARMIN_CONNECT', file_type: 'fit' },
  { id: 'i300', name: 'Kurz', type: 'Ride', source: 'GARMIN_CONNECT', file_type: 'fit' },
];

// Every shot starts on a reload; a fresh store keeps the previous shot's connected key from
// starting a background sync, and the delete is queued ahead of the app's own open.
const resetStorageOnLoad = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.clear();
    indexedDB.deleteDatabase('endurance-tracker');
  });
};

// Held requests answer only when the test ends, so the overlay never reaches its summary.
const holdRequests = () => {
  let release = () => {};
  const held = new Promise<void>((done) => {
    release = done;
  });
  return { held, release: () => release() };
};

const mockIntervals = async ({
  page,
  held,
  listing,
}: {
  page: Page;
  held: Promise<void>;
  listing: 'held' | 'answered';
}) => {
  await page.route('**/intervals.icu/api/v1/**', async (route) => {
    const url = route.request().url();
    if (url.endsWith('/athlete/0')) {
      await route.fulfill({ status: 200, json: { firstname: 'Fabian' } });
      return;
    }
    if (url.includes('/activities') && listing === 'answered') {
      await route.fulfill({ status: 200, json: LISTING });
      return;
    }
    await held;
    await route
      .fulfill({ status: 200, contentType: 'application/octet-stream', body: readFileSync(RUNNING_FIT) })
      .catch(() => undefined);
  });
};

const onboardToIntervalsKey = async ({ page, locale }: { page: Page; locale: Locale }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: t(locale, 'ui_onboarding_get_started'), exact: true })
    .click();
  await page.getByRole('button', { name: /^intervals\.icu/ }).click();
  await page.getByRole('radio', { name: t(locale, 'ui_thresholds_male'), exact: true }).click();
  await page.getByLabel(startsWith(t(locale, 'ui_thresholds_resting_hr'))).fill('50');
  await page.getByLabel(startsWith(t(locale, 'ui_thresholds_max_hr'))).fill('185');
  const next = page.getByRole('button', { name: t(locale, 'ui_btn_continue'), exact: true });
  await next.click();
  await expect(page.getByLabel(startsWith(t(locale, 'ui_thresholds_ftp')))).toBeVisible();
  await next.click();
  const keyInput = page.locator('#intervals-api-key');
  await expect(keyInput).toBeVisible();
  await keyInput.fill('capture-key');
};

const importButton = (page: Page, locale: Locale) =>
  page.getByRole('button', { name: t(locale, 'ui_intervals_import_activities'), exact: true });

// Infinite animations (the spinning ring) stop on their first frame; finite ones still finish.
const freezeInfiniteAnimations = async (page: Page) => {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().iterations !== Infinity) continue;
      animation.pause();
      animation.currentTime = 0;
    }
  });
};

test('import overlay while preparing', async ({ page }) => {
  const requests = holdRequests();
  await resetStorageOnLoad(page);
  await prepare(page, 'en');
  await mockIntervals({ page, held: requests.held, listing: 'held' });
  await page.goto('/');
  await shootAll(page, 'overlay-preparing', async (p, shot) => {
    await onboardToIntervalsKey({ page: p, locale: shot.locale });
    await expect(
      p.getByText(t(shot.locale, 'ui_integration_status_key_valid'), { exact: true }),
    ).toBeVisible();
    await importButton(p, shot.locale).click();
    await expect(p.getByRole('status')).toBeVisible();
    await freezeInfiniteAnimations(p);
  });
  requests.release();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('import overlay while importing', async ({ page }) => {
  const requests = holdRequests();
  await resetStorageOnLoad(page);
  await prepare(page, 'en');
  await mockIntervals({ page, held: requests.held, listing: 'answered' });
  await page.goto('/');
  await shootAll(page, 'overlay-importing', async (p, shot) => {
    await onboardToIntervalsKey({ page: p, locale: shot.locale });
    await importButton(p, shot.locale).click();
    await expect(p.getByRole('status')).toBeVisible();
    await expect(p.getByRole('status').getByText(/^0 \/ 3$/)).toBeVisible();
    await freezeInfiniteAnimations(p);
  });
  requests.release();
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});
