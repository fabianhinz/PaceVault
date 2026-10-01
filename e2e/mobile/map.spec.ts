import { test, expect } from '../helpers/test';
import { seedOnboardingComplete } from '../helpers/seed';

const mapToggle = (page: import('@playwright/test').Page) =>
  page.locator('[data-layout="dock"]').getByRole('button', { name: /show map|hide map/i });

const content = (page: import('@playwright/test').Page) => page.locator('[data-layout="main"]');

test.describe('mobile map toggle', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboardingComplete(page);
  });

  test('toggle is visible on mobile', async ({ page }) => {
    await expect(mapToggle(page)).toBeVisible();
  });

  test('toggle defaults to off', async ({ page }) => {
    await expect(mapToggle(page)).toHaveAttribute('data-state', 'off');
  });

  test('tapping toggle activates map view', async ({ page }) => {
    await mapToggle(page).click();

    await expect(mapToggle(page)).toHaveAttribute('data-state', 'on');
    await expect(content(page)).toHaveAttribute('data-map-active', 'true');
  });

  test('tapping again deactivates map view', async ({ page }) => {
    await mapToggle(page).click();
    await expect(mapToggle(page)).toHaveAttribute('data-state', 'on');

    await mapToggle(page).click();
    await expect(mapToggle(page)).toHaveAttribute('data-state', 'off');
    await expect(content(page)).not.toHaveAttribute('data-map-active');
  });

  test('aria-label reflects toggle state', async ({ page }) => {
    await expect(mapToggle(page)).toHaveAttribute('aria-label', 'Show map');

    await mapToggle(page).click();
    await expect(mapToggle(page)).toHaveAttribute('aria-label', 'Hide map');

    await mapToggle(page).click();
    await expect(mapToggle(page)).toHaveAttribute('aria-label', 'Show map');
  });
});
