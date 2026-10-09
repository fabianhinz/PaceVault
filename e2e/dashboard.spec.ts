import { test, expect } from './helpers/test';
import { seedWithSessions } from './helpers/seed';
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

  test('hides the volume row for all time', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Performance Metrics' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Volume' })).toHaveCount(0);
  });

  test('compares the range with the days before and remembers the metric', async ({ page }) => {
    await applyFilter(page, 'last 7 days');

    const volume = page.getByRole('region', { name: 'Volume' });
    const rail = volume.getByTestId('stat-rail');
    await expect(volume).toContainText('This range against the 7 days before');
    await expect(rail).toContainText('20.0km');
    await expect(rail).toContainText('2 sessions');
    await expect(rail).toContainText('10.0km');
    await expect(rail).toContainText('1 session');

    await volume.getByRole('tab', { name: 'Elevation' }).click();
    await expect(rail).toContainText('100m');
    await expect(volume.getByTestId('volume-coverage-note')).toHaveText(
      'This range: from 1 of 2 sessions',
    );
    await expect(rail).toContainText('--m');

    await page.reload();
    await expect(
      page.getByRole('region', { name: 'Volume' }).getByRole('tab', { name: 'Elevation' }),
    ).toHaveAttribute('aria-selected', 'true');
  });
});
