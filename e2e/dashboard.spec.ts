import { test, expect, type Page } from './helpers/test';
import { seedWithSessions } from './helpers/seed';

const DAY_MS = 24 * 60 * 60 * 1000;

const dockButton = (page: Page, name: RegExp) =>
  page.locator('[data-layout="dock"]').getByRole('button', { name }).last();

const openPanelRadio = (page: Page, name: RegExp) =>
  page.locator('[data-layout="dock"] .pointer-events-auto').getByRole('radio', { name });

test.describe('TrainingSummaryCard', () => {
  test.describe('aggregation and labels', () => {
    test.beforeEach(async ({ page }) => {
      const now = Date.now();
      await seedWithSessions(page, [
        { sport: 'running', date: now - 1 * DAY_MS },
        { sport: 'running', date: now - 2 * DAY_MS },
        { sport: 'running', date: now - 3 * DAY_MS },
      ]);
      await page.goto('/');
    });

    test('shows stat labels', async ({ page }) => {
      await expect(page.getByText('Total Distance')).toBeVisible();
      await expect(page.getByText('Total Duration')).toBeVisible();
    });

    test('shows correct aggregated values', async ({ page }) => {
      await expect(page.getByText('30.0 km')).toBeVisible();
      await expect(page.getByText('3h 0m')).toBeVisible();
    });

    test('hides elevation row when no session has elevation data', async ({ page }) => {
      await expect(page.getByText('Total Elevation')).toHaveCount(0);
    });
  });

  test.describe('elevation row', () => {
    test.beforeEach(async ({ page }) => {
      const now = Date.now();
      await seedWithSessions(page, [
        { sport: 'running', date: now - 1 * DAY_MS, elevationGain: 500 },
      ]);
      await page.goto('/');
    });

    test('shows elevation row when sessions have elevation', async ({ page }) => {
      await expect(page.getByText('Total Elevation')).toBeVisible();
      await expect(page.getByText('+500')).toBeVisible();
    });
  });

  test.describe('time range filter reactivity', () => {
    test.beforeEach(async ({ page }) => {
      const now = Date.now();
      await seedWithSessions(page, [
        { sport: 'running', date: now - 2 * DAY_MS },
        { sport: 'running', date: now - 60 * DAY_MS },
        { sport: 'running', date: now - 61 * DAY_MS },
      ]);
      await page.goto('/');
    });

    test('reacts to time range filter', async ({ page }) => {
      await expect(page.getByText('30.0 km')).toBeVisible();

      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^7d$/i).click();

      await expect(page.getByText('10.0 km')).toBeVisible();
    });
  });
});
