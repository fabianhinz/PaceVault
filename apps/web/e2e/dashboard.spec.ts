import { test, expect } from './helpers/test';
import { seedOnboardingComplete, seedWithSessions } from './helpers/seed';
import { applyFilter } from './helpers/filters';

const DAY_MS = 24 * 60 * 60 * 1000;

test.describe('Dashboard volume', () => {
  test.beforeEach(async ({ page }) => {
    const now = Date.now();
    await seedWithSessions(page, [
      { sport: 'running', date: now - 1 * DAY_MS, elevationGain: 100 },
      { sport: 'running', date: now - 2 * DAY_MS },
      { sport: 'running', date: now - 9 * DAY_MS },
    ]);
    await page.goto('/');
  });

  test('adds up the whole history for all time without a comparison', async ({ page }) => {
    const volume = page.getByRole('region', { name: 'Volume' });
    const rail = volume.getByTestId('stat-rail');
    await expect(volume).toContainText('Added up over the range');
    await expect(rail).toContainText('30.0km');
    await expect(rail).toContainText('3 sessions');
    await expect(rail).not.toContainText('Before');
  });

  test('compares the range with the days before and remembers the metric', async ({ page }) => {
    await applyFilter(page, 'last 7 days');

    const volume = page.getByRole('region', { name: 'Volume' });
    const rail = volume.getByTestId('stat-rail');
    await expect(volume).toContainText('Added up over the range');
    await expect(volume).toContainText(/Before · \S/);
    await expect(rail).toContainText('20.0km');
    await expect(rail).toContainText('2 sessions');
    await expect(rail).toContainText('10.0km');
    await expect(rail).toContainText('1 session');

    await volume.getByRole('tab', { name: 'Elevation' }).click();
    await expect(rail).toContainText('100m');
    await expect(rail).toContainText('--m');

    await page.reload();
    await expect(
      page.getByRole('region', { name: 'Volume' }).getByRole('tab', { name: 'Elevation' }),
    ).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Dashboard form', () => {
  test('regression: form gauges show 0.0 without history', async ({ page }) => {
    await seedOnboardingComplete(page);
    await page.goto('/');

    await expect(page.getByText('Current Form', { exact: true })).toBeVisible();
    // Readiness and ramp rate: `--` instead of 0.0, and no status or risk label
    await expect(page.getByRole('heading', { level: 1, name: '--', exact: true })).toHaveCount(2);
    await expect(page.getByRole('heading', { level: 1, name: '0.0', exact: true })).toHaveCount(0);
    await expect(page.getByText(/^(Neutral|Low risk)$/)).toHaveCount(0);
  });
});
