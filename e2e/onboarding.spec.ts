import { test, expect } from '@playwright/test';
import { RUNNING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';

test.describe('Onboarding flow', () => {
  test('set thresholds → upload FIT → complete onboarding', async ({ page }) => {
    await page.goto('/');

    // Select the "Files & archives" path to reveal thresholds
    await page.getByText(/FIT files & archives/i).click();

    // Onboarding page should be shown (thresholds card visible)
    const thresholdsCard = page.locator('#thresh-restHr');
    await expect(thresholdsCard).toBeVisible();

    // The dock should NOT be visible during onboarding
    await expect(page.locator('[data-layout="dock"]')).not.toBeVisible();

    // Fill in required thresholds
    await page.fill('#thresh-restHr', '50');
    await page.fill('#thresh-maxHr', '185');

    // Wait for profile creation (500ms debounce + processing)
    // The upload button should become enabled once profile is created
    const uploadButton = page.getByRole('button', { name: /upload/i }).first();
    await expect(uploadButton).toBeEnabled({ timeout: 3000 });

    // Upload a FIT file via the hidden input
    await uploadFitFiles(page, [RUNNING_FIT]);

    // After upload, onboarding auto-completes — dock should now be visible
    await expect(page.locator('[data-layout="dock"]')).toBeVisible();

    // Verify: onboarding content should be gone
    await expect(page.locator('#thresh-restHr')).not.toBeVisible();

    // Demo banner should NOT be visible after uploading real data
    await expect(page.getByText(/test data/i)).not.toBeVisible();
  });

  test('generate test data → complete onboarding', async ({ page }) => {
    await page.goto('/');

    await page.getByText(/test data/i).click();

    const generateButton = page.getByRole('button', { name: 'Generate', exact: true });
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30000 });
    await expect(generateButton).not.toBeVisible();

    // Demo banner should be visible after generating test data
    await expect(page.getByText(/test data/i)).toBeVisible();
  });

  test('upload button is disabled until thresholds are set', async ({ page }) => {
    await page.goto('/');

    // Select the "Files & archives" path to reveal thresholds and upload
    await page.getByText(/FIT files & archives/i).click();

    // Upload button should be disabled before thresholds
    const uploadButton = page.getByRole('button', { name: /upload/i }).first();
    await expect(uploadButton).toBeDisabled();

    // Fill only restHr — button should still be disabled (need both)
    await page.fill('#thresh-restHr', '50');

    // Wait a bit for debounce
    await page.waitForTimeout(600);
    await expect(uploadButton).toBeDisabled();

    // Fill maxHr — now profile should be created and button enabled
    await page.fill('#thresh-maxHr', '185');
    await expect(uploadButton).toBeEnabled({ timeout: 3000 });
  });
});
