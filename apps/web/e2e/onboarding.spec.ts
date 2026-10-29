import { test, expect } from './helpers/test';
import { RUNNING_FIT, seedOnboardingComplete } from './helpers/seed';
import { closeImportSummary, uploadFilesWithButton } from './helpers/upload';
import { setThreshold, thresholdTile } from './helpers/thresholds';
import { fillOnboardingProfile, startOnboarding } from './helpers/onboarding';

test.describe('Onboarding flow', () => {
  test('profile with the optional values → upload FIT → values are saved', async ({ page }) => {
    await startOnboarding(page, 'FIT files');

    await expect(page.locator('[data-layout="dock"]')).not.toBeVisible();

    const next = page.getByRole('button', { name: 'Continue', exact: true });
    await page.getByRole('radio', { name: 'Male', exact: true }).click();
    await page.getByLabel(/^Resting HR/).fill('50');
    await page.getByLabel(/^Max HR/).fill('185');
    await page.getByLabel(/^Weight/).fill('72');
    await page.getByLabel(/^Birth year/).fill('1990');
    await next.click();

    await expect(page.getByRole('heading', { name: 'Your thresholds' })).toBeVisible();
    await page.getByLabel(/^FTP/).fill('250');
    await page.getByRole('button', { name: 'Estimate from a race time' }).click();
    const estimator = page.getByRole('dialog', { name: 'Estimate Threshold Pace' });
    await estimator.getByRole('textbox').fill('20:00');
    await estimator.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(estimator).toHaveCount(0);
    await expect(page.getByLabel(/^Threshold Pace/)).toHaveValue(/^\d:\d\d$/);
    await page.getByLabel(/^Threshold HR/).fill('165');
    await next.click();

    const uploadButton = page.getByRole('button', { name: /upload fit files/i });
    await expect(uploadButton).toBeEnabled();

    await uploadFilesWithButton(page, uploadButton, [RUNNING_FIT]);

    await expect(page.locator('[data-layout="dock"]')).toBeVisible();

    await expect(page.getByText(/test data/i)).not.toBeVisible();

    await page.goto('/settings');
    await expect(thresholdTile(page, 'Weight')).toContainText('72');
    await expect(thresholdTile(page, 'FTP')).toContainText('250');
    await expect(thresholdTile(page, 'Threshold pace')).not.toContainText('Add threshold pace');
    await expect(thresholdTile(page, 'Threshold HR')).toContainText('165');
    await expect(page.getByLabel('Birth year')).toHaveValue('1990');
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

  test('a source tile advances on its own; Back returns to the source step without Back or Continue', async ({
    page,
  }) => {
    await startOnboarding(page, 'FIT files');

    const youHeading = page.getByRole('heading', { name: 'You and your heart rate' });
    await expect(youHeading).toBeVisible();
    await page.getByRole('button', { name: 'Back', exact: true }).click();

    const sourceHeading = page.getByRole('heading', { name: 'Where are your sessions?' });
    await expect(sourceHeading).toBeVisible();
    await expect(page.getByTestId('onboarding-progress')).toHaveText('1/4');
    await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
    await expect(page.locator(':focus')).toContainText('Where are your sessions?');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /^intervals\.icu/ })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(youHeading).toBeVisible();
    await expect(page.locator(':focus')).toContainText('You and your heart rate');
  });

  test('Continue shows the step errors, focuses the first invalid field and stays; valid values advance', async ({
    page,
  }) => {
    await startOnboarding(page, 'FIT files');

    const heading = page.getByRole('heading', { name: 'You and your heart rate' });
    const next = page.getByRole('button', { name: 'Continue', exact: true });
    const required = page.getByText('Required', { exact: true });
    const genderError = page.locator('#onboarding-gender-error');
    const genderBox = await genderError.boundingBox();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(heading).toBeVisible();
    await expect(required).toHaveCount(3);
    await expect(page.getByRole('radio', { name: 'Male', exact: true })).toBeFocused();

    // The gender error fills the reserved line under the tiles: below Female, nothing moves.
    await expect(genderError).toHaveText('Required');
    const femaleBox = await page.getByRole('radio', { name: 'Female' }).boundingBox();
    expect(await genderError.boundingBox()).toEqual(genderBox);
    expect(genderBox?.y ?? 0).toBeGreaterThan((femaleBox?.y ?? 0) + (femaleBox?.height ?? 0));

    await page.getByRole('radio', { name: 'Female' }).click();
    await expect(required).toHaveCount(2);
    await page.getByLabel(/^Resting HR/).fill('50');
    await page.getByLabel(/^Max HR/).fill('250');
    await page.getByLabel(/^Weight/).fill('500');
    await next.click();
    await expect(page.getByText('Max 230 bpm')).toBeVisible();
    await expect(page.getByText('Max 200 kg')).toBeVisible();
    await expect(page.getByLabel(/^Max HR/)).toBeFocused();
    await expect(heading).toBeVisible();

    await page.getByLabel(/^Max HR/).fill('185');
    await expect(page.getByText('Max 230 bpm')).toHaveCount(0);
    await page.getByLabel(/^Weight/).fill('');
    await page.getByLabel(/^Birth year/).fill('19');
    await expect(page.getByText(/^Between 1920/)).toHaveCount(0);
    await page.getByLabel(/^Birth year/).blur();
    await expect(page.getByText(/^Between 1920/)).toBeVisible();
    await page.getByLabel(/^Birth year/).fill('');
    await next.click();

    await expect(page.getByRole('heading', { name: 'Your thresholds' })).toBeVisible();
    const pace = page.getByLabel(/^Threshold Pace/);
    await pace.fill('abc');
    await next.click();
    await expect(page.getByText('Format: m:ss (2:30-9:00)')).toBeVisible();
    await expect(pace).toBeFocused();
    await pace.fill('');
    const thresholdHr = page.getByLabel(/^Threshold HR/);
    await thresholdHr.fill('190');
    await next.click();
    await expect(page.getByText('Max 184 bpm')).toBeVisible();
    await expect(thresholdHr).toBeFocused();
    await thresholdHr.fill('');
    await next.click();
    await expect(page.getByRole('button', { name: /upload fit files/i })).toBeVisible();
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
    await expect(ftpTile).toHaveCSS('box-shadow', /color\(srgb /);
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

    await expect(thresholdTile(page, 'Threshold HR')).toContainText('Add threshold HR');
    await setThreshold(page, 'Threshold HR', '170');
    await expect(thresholdTile(page, 'Threshold HR')).toContainText('170');

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
