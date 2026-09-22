import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { RUNNING_FIT, CYCLING_FIT, seedIntervalsConnected } from './helpers/seed';

const LISTING = [
  { id: 'i100', name: 'Karlsruhe Laufen', type: 'Run', source: 'GARMIN_CONNECT', file_type: 'fit' },
  { id: 'i200', name: 'Z2', type: 'Ride', source: 'GARMIN_CONNECT', file_type: 'fit' },
  { id: 'i300', name: null, type: null, source: 'STRAVA', file_type: null },
  { id: 'i400', name: 'Swim', type: 'Swim', source: 'GARMIN_CONNECT', file_type: 'fit' },
];

const FILES: Record<string, string> = { i100: RUNNING_FIT, i200: CYCLING_FIT };

const mockApi = async (page: import('@playwright/test').Page) => {
  await page.route('**/intervals.icu/api/v1/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/activities')) {
      await route.fulfill({ status: 200, json: LISTING });
      return;
    }
    if (url.includes('/athlete/0')) {
      await route.fulfill({ status: 200, json: { firstname: 'Fabian' } });
      return;
    }

    const file = FILES[/\/activity\/(\w+)\//.exec(url)?.[1] ?? ''];
    if (file === undefined) {
      await route.fulfill({ status: 422, json: { error: 'no file' } });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/octet-stream',
      body: readFileSync(file),
    });
  });
};

test('intervals.icu onboarding: thresholds + key, then import', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await page
    .getByText(/intervals\.icu/i)
    .first()
    .click();

  await page.fill('#thresh-restHr', '50');
  await page.fill('#thresh-maxHr', '185');

  const keyInput = page.locator('input[type="password"]');
  await expect(keyInput).toBeVisible({ timeout: 5000 });
  await keyInput.fill('e2e-test-key');
  await page.getByRole('button', { name: /import activities/i }).click();

  await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#thresh-restHr')).not.toBeVisible();
});

test('a connected account lists its activities on load, without reconnecting', async ({ page }) => {
  await mockApi(page);
  await seedIntervalsConnected(page, { importedActivityIds: ['i100'] });

  await page.goto('/settings?tab=data');

  await expect(page.locator('input[type="password"]')).toHaveValue('e2e-test-key');
  await expect(page.getByRole('button', { name: /import activities/i })).toBeEnabled({
    timeout: 10000,
  });
});
