import path from 'path';
import { test, expect } from '@playwright/test';
import { seedOnboardingComplete, FIXTURES_DIR } from './helpers/seed';

const ROUTE_GPX = path.join(FIXTURES_DIR, 'route.gpx');

test.describe('Studio', () => {
  test('imports a GPX route, opens its detail page, edits and deletes it', async ({ page }) => {
    await seedOnboardingComplete(page);

    await page.getByRole('link', { name: /labs/i }).click();
    await page.waitForURL(/\/labs/);
    await page.getByRole('tab', { name: /studio/i }).click();

    // Import the GPX fixture through the hidden file input behind the CTA
    await page.locator('[data-testid="studio-gpx-input"]').setInputFiles(ROUTE_GPX);

    // Route card appears with name from the GPX <name> and its distance
    const routeCard = page.getByRole('button', { name: 'Alpine Loop' });
    await expect(routeCard).toBeVisible();
    await expect(routeCard).toContainText('4.4 km');

    // Click → navigates to the studio detail page with stats and profile chart
    await routeCard.click();
    await page.waitForURL(/\/studio\/.+/);
    await expect(page.getByRole('heading', { name: 'Alpine Loop' })).toBeVisible();
    await expect(page.getByText('Distance', { exact: true })).toBeVisible();
    await expect(page.getByText('Elevation', { exact: true })).toBeVisible();
    await expect(page.getByText('Grade', { exact: true })).toBeVisible();

    // The full stat inventory (incl. import metadata) sits behind the toggle
    await page.getByRole('button', { name: /\(\d+\)/ }).click();
    await expect(page.getByText(/ascent/i)).toBeVisible();
    await expect(page.getByText(/route\.gpx/)).toBeVisible();

    // Rename via the actions menu edit dialog
    await page.getByRole('button', { name: /route actions/i }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    const nameInput = page.getByPlaceholder(/route name/i);
    await expect(nameInput).toHaveValue('Alpine Loop');
    await nameInput.fill('Dolomites Loop');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByRole('heading', { name: 'Dolomites Loop' })).toBeVisible();

    // Survives a reload (persistence)
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dolomites Loop' })).toBeVisible();

    // Delete via the actions menu + confirmation dialog
    await page.getByRole('button', { name: /route actions/i }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await expect(page.getByText(/sessions are untouched/i)).toBeVisible();
    await page.getByRole('button', { name: /^delete$/i }).click();

    // Returns to the studio tab; route is gone and the import CTA remains
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

    // Add a split point — the dialog defaults a km value, so Save is enough.
    await page.getByRole('button', { name: /add split point/i }).click();
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Split point', { exact: true })).toBeVisible();

    // Add a waypoint — label is required.
    await page.getByRole('button', { name: /add waypoint/i }).click();
    await page.getByPlaceholder(/water stop/i).fill('Fountain');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Fountain', { exact: true })).toBeVisible();

    // Survives a reload (persistence). Wait for the async IDB write to flush
    // before reloading, otherwise the just-added marker can be lost.
    await expect
      .poll(async () =>
        page.evaluate(async () => {
          const req = indexedDB.open('endurance-tracker');
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
        }),
      )
      .toBe(true);
    await page.reload();
    await page.getByRole('tab', { name: /tools/i }).click();
    await expect(page.getByText('Fountain', { exact: true })).toBeVisible();

    // Clicking the row opens the edit dialog — change the label.
    await page.getByRole('button', { name: /fountain/i }).click();
    const labelInput = page.getByPlaceholder(/water stop/i);
    await expect(labelInput).toHaveValue('Fountain');
    await labelInput.fill('Summit');
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Summit', { exact: true })).toBeVisible();
    await expect(page.getByText('Fountain', { exact: true })).toHaveCount(0);

    // Delete both markers via the dialog's danger action.
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

    // A non-GPX payload fails to parse and surfaces an error toast
    await page.locator('[data-testid="studio-gpx-input"]').setInputFiles({
      name: 'broken.gpx',
      mimeType: 'application/gpx+xml',
      buffer: Buffer.from('not a gpx file'),
    });
    await expect(page.getByText(/failed to import/i)).toBeVisible();
    await expect(page.getByText(/plan your next adventure/i)).toBeVisible();
  });
});
