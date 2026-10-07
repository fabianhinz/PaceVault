import { test, expect } from './helpers/test';
import { seedOnboardingComplete, CYCLING_FIT, RUNNING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';

const HOUR_SEC = 3600;

const openMeteoFixture = (url: URL) => {
  const startSec = Date.parse(`${url.searchParams.get('start_date')}T00:00:00Z`) / 1000;
  const endSec = Date.parse(`${url.searchParams.get('end_date')}T23:00:00Z`) / 1000;
  const time: number[] = [];
  for (let t = startSec; t <= endSec; t += HOUR_SEC) time.push(t);
  const hourOf = (t: number) => Math.floor(t / HOUR_SEC);
  return {
    hourly: {
      time,
      temperature_2m: time.map((t) => 10 + (hourOf(t) % 5)),
      apparent_temperature: time.map((t) => 8 + (hourOf(t) % 5)),
      relative_humidity_2m: time.map(() => 70),
      wind_speed_10m: time.map(() => 18),
      wind_gusts_10m: time.map(() => 30),
      wind_direction_10m: time.map(() => 240),
      weather_code: time.map((t) => (hourOf(t) % 2 === 0 ? 3 : 61)),
    },
  };
};

test.describe('Session browsing', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboardingComplete(page);
    // Upload two sessions so there's data to browse
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
  });

  test('session list shows uploaded sessions', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    // Session items are links containing sport badge, date, metrics
    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });

    // Each session item should have visible text content (name/date, distance, duration)
    const firstSession = sessionLinks.first();
    await expect(firstSession).toBeVisible();
    // Session items display distance and duration separated by middot
    await expect(firstSession).toContainText('km');
  });

  test('click session → navigate to detail page', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });

    // Click the session item to navigate to its detail page
    await sessionLinks.first().click();

    // Should navigate to /sessions/:id
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
    await expect(stepper.getByTestId('lap-stepper-name')).toHaveText(/^Lap \d+$/);
    await expect(lapsPill).toHaveCount(0);
    await expect(chart.getByTestId('lap-band-selected')).toBeAttached();
    const firstName = await stepper.getByTestId('lap-stepper-name').textContent();

    const next = stepper.getByTestId('lap-stepper-next');
    const before = await next.boundingBox();
    await next.click();
    await expect(stepper.getByTestId('lap-stepper-name')).not.toHaveText(firstName ?? '');
    expect(await next.boundingBox()).toEqual(before);

    await stepper.getByTestId('lap-stepper-clear').click();
    await expect(stepper).toHaveCount(0);
    await expect(lapsPill).toBeVisible();

    await page.getByTestId('laps-row').locator(':scope > button').click();
    await page.getByTestId('lap-strip-bar').nth(1).click();
    await expect(stepper.getByTestId('lap-stepper-name')).toHaveText('Lap 2');
    await expect(page.getByTestId('lap-strip-selected')).toBeAttached();
    await stepper.getByTestId('lap-stepper-clear').click();
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

    // Lands on a fresh studio route with the Tools tab available.
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
    const hours = table.locator('thead th[scope="col"]');
    expect(await hours.count()).toBeGreaterThanOrEqual(2);
    const skyCells = table.getByRole('row', { name: /sky/i }).getByRole('cell');
    await expect(skyCells).toHaveCount(await hours.count());
  });

  test('navigate back from detail to session list', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });

    // Go to detail
    await sessionLinks.first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('training-effect-row')).toBeVisible({ timeout: 10_000 });

    // Navigate back via the Sessions nav link in the dock
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    // Session list should be visible again
    await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
