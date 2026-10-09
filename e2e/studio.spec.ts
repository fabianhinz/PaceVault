import path from 'path';
import { test, expect } from './helpers/test';
import { seedOnboardingComplete, FIXTURES_DIR } from './helpers/seed';
import { DB_NAME } from '../src/lib/db.ts';

const ROUTE_GPX = path.join(FIXTURES_DIR, 'route.gpx');

test.describe('Studio', () => {
  test('imports a GPX route, opens its detail page, edits and deletes it', async ({ page }) => {
    await seedOnboardingComplete(page);

    await page.getByRole('link', { name: /labs/i }).click();
    await page.waitForURL(/\/labs/);
    await page.getByRole('tab', { name: /studio/i }).click();

    await page.locator('[data-testid="studio-gpx-input"]').setInputFiles(ROUTE_GPX);

    const routeCard = page.getByRole('button', { name: 'Alpine Loop' });
    await expect(routeCard).toBeVisible();
    await expect(routeCard).toContainText('4.4 km');

    await routeCard.click();
    await page.waitForURL(/\/studio\/.+/);
    await expect(page.getByRole('heading', { name: 'Alpine Loop' })).toBeVisible();
    await expect(page.getByText('Distance', { exact: true })).toBeVisible();
    await expect(page.getByText('Elevation', { exact: true })).toBeVisible();
    await expect(page.getByText('Grade', { exact: true })).toBeVisible();

    await expect(page.getByTestId('stat-rail').first()).toContainText('+');

    await page.getByRole('button', { name: /\(\d+\)/ }).click();
    await expect(page.getByText(/route\.gpx/)).toBeVisible();

    await page.getByRole('button', { name: /route actions/i }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    const nameInput = page.getByPlaceholder(/route name/i);
    await expect(nameInput).toHaveValue('Alpine Loop');
    await nameInput.fill('Dolomites Loop');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByRole('heading', { name: 'Dolomites Loop' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dolomites Loop' })).toBeVisible();

    await page.getByRole('button', { name: /route actions/i }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await expect(page.getByText(/sessions are untouched/i)).toBeVisible();
    await page.getByRole('button', { name: /^delete$/i }).click();

    await page.waitForURL(/\/labs\?tab=studio/);
    await expect(page.getByText('Dolomites Loop')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /import gpx route/i })).toBeVisible();
  });

  test('adds, edits and deletes markers in the Tools tab', async ({ page }) => {
    await seedOnboardingComplete(page);

    await page.goto('/labs?tab=studio');
    await page.locator('[data-testid="studio-gpx-input"]').setInputFiles(ROUTE_GPX);
    await page.getByRole('button', { name: 'Alpine Loop' }).click();
    await page.waitForURL(/\/studio\/.+/);

    await page.getByRole('tab', { name: /tools/i }).click();

    await page.getByRole('button', { name: /add split point/i }).click();
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Split point', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /add waypoint/i }).click();
    await page.getByPlaceholder(/water stop/i).fill('Fountain');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Fountain', { exact: true })).toBeVisible();

    await expect
      .poll(async () =>
        page.evaluate(async (dbName) => {
          const req = indexedDB.open(dbName);
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          const value = await new Promise<string | undefined>((resolve) => {
            const get = db.transaction('kv').objectStore('kv').get('store-studio');
            get.onsuccess = () => resolve(get.result as string | undefined);
            get.onerror = () => resolve(undefined);
          });
          db.close();
          return value?.includes('Fountain') ?? false;
        }, DB_NAME),
      )
      .toBe(true);
    await page.reload();
    await page.getByRole('tab', { name: /tools/i }).click();
    await expect(page.getByText('Fountain', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /fountain/i }).click();
    const labelInput = page.getByPlaceholder(/water stop/i);
    await expect(labelInput).toHaveValue('Fountain');
    await labelInput.fill('Summit');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Summit', { exact: true })).toBeVisible();
    await expect(page.getByText('Fountain', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: /summit/i }).click();
    await page.getByRole('button', { name: /^delete$/i }).click();
    await expect(page.getByText('Summit', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: /^split point/i }).click();
    await page.getByRole('button', { name: /^delete$/i }).click();
    await expect(page.getByText('Split point', { exact: true })).toHaveCount(0);
  });

  test('shows the empty-state nudge and rejects an invalid file with a toast', async ({ page }) => {
    await seedOnboardingComplete(page);

    await page.goto('/labs?tab=studio');
    await expect(page.getByText(/plan your next adventure/i)).toBeVisible();

    await page.locator('[data-testid="studio-gpx-input"]').setInputFiles({
      name: 'broken.gpx',
      mimeType: 'application/gpx+xml',
      buffer: Buffer.from('not a gpx file'),
    });
    await expect(page.getByTestId('gpx-import-failed')).toBeVisible();
    await expect(page.getByText(/plan your next adventure/i)).toBeVisible();
  });
});
