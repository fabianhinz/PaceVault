import { test, expect } from './helpers/test';
import { RUNNING_FIT, seedOnboardingComplete } from './helpers/seed';
import { closeImportSummary, uploadFilesWithButton } from './helpers/upload';
import { setThreshold, thresholdTile } from './helpers/thresholds';

test.describe('Onboarding flow', () => {
  test('set thresholds → upload FIT → complete onboarding', async ({ page }) => {
    await page.goto('/');

    await page.getByText('FIT files', { exact: true }).click();

    await expect(thresholdTile(page, 'Rest HR')).toBeVisible();

    await expect(page.locator('[data-layout="dock"]')).not.toBeVisible();

    await setThreshold(page, 'Rest HR', '50');
    await setThreshold(page, 'Max HR', '185');
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);

    const uploadButton = page.getByRole('button', { name: /upload fit files/i });
    await expect(uploadButton).toBeEnabled();

    await uploadFilesWithButton(page, uploadButton, [RUNNING_FIT]);

    await expect(page.locator('[data-layout="dock"]')).toBeVisible();

    await expect(thresholdTile(page, 'Rest HR')).not.toBeVisible();

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

    await setThreshold(page, 'Rest HR', '50');
    await expect(uploadButton).toBeDisabled();

    await thresholdTile(page, 'Max HR').click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input').fill('40');
    await expect(dialog.getByText('Min 120 bpm')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(uploadButton).toBeDisabled();

    await setThreshold(page, 'Max HR', '185');
    await expect(uploadButton).toBeEnabled();
  });

  test("changing FTP in settings saves it as today's entry", async ({ page }) => {
    await seedOnboardingComplete(page);
    await page.goto('/settings');

    await expect(thresholdTile(page, 'Rest HR')).toContainText('50');

    const ftpTile = thresholdTile(page, 'FTP');
    await ftpTile.click();
    const dialog = page.getByRole('dialog', { name: 'FTP (watts)' });
    const input = dialog.getByLabel('FTP (watts)');
    await expect(input).toBeFocused();
    await input.fill('280');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(dialog).toHaveCount(0);

    await expect(ftpTile).toContainText('280');
    const todayShort = new Intl.DateTimeFormat('en', { dateStyle: 'short' }).format(new Date());
    await expect(ftpTile).toContainText(todayShort);
    await expect(ftpTile).toHaveCSS('box-shadow', /rgba?\(/);
    await expect(page.getByRole('region', { name: /notifications/i }).locator('li')).toHaveCount(0);

    const wkgTile = page
      .locator('div')
      .filter({ hasText: /^W\/kg/ })
      .first();
    await expect(wkgTile).toContainText('--');
    await expect(wkgTile).toContainText('Add weight');
    await setThreshold(page, 'Weight', '75');
    await expect(wkgTile).toContainText('3.73');

    await setThreshold(page, 'Rest HR', '52');
    await expect(thresholdTile(page, 'Rest HR')).toContainText(todayShort);

    await page.reload();
    await expect(ftpTile).toContainText('280');

    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0);
  });
});

test.describe('Thresholds editor on phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('a tile opens the floating card and the grabber closes it unchanged', async ({ page }) => {
    await seedOnboardingComplete(page);
    await page.goto('/settings');

    const restTile = thresholdTile(page, 'Rest HR');
    await restTile.click();
    const dialog = page.getByRole('dialog');
    const box = await dialog.boundingBox();
    expect(box?.x).toBeCloseTo(8, 0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeCloseTo(382, 0);

    await dialog.locator('input').fill('55');
    await dialog.getByRole('button', { name: 'Drag to close' }).tap();
    await expect(dialog).toHaveCount(0);
    await expect(restTile).toContainText('50');
  });
});
