import type { Locator, Page } from '@playwright/test';
import { test, expect } from './helpers/test';
import { closeImportSummary } from './helpers/upload';

const MATCHING_TIMEOUT_MS = 90_000;

const openRunningSession = async (page: Page) => {
  await page.getByRole('link', { name: /sessions/i }).click();
  await page.waitForURL('/sessions');
  await page.locator('[data-testid="session-item"]').filter({ hasText: /run/i }).first().click();
  await page.waitForURL(/\/sessions\/.+/);
};

const STABLE_LAYOUT_POLL_MS = 300;

const settledBox = async (locator: Locator) => {
  let previous = '';
  await expect
    .poll(
      async () => {
        await locator.scrollIntoViewIfNeeded();
        const current = JSON.stringify(await locator.boundingBox());
        const settled = current === previous;
        previous = current;
        return settled;
      },
      { intervals: [STABLE_LAYOUT_POLL_MS] },
    )
    .toBe(true);
  const box = await locator.boundingBox();
  if (!box) throw new Error('chart missing');
  return box;
};

const zoomHeartRateChart = async (page: Page) => {
  const chart = page.getByRole('region', { name: 'Heart Rate' }).locator('.recharts-surface');
  const box = await settledBox(chart);
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByTestId('zoom-reset-chip')).toBeVisible();
};

const openSegmentsTab = async (page: Page) => {
  await page.getByRole('link', { name: /dashboard/i }).click();
  await page.getByRole('tab', { name: 'Segments' }).click();
  await expect(page).toHaveURL(/\?tab=segments/);
};

test.describe('Segments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try demo data' }).click({ timeout: 15_000 });
    await closeImportSummary(page);
    await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30_000 });
  });

  test('a chart range becomes a segment with passes, and leaves with its session', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await openRunningSession(page);
    const sessionUrl = page.url();

    await zoomHeartRateChart(page);
    await page.getByRole('button', { name: 'Save as segment' }).click();
    const nameInput = page.getByRole('textbox', { name: 'Name' });
    await expect(nameInput).toHaveValue(/ · km \d/);
    const name = await nameInput.inputValue();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(/\/segments\//);
    await expect(page.getByTestId('segment-header')).toContainText(name);
    const strip = page.getByRole('group', { name: 'Passes' });
    await expect(strip).toBeVisible({ timeout: MATCHING_TIMEOUT_MS });
    await expect(page.getByTestId('segment-header')).toContainText(/\d+ passes/);
    const firstTile = strip.getByRole('button').first();
    await expect(firstTile).toHaveAttribute('aria-pressed', 'false');
    await firstTile.click();
    await expect(firstTile).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('selected-pass-item').getByRole('button').click();
    await expect(page).toHaveURL(/\/sessions\//);

    await page.goto(sessionUrl);
    await zoomHeartRateChart(page);
    await page.getByRole('button', { name: 'Save as segment' }).click();
    await expect(
      page.getByText(`A segment with nearly the same start and end exists: ${name}`),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await openSegmentsTab(page);
    await expect(page.getByTestId('segment-item').filter({ hasText: name })).toBeVisible({
      timeout: MATCHING_TIMEOUT_MS,
    });

    await page.goto(sessionUrl);
    await page.getByRole('button', { name: 'Session actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(
      page.getByText(`This also removes 1 segment created from it: "${name}"`),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.waitForURL('/sessions');

    await openSegmentsTab(page);
    await expect(page.getByText('No segments yet')).toBeVisible({ timeout: MATCHING_TIMEOUT_MS });
  });

  test('a whole session becomes a reference segment, renamed and deleted', async ({ page }) => {
    test.setTimeout(180_000);
    await openRunningSession(page);
    const sessionUrl = page.url();

    await page.getByRole('button', { name: 'Session actions' }).click();
    await page.getByRole('menuitem', { name: 'Use as reference segment' }).click();
    await expect(page.getByRole('textbox', { name: 'Name' })).not.toHaveValue('');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/segments\//);
    await expect(page.getByRole('group', { name: 'Passes' })).toBeVisible({
      timeout: MATCHING_TIMEOUT_MS,
    });

    await page.goto(sessionUrl);
    await page.getByRole('button', { name: 'Session actions' }).click();
    await page.getByRole('menuitem', { name: 'Open segment' }).click();
    await expect(page).toHaveURL(/\/segments\//);

    await page.getByRole('button', { name: 'Segment actions' }).click();
    await page.getByRole('menuitem', { name: 'Rename' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('Isar reference');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('segment-header')).toContainText('Isar reference');

    await page.getByRole('button', { name: 'Segment actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page).toHaveURL(/\?tab=segments/);
    await expect(page.getByText('No segments yet')).toBeVisible({ timeout: MATCHING_TIMEOUT_MS });
  });
});
