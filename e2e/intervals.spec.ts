import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  RUNNING_FIT,
  CYCLING_FIT,
  seedIntervalsConnected,
  seedOnboardingComplete,
} from './helpers/seed';

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
  await page.getByRole('button', { name: /import sessions/i }).click();

  await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#thresh-restHr')).not.toBeVisible();
});

test('a connected account syncs new activities on load, without a click', async ({ page }) => {
  await mockApi(page);
  await seedIntervalsConnected(page, { importedActivityIds: ['i100'] });

  await page.goto('/sessions');

  const items = page.locator('[data-testid="session-item"]');
  await expect(items).toHaveCount(1, { timeout: 30000 });
  await expect(items.first().locator('[data-testid="icon-badge"]')).toBeVisible();
});

test('opening a synced session clears its badge', async ({ page }) => {
  await mockApi(page);
  await seedIntervalsConnected(page, { importedActivityIds: ['i100'] });

  await page.goto('/sessions');

  const items = page.locator('[data-testid="session-item"]');
  await expect(items).toHaveCount(1, { timeout: 30000 });
  await expect(items.first().locator('[data-testid="icon-badge"]')).toBeVisible();
  await items.first().click();

  await expect(page).toHaveURL(/\/sessions\/[\w-]+/);
  await expect(items).toHaveCount(0);
  await page.goBack();

  await expect(items).toHaveCount(1);
  await expect(items.first().locator('[data-testid="icon-badge"]')).toHaveCount(0);
});

test('a background sync only lists the window after the newest intervals.icu session', async ({
  page,
}) => {
  await mockApi(page);
  const listings: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/athlete/0/activities')) listings.push(request.url());
  });
  await seedIntervalsConnected(page, {
    importedActivityIds: ['i100', 'i200'],
    intervalsSessionDates: [new Date(2026, 8, 20, 10).getTime()],
  });

  await expect.poll(() => listings.length, { timeout: 30000 }).toBeGreaterThan(0);
  expect(new URL(listings.at(-1) ?? '').searchParams.get('oldest')).toBe('2026-09-06');
});

const trackListings = (page: import('@playwright/test').Page): string[] => {
  const listings: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/athlete/0/activities')) listings.push(request.url());
  });
  return listings;
};

const switchTabAwayAndBack = async (page: import('@playwright/test').Page) => {
  await page.evaluate(() => {
    const setVisibility = (state: DocumentVisibilityState) => {
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
      window.dispatchEvent(new Event('visibilitychange'));
    };
    setVisibility('hidden');
    setVisibility('visible');
  });
};

test('switching back to the tab syncs again right away', async ({ page }) => {
  await mockApi(page);
  const listings = trackListings(page);
  await seedIntervalsConnected(page, { importedActivityIds: ['i100', 'i200'] });
  await expect.poll(() => listings.length, { timeout: 30000 }).toBe(1);

  await switchTabAwayAndBack(page);

  await expect.poll(() => listings.length, { timeout: 10000 }).toBe(2);
});

test('an open tab syncs again every 15 minutes', async ({ page }) => {
  await page.clock.install();
  await mockApi(page);
  const listings = trackListings(page);
  await seedIntervalsConnected(page, { importedActivityIds: ['i100', 'i200'] });
  await expect.poll(() => listings.length, { timeout: 30000 }).toBe(1);

  await page.clock.fastForward('14:00');
  expect(listings).toHaveLength(1);

  await page.clock.fastForward('01:05');
  await expect.poll(() => listings.length, { timeout: 10000 }).toBe(2);
});

test('settings shows the integration status and sessions by source', async ({ page }) => {
  await mockApi(page);
  await seedIntervalsConnected(page, {
    importedActivityIds: ['i100', 'i200'],
    intervalsSessionDates: [Date.now() - 86_400_000, Date.now() - 2 * 86_400_000],
  });

  await page.goto('/settings?tab=data');

  await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible();
  await expect(page.getByText('Connected', { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('heading', { name: 'FIT files' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your data' })).toBeVisible();
  await expect(page.getByText('Heatmap', { exact: true })).toBeVisible();

  const intervalsRow = page
    .getByText('intervals.icu', { exact: true })
    .last()
    .locator('..')
    .locator('..');
  await expect(intervalsRow).toContainText('2');
});

test('a connected account with nothing pending imports nothing', async ({ page }) => {
  await mockApi(page);
  await seedIntervalsConnected(page, { importedActivityIds: ['i100', 'i200'] });

  await page.goto('/sessions');

  await expect(page.locator('[data-layout="dock"]')).toBeVisible();
  await expect(page.locator('[data-testid="session-item"]')).toHaveCount(0);
});

const trackVerifies = (page: import('@playwright/test').Page): string[] => {
  const verifies: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/athlete/0')) verifies.push(request.url());
  });
  return verifies;
};

test('a typed key is checked after a short pause and shows as valid', async ({ page }) => {
  await page.clock.install();
  await mockApi(page);
  await seedOnboardingComplete(page);
  await page.goto('/settings?tab=data');
  const verifies = trackVerifies(page);

  await page.locator('#intervals-api-key').fill('e2e-test-key');
  await page.clock.runFor(400);
  expect(verifies).toHaveLength(0);

  await page.clock.runFor(300);
  await expect(page.getByText('Key valid', { exact: true })).toBeVisible();
  expect(verifies).toHaveLength(1);
});

test('a pasted key is checked right away', async ({ page }) => {
  await page.clock.install();
  await mockApi(page);
  await seedOnboardingComplete(page);
  await page.goto('/settings?tab=data');
  const verifies = trackVerifies(page);

  const input = page.locator('#intervals-api-key');
  await input.dispatchEvent('paste');
  await input.fill('e2e-test-key');

  await expect(page.getByText('Key valid', { exact: true })).toBeVisible();
  expect(verifies).toHaveLength(1);
});

test('a rejected key shows in the status line and blocks the import', async ({ page }) => {
  await page.route('**/intervals.icu/api/v1/athlete/0', (route) =>
    route.fulfill({ status: 401, json: {} }),
  );
  await seedOnboardingComplete(page);
  await page.goto('/settings?tab=data');

  await page.locator('#intervals-api-key').fill('wrong-key');

  await expect(page.getByText('Key rejected', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /import sessions/i })).toBeDisabled();
});

test('importing a checked key does not verify it a second time', async ({ page }) => {
  await mockApi(page);
  await seedOnboardingComplete(page);
  await page.goto('/settings?tab=data');
  const verifies = trackVerifies(page);

  await page.locator('#intervals-api-key').fill('e2e-test-key');
  await expect(page.getByText('Key valid', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /import sessions/i }).click();

  await expect(page.getByText('Connected', { exact: true })).toBeVisible({ timeout: 30000 });
  expect(verifies).toHaveLength(1);
});
