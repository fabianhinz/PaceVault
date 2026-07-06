import { test, expect } from '@playwright/test';
import { seedWithSessions, seedTrips } from './helpers/seed';

test.describe('Trips', () => {
  test('shows a seeded trip with stats, expands it, and deletes it', async ({ page }) => {
    const ids = await seedWithSessions(page, [
      { sport: 'running', date: Date.now(), name: 'Morning Run', distance: 10000, duration: 3600 },
      { sport: 'cycling', date: Date.now() - 86400000, name: 'Hill Ride' },
    ]);
    await seedTrips(page, [{ name: 'Weekend Tour', sessionIds: [ids[0]] }]);

    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    await page.getByRole('tab', { name: /trips/i }).click();

    // Trip card shows its aggregated stats (count + distance + time)
    const tripCard = page.getByRole('button', { name: 'Weekend Tour' });
    await expect(tripCard).toBeVisible();
    await expect(tripCard).toContainText('1 session');
    await expect(tripCard).toContainText('10.0 km');

    // Expand → the member session is revealed
    await tripCard.click();
    await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible({
      timeout: 10_000,
    });

    // Delete the trip via the ellipsis menu + confirmation dialog
    await page.getByRole('button', { name: /trip actions/i }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await expect(page.getByText(/your sessions stay/i)).toBeVisible();
    await page.getByRole('button', { name: /^delete$/i }).click();

    // Trip is gone; the create CTA remains
    await expect(page.getByText('Weekend Tour')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /create a trip/i })).toBeVisible();
  });

  test('creates a trip from the CTA by naming it and selecting sessions', async ({ page }) => {
    await seedWithSessions(page, [
      { sport: 'running', date: Date.now(), name: 'Morning Run', distance: 10000, duration: 3600 },
      { sport: 'cycling', date: Date.now() - 86400000, name: 'Hill Ride' },
    ]);

    await page.getByRole('link', { name: /sessions/i }).click();
    await page.waitForURL('/sessions');
    await page.getByRole('tab', { name: /trips/i }).click();

    // Open the create dialog from the CTA
    await page.getByRole('button', { name: /create a trip/i }).click();

    // Name it and pick a session
    await page.getByPlaceholder(/trip name/i).fill('Alps 2026');
    await page.getByRole('button', { name: /morning run/i }).click();
    await page.getByRole('button', { name: /^save$/i }).click();

    // The new trip appears with its stats
    const tripCard = page.getByRole('button', { name: 'Alps 2026' });
    await expect(tripCard).toBeVisible();
    await expect(tripCard).toContainText('1 session');
  });
});
