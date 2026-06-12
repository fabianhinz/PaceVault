import { test, expect, type Page } from '@playwright/test';
import { seedWithSessions } from './helpers/seed';

const DAY_MS = 24 * 60 * 60 * 1000;

// The dock renders filter buttons in both mini (reveal panel) and maxi modes.
// When dockExpanded is true both exist in the DOM — the mini ones are hidden
// via opacity-0 but Playwright still considers them visible. The maxi buttons
// are rendered after the reveal panel in DOM order, so .last() targets them.
const dockButton = (page: Page, name: RegExp) =>
  page.locator('[data-layout="dock"]').getByRole('button', { name }).last();

// When a filter panel opens it gets `pointer-events-auto`. The closed panel
// keeps `pointer-events-none`. Both sport and time panels have an "All" radio,
// so we scope radio selections to the currently interactive panel.
const openPanelRadio = (page: Page, name: RegExp) =>
  page.locator('[data-layout="dock"] .pointer-events-auto').getByRole('radio', { name });

test.describe('Dock filters', () => {
  test.describe('sport filter', () => {
    test.beforeEach(async ({ page }) => {
      const now = Date.now();
      await seedWithSessions(page, [
        { sport: 'running', date: now - 1 * DAY_MS, name: 'Morning Run' },
        { sport: 'cycling', date: now - 2 * DAY_MS, name: 'Evening Ride' },
        { sport: 'running', date: now - 3 * DAY_MS, name: 'Tempo Run' },
      ]);
      await page.getByRole('link', { name: /sessions/i }).click();
      await page.waitForURL('/sessions');
    });

    test('shows all sessions by default', async ({ page }) => {
      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(3);
    });

    test('filter by cycling shows only cycling sessions', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /cycle/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Evening Ride');
    });

    test('filter by running shows only running sessions', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /run$/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(2);
    });

    test('switching back to all restores full list', async ({ page }) => {
      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /cycle/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(1);

      await dockButton(page, /sport filter/i).click();
      await openPanelRadio(page, /all/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(3);
    });
  });

  test.describe('time filter', () => {
    test.beforeEach(async ({ page }) => {
      const now = Date.now();
      await seedWithSessions(page, [
        { sport: 'running', date: now - 2 * DAY_MS, name: 'Recent Run' },
        { sport: 'cycling', date: now - 15 * DAY_MS, name: 'Mid Ride' },
        { sport: 'running', date: now - 60 * DAY_MS, name: 'Older Run' },
        { sport: 'cycling', date: now - 120 * DAY_MS, name: 'Old Ride' },
      ]);
      await page.getByRole('link', { name: /sessions/i }).click();
      await page.waitForURL('/sessions');
    });

    test('shows all sessions with "All" time filter', async ({ page }) => {
      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(4);
    });

    test('7d filter shows only sessions from last 7 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^7d$/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Recent Run');
    });

    test('30d filter shows sessions from last 30 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^30d$/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(2);
    });

    test('90d filter shows sessions from last 90 days', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^90d$/i).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(3);
    });

    test('switching back to all restores full list', async ({ page }) => {
      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^7d$/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(1);

      await dockButton(page, /time range filter/i).click();
      await openPanelRadio(page, /^all$/i).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(4);
    });
  });

  test.describe('attribute filter', () => {
    const openDialog = async (page: Page) => {
      await dockButton(page, /advanced filters/i).click();
      return page.getByRole('dialog');
    };

    const dockBadge = (page: Page) =>
      dockButton(page, /advanced filters/i).getByTestId('icon-badge');

    test.beforeEach(async ({ page }) => {
      const now = Date.now();
      await seedWithSessions(page, [
        {
          sport: 'running',
          date: now - 1 * DAY_MS,
          name: 'Short Run',
          duration: 1800,
          distance: 5000,
          elevationGain: 50,
        },
        {
          sport: 'running',
          date: now - 2 * DAY_MS,
          name: 'Target Run',
          duration: 3600,
          distance: 10000,
          elevationGain: 500,
        },
        {
          sport: 'cycling',
          date: now - 3 * DAY_MS,
          name: 'Long Ride',
          duration: 7200,
          distance: 30000,
          elevationGain: 1500,
        },
      ]);
      await page.getByRole('link', { name: /sessions/i }).click();
      await page.waitForURL('/sessions');
    });

    test('filters by fuzzy duration and shows a badge on the dock button', async ({ page }) => {
      await expect(dockBadge(page)).not.toBeVisible();

      const dialog = await openDialog(page);
      await dialog.getByLabel(/duration \(h\)/i).fill('1');
      await dialog.getByRole('button', { name: /apply/i }).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Target Run');
      await expect(dockBadge(page)).toBeVisible();
    });

    test('filters by fuzzy elevation gain', async ({ page }) => {
      const dialog = await openDialog(page);
      await dialog.getByLabel(/elevation gain \(m\)/i).fill('500');
      await dialog.getByRole('button', { name: /apply/i }).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Target Run');
    });

    test('filters by fuzzy distance via Enter key', async ({ page }) => {
      const dialog = await openDialog(page);
      await dialog.getByLabel(/distance \(km\)/i).fill('30');
      await dialog.getByLabel(/distance \(km\)/i).press('Enter');

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Long Ride');
    });

    test('accepts comma decimals', async ({ page }) => {
      const dialog = await openDialog(page);
      await dialog.getByLabel(/duration \(h\)/i).fill('1,0');
      await dialog.getByRole('button', { name: /apply/i }).click();

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(1);
      await expect(sessionLinks.first()).toContainText('Target Run');
    });

    test('disables apply on invalid input', async ({ page }) => {
      const dialog = await openDialog(page);
      await dialog.getByLabel(/duration \(h\)/i).fill('abc');
      await expect(dialog.getByRole('button', { name: /apply/i })).toBeDisabled();
    });

    test('reset restores the full list', async ({ page }) => {
      let dialog = await openDialog(page);
      await dialog.getByLabel(/duration \(h\)/i).fill('1');
      await dialog.getByRole('button', { name: /apply/i }).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(1);

      dialog = await openDialog(page);
      await dialog.getByRole('button', { name: /reset/i }).click();
      await expect(page.locator('[data-testid="session-item"]')).toHaveCount(3);
      await expect(dockBadge(page)).not.toBeVisible();
    });
  });
});
