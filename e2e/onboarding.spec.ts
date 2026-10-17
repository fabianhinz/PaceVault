import { test, expect } from './helpers/test';
import { RUNNING_FIT, seedOnboardingComplete } from './helpers/seed';
import { closeImportSummary, uploadFilesWithButton } from './helpers/upload';
import { setThreshold, thresholdTile } from './helpers/thresholds';
import { fillOnboardingProfile, startOnboarding } from './helpers/onboarding';

test.describe('Onboarding flow', () => {
  test('profile → upload FIT → complete onboarding', async ({ page }) => {
    await startOnboarding(page, 'FIT files');

    await expect(page.locator('[data-layout="dock"]')).not.toBeVisible();

    await fillOnboardingProfile(page);

    const uploadButton = page.getByRole('button', { name: /upload fit files/i });
    await expect(uploadButton).toBeEnabled();

    await uploadFilesWithButton(page, uploadButton, [RUNNING_FIT]);

    await expect(page.locator('[data-layout="dock"]')).toBeVisible();

    await expect(page.getByText(/test data/i)).not.toBeVisible();
  });

  test('try demo data from the intro → complete onboarding', async ({ page }) => {
    await page.goto('/');

    const demoButton = page.getByRole('button', { name: 'Try demo data' });
    await demoButton.click({ timeout: 15_000 });

    await closeImportSummary(page);
    await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30000 });
    await expect(demoButton).not.toBeVisible();

    await expect(page.getByText(/test data/i)).toBeVisible();
  });

  test('Continue is disabled until gender and valid HR', async ({ page }) => {
    await startOnboarding(page, 'FIT files');

    const next = page.getByRole('button', { name: 'Continue', exact: true });
    await expect(next).toBeDisabled();

    await page.getByLabel(/^Resting HR/).fill('50');
    await page.getByLabel(/^Max HR/).fill('185');
    await expect(next).toBeDisabled();

    await page.getByRole('radio', { name: 'Female' }).click();
    await expect(next).toBeEnabled();

    await page.getByLabel(/^Max HR/).fill('40');
    await expect(page.getByText('Min 120 bpm')).toBeVisible();
    await expect(next).toBeDisabled();

    await page.getByLabel(/^Max HR/).fill('185');
    await expect(next).toBeEnabled();
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

  test('the map pans under the open card; the grabber closes it and the pill reopens the same question', async ({
    page,
  }) => {
    await startOnboarding(page, 'FIT files');

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'You and your heart rate' })).toBeVisible();
    await page.getByRole('radio', { name: 'Male', exact: true }).click();
    await page.getByLabel(/^Resting HR/).fill('50');

    await page.mouse.move(195, 120);
    await page.mouse.down();
    await page.mouse.move(260, 200, { steps: 5 });
    await page.mouse.up();
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Drag to close' }).tap();
    await expect(dialog).toHaveCount(0);

    const pill = page.getByRole('button', { name: 'Continue setup · 2/4' });
    await pill.tap();
    await expect(dialog.getByRole('heading', { name: 'You and your heart rate' })).toBeVisible();
    await expect(page.getByLabel(/^Resting HR/)).toHaveValue('50');
    await expect(page.getByRole('radio', { name: 'Male', exact: true })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
