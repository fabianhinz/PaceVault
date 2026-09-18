import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { seedIntervalsConnected, RUNNING_FIT, CYCLING_FIT } from './helpers/seed';

const LISTING = [
  {
    id: 'i100',
    name: 'Karlsruhe Laufen',
    type: 'Run',
    source: 'GARMIN_CONNECT',
    file_type: 'fit',
    start_date_local: '2026-08-21T18:27:19',
  },
  {
    id: 'i200',
    name: 'Karlsruhe Rennradfahren',
    type: 'Ride',
    source: 'GARMIN_CONNECT',
    file_type: 'fit',
    start_date_local: '2026-08-20T18:24:31',
  },
  {
    id: 'i300',
    name: null,
    type: null,
    source: 'STRAVA',
    file_type: null,
    _note: 'STRAVA activities are not available via the API',
  },
  {
    id: 'i400',
    name: 'Morning Swim',
    type: 'Swim',
    source: 'GARMIN_CONNECT',
    file_type: 'fit',
    start_date_local: '2026-08-19T07:00:00',
  },
];

const FILES: Record<string, string> = { i100: RUNNING_FIT, i200: CYCLING_FIT };

const mockIntervals = async (page: Page, options?: { status?: number }) => {
  await page.route('**/intervals.icu/api/v1/**', async (route) => {
    const url = route.request().url();

    if (options?.status !== undefined) {
      await route.fulfill({ status: options.status, json: { error: 'nope' } });
      return;
    }

    if (url.includes('/athlete/0/activities')) {
      await route.fulfill({ status: 200, json: LISTING });
      return;
    }

    if (url.includes('/athlete/0')) {
      await route.fulfill({
        status: 200,
        json: { firstname: 'Fabian', icu_athlete_id: 'i365697' },
      });
      return;
    }

    const match = /\/activity\/(\w+)\//.exec(url);
    const file = FILES[match?.[1] ?? ''];
    if (file === undefined) {
      await route.fulfill({ status: 422, json: { error: 'Cannot read Strava activities' } });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/octet-stream',
      body: readFileSync(file),
    });
  });
};

test.describe('intervals.icu import', () => {
  test('onboarding: thresholds → connect → preview → import', async ({ page }) => {
    await mockIntervals(page);
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

    await page.getByRole('button', { name: /^connect$/i }).click();

    await expect(page.getByText(/connected as fabian/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/we found 4 activities/i)).toBeVisible();
    await expect(page.getByText(/not supported/i)).toBeVisible();
    await expect(page.getByText(/unavailable/i)).toBeVisible();

    await page.getByRole('button', { name: /import 2/i }).click();

    await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#thresh-restHr')).not.toBeVisible();
  });

  test('settings: shows the connection, syncs and disconnects', async ({ page }) => {
    await mockIntervals(page);
    await seedIntervalsConnected(page, { lastSyncedAt: Date.parse('2026-09-01T09:12:00Z') });

    await page.goto('/settings?tab=data');

    await expect(page.getByText('Fabian')).toBeVisible();
    await expect(page.getByText(/sync now/i)).toBeVisible();

    await page.getByText(/sync now/i).click();
    await expect(page.getByTestId('upload-done')).toContainText(/sessions uploaded/i, {
      timeout: 30000,
    });

    await page
      .getByText(/^disconnect$/i)
      .first()
      .click();
    await page.getByRole('button', { name: /^disconnect$/i }).click();

    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('a rejected key shows an inline error and does not connect', async ({ page }) => {
    await mockIntervals(page, { status: 401 });
    await page.goto('/');

    await page
      .getByText(/intervals\.icu/i)
      .first()
      .click();
    await page.fill('#thresh-restHr', '50');
    await page.fill('#thresh-maxHr', '185');

    const keyInput = page.locator('input[type="password"]');
    await expect(keyInput).toBeVisible({ timeout: 5000 });
    await keyInput.fill('wrong-key');
    await page.getByRole('button', { name: /^connect$/i }).click();

    await expect(page.getByText(/wasn't accepted/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/connected as/i)).not.toBeVisible();
  });
});
