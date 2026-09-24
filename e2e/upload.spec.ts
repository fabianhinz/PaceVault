import { test, expect } from '@playwright/test';
import { seedOnboardingComplete, CYCLING_FIT, RUNNING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';

test.describe('File upload', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboardingComplete(page);
  });

  test('the dock no longer offers an upload button', async ({ page }) => {
    await expect(page.locator('[data-layout="dock"]')).toBeVisible();
    await expect(
      page.locator('[data-layout="dock"]').getByRole('button', { name: /upload/i }),
    ).toHaveCount(0);
  });

  test('the settings FIT files card uploads through its own button', async ({ page }) => {
    await page.goto('/settings?tab=data');
    await expect(page.getByRole('button', { name: /upload fit files/i })).toBeEnabled();

    const doneBanner = await uploadFitFiles(page, [CYCLING_FIT]);
    await expect(doneBanner).toContainText('1 session');
  });

  test('upload a FIT file → session appears', async ({ page }) => {
    const doneBanner = await uploadFitFiles(page, [CYCLING_FIT]);
    await expect(doneBanner).toContainText('1 session');

    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    // Wait for the done banner to dismiss and verify session appears in the list
    // Session items are links to /sessions/:id
    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });
  });

  test('upload duplicate file → shows duplicate message', async ({ page }) => {
    // First upload
    await uploadFitFiles(page, [CYCLING_FIT]);

    // Wait for the done banner to disappear (4s auto-dismiss)
    await page.waitForTimeout(5000);

    // Upload the same file again
    const doneBanner = await uploadFitFiles(page, [CYCLING_FIT]);
    await expect(doneBanner).toContainText('duplicate');
  });

  test('upload multiple files at once → all sessions appear', async ({ page }) => {
    const doneBanner = await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
    await expect(doneBanner).toContainText('2 sessions');

    // Navigate to sessions page and verify both sessions are listed
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });
  });
});
