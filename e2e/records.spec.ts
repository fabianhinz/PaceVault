import { test, expect, type Page } from '@playwright/test';
import { seedOnboardingComplete, CYCLING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';

const recordLinks = (page: Page) => page.getByRole('tabpanel').locator('a[href^="/sessions/"]');

const openRecordsTab = async (page: Page) => {
  await page.getByRole('link', { name: /sessions/i }).click();
  await page.waitForURL(/\/sessions/);
  await page.getByRole('tab', { name: /records/i }).click();
};

test.describe('Personal bests', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboardingComplete(page);
  });

  test('stay global across filters and disappear with their session', async ({ page }) => {
    await uploadFitFiles(page, [CYCLING_FIT]);
    await openRecordsTab(page);
    await expect(recordLinks(page).first()).toBeVisible();
    const count = await recordLinks(page).count();

    await page
      .locator('[data-layout="dock"]')
      .getByRole('button', { name: /sport filter/i })
      .last()
      .click();
    await page
      .locator('[data-layout="dock"] .pointer-events-auto')
      .getByRole('radio', { name: /run$/i })
      .click();
    await expect(recordLinks(page)).toHaveCount(count);

    await recordLinks(page).first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await page.getByRole('button', { name: /session actions/i }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await page.getByRole('button', { name: /^delete$/i }).click();
    await page.waitForURL('/sessions');

    await page.getByRole('tab', { name: /records/i }).click();
    await expect(recordLinks(page)).toHaveCount(0);
  });
});
