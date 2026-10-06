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

    // Detail page should show key sections
    // Training effect card
    await expect(page.getByText(/training effect/i)).toBeVisible({ timeout: 10_000 });

    // Stats grid should be present
    await expect(page.getByText(/duration/i).first()).toBeVisible();

    const rails = page.getByTestId('stat-rail');
    await expect(rails.first()).toBeVisible();
    await expect(rails.first()).toContainText(/\d/);
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

  test('a lap picked on a chart opens the peek, steps without moving and resets on the next session', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });
    await sessionLinks.first().click();
    await page.waitForURL(/\/sessions\/.+/);

    const lapsPill = page.getByTestId('laps-pill');
    await expect(lapsPill).toHaveText(/\d+ laps/, { timeout: 10_000 });

    const chart = page.locator('.recharts-wrapper').first();
    await expect(chart.getByTestId('lap-band').first()).toBeAttached();
    const box = await chart.boundingBox();
    if (!box) throw new Error('chart has no box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    const peek = page.getByTestId('lap-peek');
    await expect(peek.getByTestId('lap-peek-name')).toHaveText(/^Lap \d+$/);
    await expect(chart.getByTestId('lap-band-selected')).toBeAttached();
    const firstName = await peek.getByTestId('lap-peek-name').textContent();

    const next = peek.getByTestId('lap-peek-next');
    const before = await next.boundingBox();
    await next.click();
    await expect(peek.getByTestId('lap-peek-name')).not.toHaveText(firstName ?? '');
    expect(await next.boundingBox()).toEqual(before);

    await peek.getByTestId('lap-peek-clear').click();
    await expect(peek).toHaveCount(0);

    await lapsPill.click();
    await page.getByRole('radio', { name: /splits/i }).click();
    await page.getByRole('button', { name: /^2 km$/ }).click();
    await expect(lapsPill).toHaveText(/2 km splits/);
    await page.getByTestId('color-by-pill').click();
    await page.getByRole('radio', { name: /heart rate/i }).click();
    await expect(page.getByTestId('color-by-pill')).toHaveText(/hr zones/i);

    await page.goBack();
    await page.waitForURL('/sessions');
    await sessionLinks.nth(1).click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('laps-pill')).toHaveText(/\d+ laps/, { timeout: 10_000 });
    await expect(page.getByTestId('color-by-pill')).toHaveText(/color by/i);
  });

  test('edit route in studio → imports the track and opens it', async ({ page }) => {
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    const sessionLinks = page.locator('[data-testid="session-item"]');
    await expect(sessionLinks.first()).toBeVisible({ timeout: 10_000 });
    await sessionLinks.first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByText(/training effect/i)).toBeVisible({ timeout: 10_000 });

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
    const toggle = card.getByRole('button');
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
    await expect(page.getByText(/training effect/i)).toBeVisible({ timeout: 10_000 });

    // Navigate back via the Sessions nav link in the dock
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');

    // Session list should be visible again
    await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
