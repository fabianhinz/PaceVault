import { test, expect } from './helpers/test';
import { closeImportSummary } from './helpers/upload';
import { closeFilterList, filterList, openFilterList } from './helpers/filters';

const DETECTION_TIMEOUT_MS = 90_000;

test.describe('Segments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try demo data' }).click({ timeout: 15_000 });
    await closeImportSummary(page);
    await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30_000 });
  });

  test('segment item → segment page → pass → session', async ({ page }) => {
    test.setTimeout(180_000);
    await page.getByRole('tab', { name: 'Segments' }).click();
    await expect(page).toHaveURL(/\?tab=segments/);
    const items = page.getByTestId('segment-item');
    await expect(items.first()).toBeVisible({ timeout: DETECTION_TIMEOUT_MS });

    await items.first().click();
    await expect(page).toHaveURL(/\/segments\//);
    await expect(page.getByTestId('pass-times-row')).toContainText('Pass times');
    await expect(page.getByTestId('segment-explorer')).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('pass-list').getByRole('link', { name: 'Open session' }).first().click();
    await expect(page).toHaveURL(/\/sessions\/[^?]+$/);
    await expect(page.getByTestId('segments-row')).toBeVisible({ timeout: DETECTION_TIMEOUT_MS });
  });

  test('a sport filter on the dashboard narrows the Segments list', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/?tab=segments');
    const items = page.getByTestId('segment-item');
    await expect(items.first()).toBeVisible({ timeout: DETECTION_TIMEOUT_MS });
    await expect(items.locator('.text-sport-running').first()).toBeVisible();

    await openFilterList(page);
    await page.getByLabel(/describe a filter/i).fill('ride');
    await page
      .getByTestId('filter-builder-tiles')
      .getByRole('button', { name: /^Apply filter: Cycling/ })
      .first()
      .click();
    await expect(filterList(page).getByRole('button').first()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await closeFilterList(page);

    await expect(items.locator('.text-sport-running')).toHaveCount(0);
    await expect(items.locator('.text-sport-cycling').first()).toBeVisible();
  });
});
