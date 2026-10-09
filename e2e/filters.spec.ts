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

  test('applies a default filter, closes the list and clears it again', async ({ page }) => {
    await expect(sessionItems(page)).toHaveCount(4);
    await expect(dockBadge(page)).toHaveCount(0);

    await applyFilter(page, 'last 7 days');
    await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(sessionItems(page)).toHaveCount(1);
    await expect(sessionItems(page).first()).toContainText('Recent Run');
    await expect(dockBadge(page)).toBeVisible();

    await openFilterList(page);
    const active = filterList(page).getByRole('button', { name: 'last 7 days', exact: true });
    await expect(active).toHaveAttribute('aria-pressed', 'true');
    await active.click();
    await expect(sessionItems(page)).toHaveCount(4);
    await expect(dockBadge(page)).toHaveCount(0);
  });

  test('creates, edits and deletes a filter through the builder', async ({ page }) => {
    await openFilterList(page);
    await filterList(page)
      .getByRole('button', { name: /new filter/i })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/describe a filter/i).fill('run 30 days');
    await dialog
      .getByRole('button', { name: 'Apply filter: Running · last 30 days', exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(sessionItems(page)).toHaveCount(2);

    await openFilterList(page);
    const saved = filterList(page).getByRole('button', {
      name: 'Running · last 30 days',
      exact: true,
    });
    await expect(saved).toHaveAttribute('aria-pressed', 'true');

    await filterList(page)
      .getByRole('button', { name: 'Actions for Running · last 30 days' })
      .click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    const input = dialog.getByLabel(/edit filter/i);
    await expect(input).toHaveValue('Running · last 30 days');
    await input.fill('run 30 days 20 km');
    await dialog
      .getByRole('button', {
        name: 'Apply filter: Running · last 30 days · about 20 km',
        exact: true,
      })
      .click();
    await expect(sessionItems(page)).toHaveCount(1);
    await expect(sessionItems(page).first()).toContainText('Long Run');

    await openFilterList(page);
    await expect(saved).toHaveCount(0);
    await filterList(page)
      .getByRole('button', { name: 'Actions for Running · last 30 days · about 20 km' })
      .click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await expect(
      filterList(page).getByRole('button', {
        name: 'Running · last 30 days · about 20 km',
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(sessionItems(page)).toHaveCount(4);
  });

  test('opens the builder with the keyboard shortcut', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+k');
    const input = page.getByRole('dialog').getByLabel(/describe a filter/i);
    await expect(input).toBeFocused();
    await input.fill('bike');
    await input.press('Enter');
    await expect(sessionItems(page)).toHaveCount(2);
  });
});
