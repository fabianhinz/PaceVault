// Before/after captures for the conventions migration: the screens most plans touch. Most changes are
// refactoring, so before and after should match except for the adopted behaviour changes.
// Run: vp run workbench:capture -- tools/workbench/backlog/conventions-migration/review
import type { Page } from '@playwright/test';
import { loadDemoData, prepare, shootAll, test } from '../../../shared/capture';

const openFirstSession = async (page: Page) => {
  await page.goto('/sessions');
  await page.locator('[data-testid="session-item"]').first().click();
  await page.waitForURL(/\/sessions\/.+/);
  await page.getByTestId('map-view-pill').waitFor({ timeout: 15_000 });
};

test('app screens with the demo data', async ({ page }) => {
  test.setTimeout(600_000);
  await prepare(page, 'en');
  await loadDemoData(page);

  await shootAll(page, 'dashboard', async (p) => {
    await p.goto('/');
  });
  await shootAll(page, 'sessions', async (p) => {
    await p.goto('/sessions');
  });
  await shootAll(page, 'session-2d', async (p) => {
    await openFirstSession(p);
    // Recharts draws its lines with an SVG animation the settle step does not wait for.
    await p.waitForTimeout(2500);
  });
  await shootAll(page, 'session-3d', async (p) => {
    await openFirstSession(p);
    await p.getByTestId('map-view-pill').click();
    await p.getByRole('radio', { name: /^3D/ }).click();
    await p.keyboard.press('Escape');
    await p.waitForTimeout(2500);
  });
  await shootAll(page, 'labs', async (p) => {
    await p.goto('/labs');
  });
  await shootAll(page, 'settings', async (p) => {
    await p.goto('/settings');
  });
});
