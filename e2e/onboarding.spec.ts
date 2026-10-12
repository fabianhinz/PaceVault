import { test, expect } from './helpers/test';
import { RUNNING_FIT, seedOnboardingComplete } from './helpers/seed';
import { closeImportSummary, uploadFilesWithButton } from './helpers/upload';

test.describe('Onboarding flow', () => {
  test('set thresholds → upload FIT → complete onboarding', async ({ page }) => {
    await page.goto('/');

    await page.getByText('FIT files', { exact: true }).click();

    const thresholdsCard = page.locator('#thresh-restHr');
    await expect(thresholdsCard).toBeVisible();

    await expect(page.locator('[data-layout="dock"]')).not.toBeVisible();

    await page.fill('#thresh-restHr', '50');
    await page.fill('#thresh-maxHr', '185');
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);

    const uploadButton = page.getByRole('button', { name: /upload fit files/i });
    await expect(uploadButton).toBeEnabled();

    await uploadFilesWithButton(page, uploadButton, [RUNNING_FIT]);

    await expect(page.locator('[data-layout="dock"]')).toBeVisible();

    await expect(page.locator('#thresh-restHr')).not.toBeVisible();

    await expect(page.getByText(/test data/i)).not.toBeVisible();
  });

  test('generate test data → complete onboarding', async ({ page }) => {
    await page.goto('/');

    await page.getByText(/test data/i).click();

    const generateButton = page.getByRole('button', { name: 'Generate', exact: true });
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    await closeImportSummary(page);
    await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30000 });
    await expect(generateButton).not.toBeVisible();

    await expect(page.getByText(/test data/i)).toBeVisible();
  });

  test('upload button is disabled until thresholds are valid', async ({ page }) => {
    await page.goto('/');

    await page.getByText('FIT files', { exact: true }).click();

    const uploadButton = page.getByRole('button', { name: /upload fit files/i });
    await expect(uploadButton).toBeDisabled();

    await page.fill('#thresh-restHr', '50');
    await expect(uploadButton).toBeDisabled();

    await page.fill('#thresh-maxHr', '40');
    await expect(page.getByText('Min 120 bpm')).toBeVisible();
    await expect(uploadButton).toBeDisabled();

    await page.fill('#thresh-maxHr', '185');
    await expect(uploadButton).toBeEnabled();
  });

  test("changing FTP in settings saves it as today's entry", async ({ page }) => {
    await seedOnboardingComplete(page);
    await page.goto('/settings');

    const ftpField = page.getByLabel('FTP (watts)');
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await ftpField.fill('280');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(
      page.getByRole('region', { name: /notifications/i }).getByText('Thresholds saved'),
    ).toBeVisible();

    const history = page.getByRole('region', { name: 'Profile history' });
    await history.getByRole('tab', { name: 'FTP' }).click();
    const rail = history.getByTestId('stat-rail');
    await expect(rail).toContainText('latest');
    await expect(rail).toContainText('280');

    await page.reload();
    await expect(ftpField).toHaveValue('280');

    await expect(saveButton).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0);
  });
});
