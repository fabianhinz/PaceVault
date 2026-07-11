import { test, expect, type Page } from '@playwright/test';
import { seedOnboardingComplete, seedCoachWithThresholdPace } from './helpers/seed';

// --- Constants ---

const DAY_MS = 24 * 60 * 60 * 1000;
const THRESHOLD_PACE = 270; // 4:30/km

// Fixed base timestamp so session dates are stable regardless of when tests run.
// March 4, 2026 is a Wednesday (index 2 from Monday).
const TODAY_MOCK = new Date('2026-03-04T00:00:00').getTime();

// --- Dataset builders ---

/**
 * 84 sessions at TSS=50 over the last 84 days.
 * At day 0 (today): CTL ≈ 42, ATL ≈ 43 → ACWR ≈ 1.03 (sweet-spot), TSB ≈ -1 (neutral).
 * Produces neutral template with no load guard.
 */
const steadyBaseline = () =>
  Array.from({ length: 84 }, (_, i) => ({
    sport: 'running' as const,
    date: TODAY_MOCK - (84 - i) * DAY_MS, // days -84 to -1
    tss: 50,
  }));

/**
 * 84 baseline sessions (TSS=50, days -91 to -8) + 7 spike sessions (TSS=200, days -7 to -1).
 * At day 0: ATL ≈ 126, CTL ≈ 66 → ACWR ≈ 1.9 (high-risk), TSB ≈ -60 (overload).
 * Triggers downgradeToRecoveryWeek → no threshold/vo2max workouts.
 */
const overloadSpike = () => [
  ...Array.from({ length: 84 }, (_, i) => ({
    sport: 'running' as const,
    date: TODAY_MOCK - (91 - i) * DAY_MS, // days -91 to -8
    tss: 50,
  })),
  ...Array.from({ length: 7 }, (_, i) => ({
    sport: 'running' as const,
    date: TODAY_MOCK - (7 - i) * DAY_MS, // days -7 to -1
    tss: 200,
  })),
];

// --- Locator helpers ---

const workoutCards = (page: Page) => page.locator('.flex.gap-2.overflow-x-auto > div');

const cardByTitle = (page: Page, title: string) => workoutCards(page).filter({ hasText: title });

const expansionPanel = (page: Page) => page.locator('div.mt-3.rounded-xl');

// --- Tests ---

test.describe('no threshold pace', () => {
  test.beforeEach(async ({ page }) => {
    await seedOnboardingComplete(page);
    await page.goto('/labs?tab=training');
    await page.waitForURL(/tab=training/);
  });

  test('shows Set Your Threshold Pace heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /set your threshold pace/i })).toBeVisible();
  });

  test('Go to Settings navigates to /settings', async ({ page }) => {
    await page.getByRole('link', { name: /go to settings/i }).click();
    await page.waitForURL('/settings');
  });
});

test.describe('no sessions (no-data plan)', () => {
  // No-data template: [rest, easy, rest, easy, easy, easy, easy]
  // Wednesday (index 2) = rest → no default expansion

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-03-04T12:00:00'));
    await seedCoachWithThresholdPace(page, THRESHOLD_PACE, []);
    await page.goto('/labs?tab=training');
    await page.waitForURL(/tab=training/);
  });

  test('renders 7 workout cards', async ({ page }) => {
    await expect(workoutCards(page)).toHaveCount(7);
  });

  test('no expansion panel visible by default when today is rest', async ({ page }) => {
    await expect(expansionPanel(page)).toHaveCount(0);
  });

  test('clicking a rest day card does not open expansion panel', async ({ page }) => {
    await cardByTitle(page, 'Rest Day').first().click();
    await expect(expansionPanel(page)).toHaveCount(0);
  });

  test('clicking an easy card opens the expansion panel', async ({ page }) => {
    await cardByTitle(page, '45min Easy').first().click();
    await expect(expansionPanel(page)).toContainText('45min Easy');
  });
});

test.describe('mature data (neutral plan)', () => {
  // Neutral template: [easy, threshold-intervals, recovery, tempo, easy, rest, long-run]
  // Wednesday (index 2) = recovery → "25min Recovery" auto-expanded by default

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-03-04T12:00:00'));
    await seedCoachWithThresholdPace(page, THRESHOLD_PACE, steadyBaseline());
    await page.goto('/labs?tab=training');
    await page.waitForURL(/tab=training/);
  });

  test('weekly plan subtitle is visible', async ({ page }) => {
    await expect(page.getByText(/Week of/)).toBeVisible();
  });

  test("today's recovery workout is expanded by default", async ({ page }) => {
    await expect(expansionPanel(page)).toContainText('25min Recovery');
  });

  test('threshold and long run cards are present', async ({ page }) => {
    await expect(cardByTitle(page, '5x5min Threshold')).toBeVisible();
    await expect(cardByTitle(page, '90min Long Run')).toBeVisible();
  });

  test('clicking threshold card opens panel with interval fieldset and step labels', async ({
    page,
  }) => {
    await cardByTitle(page, '5x5min Threshold').click();
    const panel = expansionPanel(page);
    await expect(panel.locator('fieldset')).toContainText('5×');
    await expect(panel).toContainText('Warm-up');
    await expect(panel).toContainText('Run');
    await expect(panel).toContainText('Recovery');
    await expect(panel).toContainText('Cool-down');
  });

  test('clicking already-expanded card collapses the panel', async ({ page }) => {
    await expect(expansionPanel(page)).toBeVisible();
    await cardByTitle(page, '25min Recovery').click();
    await expect(expansionPanel(page)).toHaveCount(0);
  });

  test('clicking a different card switches expansion panel content', async ({ page }) => {
    await expect(expansionPanel(page)).toContainText('25min Recovery');
    await cardByTitle(page, '90min Long Run').click();
    await expect(expansionPanel(page)).toContainText('90min Long Run');
  });

  test('close button dismisses the panel', async ({ page }) => {
    await expect(expansionPanel(page)).toBeVisible();
    await page.getByRole('button', { name: /close/i }).click();
    await expect(expansionPanel(page)).toHaveCount(0);
  });
});

test.describe('overload plan (load guard)', () => {
  // TSS spike → ACWR > 1.5 → downgradeToRecoveryWeek → no threshold/vo2max workouts

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-03-04T12:00:00'));
    await seedCoachWithThresholdPace(page, THRESHOLD_PACE, overloadSpike());
    await page.goto('/labs?tab=training');
    await page.waitForURL(/tab=training/);
  });

  test('no high-intensity cards visible after load guard downgrade', async ({ page }) => {
    await expect(cardByTitle(page, '5x5min Threshold')).toHaveCount(0);
    await expect(cardByTitle(page, '5x3min VO2max')).toHaveCount(0);
  });
});
