import { test, expect, type Page } from './helpers/test';
import { seedWithSessions } from './helpers/seed';
import { applyFilter, dockFilterButton, filterList, openFilterList } from './helpers/filters';

const DAY_MS = 24 * 60 * 60 * 1000;

const sessionItems = (page: Page) => page.locator('[data-testid="session-item"]');
const dockBadge = (page: Page) => dockFilterButton(page).getByTestId('icon-badge');

test.describe('Dock filters', () => {
  test.beforeEach(async ({ page }) => {
    const now = Date.now();
    await seedWithSessions(page, [
      { sport: 'running', date: now - 2 * DAY_MS, name: 'Recent Run', distance: 10000 },
      { sport: 'cycling', date: now - 15 * DAY_MS, name: 'Mid Ride', distance: 40000 },
      { sport: 'running', date: now - 20 * DAY_MS, name: 'Long Run', distance: 21000 },
      { sport: 'cycling', date: now - 120 * DAY_MS, name: 'Old Ride', distance: 60000 },
    ]);
    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
  });

  test('applies a default filter, keeps the list open and clears it again', async ({ page }) => {
    await expect(sessionItems(page)).toHaveCount(4);
    await expect(dockBadge(page)).toHaveCount(0);

    await openFilterList(page);
    const lastWeek = filterList(page).getByRole('button', { name: 'last 7 days', exact: true });
    await lastWeek.click();
    await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(lastWeek).toHaveAttribute('aria-pressed', 'true');
    await expect(sessionItems(page)).toHaveCount(1);
    await expect(sessionItems(page).first()).toContainText('Recent Run');
    await expect(dockBadge(page)).toBeVisible();

    await lastWeek.click();
    await expect(sessionItems(page)).toHaveCount(4);
    await expect(dockBadge(page)).toHaveCount(0);
    await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('tab', { name: 'Log' }).click();
    await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('creates a filter through the inline input and puts it at the top', async ({ page }) => {
    await openFilterList(page);
    const input = page.getByLabel(/describe a filter/i);
    await input.fill('run 30 days');
    await expect(
      filterList(page).getByRole('button', { name: 'last 7 days', exact: true }),
    ).toHaveCount(0);
    await page
      .getByTestId('filter-builder-tiles')
      .getByRole('button', { name: 'Apply filter: Running · last 30 days', exact: true })
      .click();
    await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(input).toHaveValue('');
    await expect(page.getByTestId('filter-builder-tiles')).toHaveCount(0);
    await expect(sessionItems(page)).toHaveCount(2);
    const rows = filterList(page).getByRole('button');
    await expect(rows.first()).toHaveAccessibleName('Running · last 30 days');
    await expect(rows.first()).toHaveAttribute('aria-pressed', 'true');

    await input.fill('ride');
    await input.press('Escape');
    await expect(input).toHaveValue('');
    await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'true');
    await input.press('Escape');
    await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'false');
  });

  test('shows a chart zoom as a row that clears the whole filter', async ({ page }) => {
    await applyFilter(page, 'last 30 days');
    await page.getByRole('link', { name: /dashboard/i }).click();
    await page.waitForURL('/');
    const chart = page.getByRole('region', { name: 'Volume' }).locator('.recharts-surface');
    await chart.scrollIntoViewIfNeeded();
    const box = await chart.boundingBox();
    if (!box) {
      throw new Error('volume chart missing');
    }
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByTestId('zoom-reset-chip')).toBeVisible();

    await openFilterList(page);
    const zoomHint = filterList(page).getByText('Take a closer look?');
    const zoomRow = filterList(page).getByRole('button', { name: /^Remove filter: / });
    await expect(zoomHint).toHaveCount(0);
    await expect(zoomRow).toContainText(String(new Date().getFullYear()));
    await expect(zoomRow).toHaveAttribute('aria-pressed', 'true');

    const input = page.getByLabel(/describe a filter/i);
    await input.fill('run');
    await expect(zoomRow).toHaveCount(0);
    await input.fill('');
    await zoomRow.click();
    await expect(page.getByTestId('zoom-reset-chip')).toHaveCount(0);
    await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(zoomRow).toHaveCount(0);
    await expect(zoomHint).toBeVisible();
    await expect(
      filterList(page).getByRole('button', { name: 'last 30 days', exact: true }),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(dockBadge(page)).toHaveCount(0);

    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    await openFilterList(page);
    await expect(filterList(page).getByRole('button').first()).toBeVisible();
    await expect(zoomHint).toHaveCount(0);
  });
});
