import { test, expect } from './helpers/test';
import { seedOnboardingComplete, CYCLING_FIT, RUNNING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';
import { openMeteoFixture } from './helpers/openMeteo';

test.describe('Session browsing', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
  });

  test('session list shows uploaded sessions', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });

    const firstSession = sessionLinks.first();
    await expect(firstSession).toBeVisible();
    await expect(firstSession).toContainText('km');
  });

  test('click session → navigate to detail page', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });

    await sessionLinks.first().click();

    await page.waitForURL(/\/sessions\/.+/);

    const teToggle = page.getByTestId('training-effect-row').locator(':scope > button');
    await expect(teToggle).toHaveAttribute('aria-expanded', 'false', { timeout: 10_000 });
    await expect(teToggle).toContainText(/aerobic \d.*anaerobic \d/i);
    await teToggle.click();
    await expect(teToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/^aerobic te$/i)).toBeVisible();

    const rails = page.getByTestId('stat-rail');
    await expect(rails.first()).toBeVisible();
    await expect(rails.first()).toContainText(/\d/);
  });

  test('summary rows open inline on the phone and the laps row follows the laps source', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);

    const teToggle = page.getByTestId('training-effect-row').locator(':scope > button');
    const lapsRow = page.getByTestId('laps-row');
    const lapsToggle = lapsRow.locator(':scope > button');
    await expect(teToggle).toHaveAttribute('aria-expanded', 'false', { timeout: 10_000 });
    await expect(lapsToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(lapsToggle).toContainText(/^\d+ splits · avg/);

    await teToggle.click();
    await expect(teToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/^aerobic te$/i)).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByTestId('laps-pill').click();
    await page.getByRole('radio', { name: /^off/i }).click();
    await page.keyboard.press('Escape');
    await expect(lapsToggle).toHaveCount(0);
    await expect(lapsRow.locator('[aria-disabled="true"]')).toContainText(/laps off/i);
  });

  test('color by HR zones colours the HR chart and is not carried over to the next session', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });
    await sessionLinks.first().click();
    await page.waitForURL(/\/sessions\/.+/);

    const pill = page.getByTestId('color-by-pill');
    await expect(pill).toHaveText(/color by/i, { timeout: 10_000 });
    await pill.click();
    await page.getByRole('radio', { name: /heart rate/i }).click();
    await expect(pill).toHaveText(/hr zones/i);
    await expect(page.locator('path.recharts-line-curve[stroke^="url(#zone-"]')).toHaveCount(1);

    await page.goBack();
    await page.waitForURL('/sessions');
    await sessionLinks.nth(1).click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('color-by-pill')).toHaveText(/color by/i, { timeout: 10_000 });
  });

  test('a lap picked on a chart turns the laps pill into a stepper, steps without moving and resets on the next session', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });
    await sessionLinks.first().click();
    await page.waitForURL(/\/sessions\/.+/);

    const lapsPill = page.getByTestId('laps-pill');
    await expect(lapsPill).toHaveText(/^(1|5) km splits$/, { timeout: 10_000 });
    const defaultLabel = await lapsPill.textContent();

    const chart = page.locator('.recharts-wrapper').first();
    await expect(chart.getByTestId('lap-band').first()).toBeAttached();
    const box = await chart.boundingBox();
    if (!box) throw new Error('chart has no box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    const stepper = page.getByTestId('lap-stepper');
    await expect(stepper.getByTestId('lap-stepper-name')).toHaveText(/^Split \d+$/);
    await expect(lapsPill).toHaveCount(0);
    await expect(chart.getByTestId('lap-band-selected')).toBeAttached();
    const firstName = await stepper.getByTestId('lap-stepper-name').textContent();
    await expect(page.getByTestId('color-by-pill')).toHaveAccessibleName(/color by/i);

    const next = stepper.getByTestId('lap-stepper-next');
    const before = await next.boundingBox();
    await next.click();
    await expect(stepper.getByTestId('lap-stepper-name')).not.toHaveText(firstName ?? '');
    expect(await next.boundingBox()).toEqual(before);

    await page.getByTestId('lap-stepper-clear').click();
    await expect(stepper).toHaveCount(0);
    await expect(lapsPill).toBeVisible();

    await page.getByTestId('laps-row').locator(':scope > button').click();
    await page.getByTestId('lap-strip-bar').nth(1).click();
    await expect(stepper.getByTestId('lap-stepper-name')).toHaveText('Split 2');
    await expect(page.getByTestId('lap-strip-selected')).toBeAttached();
    await page.getByTestId('lap-stepper-clear').click();
    await expect(lapsPill).toBeVisible();

    await lapsPill.click();
    await page.getByRole('slider', { name: /split distance/i }).press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(lapsPill).not.toHaveText(defaultLabel ?? '');
    await expect(lapsPill).toHaveText(/km splits/);
    await page.getByTestId('color-by-pill').click();
    await page.getByRole('radio', { name: /heart rate/i }).click();
    await expect(page.getByTestId('color-by-pill')).toHaveText(/hr zones/i);

    await page.goBack();
    await page.waitForURL('/sessions');
    await sessionLinks.nth(1).click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('laps-pill')).toHaveText(/^(1|5) km splits$/, {
      timeout: 10_000,
    });
    await expect(page.getByTestId('color-by-pill')).toHaveText(/color by/i);
  });

  test('Color by stays open when clicked right after Escape closes the laps picker', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);

    const colorByPill = page.getByTestId('color-by-pill');
    await page.getByTestId('laps-pill').click();
    await expect(page.getByRole('slider', { name: /split distance/i })).toBeVisible();
    await page.evaluate(() => {
      const picker = document.querySelector('[role="radiogroup"]');
      const pill = document.querySelector<HTMLElement>('[data-testid="color-by-pill"]');
      const observer = new MutationObserver(() => {
        if (picker?.isConnected) return;
        observer.disconnect();
        pill?.click();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    await page.keyboard.press('Escape');

    await expect(colorByPill).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('radio', { name: /heart rate/i }).click();
    await expect(colorByPill).toHaveText(/hr zones/i);
  });

  test('edit route in studio → imports the track and opens it', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });
    await sessionLinks.first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('training-effect-row')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /session actions/i }).click();
    await page.getByRole('menuitem', { name: /edit route in studio/i }).click();

    await page.waitForURL(/\/studio\/.+/);
    await page.getByRole('tab', { name: /tools/i }).click();
    await expect(page.getByRole('button', { name: /add split point/i })).toBeVisible();
  });

  test('weather card peeks at the conditions and opens the hourly table', async ({ page }) => {
    await page.route('**/archive-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: openMeteoFixture(new URL(route.request().url())) }),
    );
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });
    await sessionLinks.first().click();
    await page.waitForURL(/\/sessions\/.+/);

    const card = page.getByTestId('weather-card');
    const toggle = card.locator(':scope > button');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false', { timeout: 10_000 });
    await expect(toggle).toContainText(/(cloudy|rain).*°C.*(cloudy|rain) from/i);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const table = card.getByRole('table');
    await expect(table).toBeVisible();
    const attribution = card.getByRole('link', { name: /open-meteo\.com/i });
    await expect(attribution).toBeVisible();
    await expect(attribution).toHaveAttribute('href', 'https://open-meteo.com/');
    const hours = table.locator('thead th[scope="col"]');
    expect(await hours.count()).toBeGreaterThanOrEqual(2);
    const weatherRow = table.getByRole('row', { name: /^weather/i });
    await expect(weatherRow.getByRole('cell')).toHaveCount(await hours.count());
    const lightRain = weatherRow.getByRole('img', { name: 'Light rain', exact: true });
    await expect(lightRain.first()).toBeVisible();
    await expect(lightRain.first().locator('circle')).toHaveCount(3);
    await expect(weatherRow.locator('[title]')).toHaveCount(0);
    await expect(
      weatherRow.getByRole('img', { name: 'Cloudy', exact: true }).first(),
    ).toBeVisible();
    await expect(
      weatherRow.getByRole('img', { name: 'Cloudy', exact: true }).first().locator('circle'),
    ).toHaveCount(0);
  });

  test('more stats row lists its topics and sends missing body data to settings', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    await page.locator('[data-testid="session-item"]').filter({ hasText: /run/i }).click();
    await page.waitForURL(/\/sessions\/.+/);

    const row = page.getByTestId('session-stats-row');
    const toggle = row.locator(':scope > button');
    await expect(toggle).toContainText('Calories · Stride · Zones · Decoupling', {
      timeout: 10_000,
    });

    await toggle.click();
    await expect(row.locator('[data-stat="stepLength"]')).toContainText('spm');
    await expect(row.locator('[data-stat="stepLength"]')).not.toContainText('Pace');
    const moving = row.locator('[data-stat="movingTime"]');
    await expect(moving).toContainText(/Elapsed time\d/);
    await expect(moving).toContainText('Stopped');
    await expect(moving).not.toContainText('Coasting');

    const zones = row.locator('[data-stat="trainingZones"]');
    await expect(zones).toContainText('HR zones');
    const segment = zones.getByRole('img', { name: /^Z\d.*: [\d:]+ · [1-9]\d* %$/ }).first();
    const label = (await segment.getAttribute('aria-label')) ?? '';
    const time = label.split(': ')[1]?.split(' · ')[0] ?? '';
    const share = label.split(' · ')[1] ?? '';
    await expect(zones).not.toContainText(time);

    await segment.hover();
    await expect(zones).toContainText(time);
    await page.mouse.move(0, 0);
    await expect(zones).not.toContainText(time);

    await segment.click();
    await page.mouse.move(0, 0);
    await expect(zones).toContainText(time);
    await expect(zones).not.toContainText(share);

    await segment.click();
    await page.mouse.move(0, 0);
    await expect(zones).not.toContainText(time);
    await expect(
      page.getByRole('region', { name: 'Cadence' }).getByTestId('stat-rail'),
    ).toContainText('spm');

    await row
      .locator('[data-stat="calories"]')
      .getByRole('link', { name: 'Add your weight' })
      .click();
    await page.waitForURL('/settings');
  });

  test('navigate back from detail to session list', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });

    await sessionLinks.first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('training-effect-row')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
