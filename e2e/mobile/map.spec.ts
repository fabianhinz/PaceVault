import { test, expect, type Page } from '../helpers/test';
import { seedOnboardingComplete, seedWithSessions } from '../helpers/seed';

const sheet = (page: Page) => page.locator('[data-sheet-position]');

const handle = (page: Page) => sheet(page).locator('[data-sheet-handle]');

const sheetScroller = (page: Page) => page.locator('[data-layout="main"]').locator('..');

const dragHandle = async (page: Page, target: { by?: number; toY?: number }) => {
  const box = await handle(page).boundingBox();
  if (!box) throw new Error('handle not rendered');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, target.toY ?? y + (target.by ?? 0), { steps: 20 });
  await page.waitForTimeout(200);
  await page.mouse.up();
};

const persistedPosition = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number | undefined>((resolve) => {
        const openReq = indexedDB.open('endurance-tracker');
        openReq.onsuccess = () => {
          const getReq = openReq.result.transaction('kv').objectStore('kv').get('store-layout');
          getReq.onsuccess = () => {
            openReq.result.close();
            resolve(JSON.parse(getReq.result ?? '{}').state?.mobileSheetPosition);
          };
        };
      }),
  );

test.describe('mobile bottom sheet', () => {
  test.describe('positioning', () => {
    test.beforeEach(async ({ page }) => {
      await seedOnboardingComplete(page);
    });

    test('opens in the middle by default', async ({ page }) => {
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.50');
    });

    test('tapping the handle flips to the farther end', async ({ page }) => {
      await handle(page).click();
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');
      await expect(handle(page)).toHaveAttribute('aria-label', 'Collapse panel');

      await handle(page).click();
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');
      await expect(handle(page)).toHaveAttribute('aria-label', 'Expand panel');
    });

    test('dragging leaves the sheet where it is released and survives a reload', async ({
      page,
    }) => {
      await dragHandle(page, { by: 120 });

      await expect
        .poll(async () => {
          const position = await persistedPosition(page);
          return position !== undefined && position > 0.05 && position < 0.45;
        })
        .toBe(true);
      const dragged = await sheet(page).getAttribute('data-sheet-position');

      await page.reload();
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', dragged ?? '');
    });

    test('dragging past either end stops at full or peek', async ({ page }) => {
      await dragHandle(page, { toY: 0 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');

      await dragHandle(page, { toY: 840 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');
    });

    test('a release inside the fade zone settles on the more visible layer', async ({ page }) => {
      await dragHandle(page, { toY: 840 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');

      await dragHandle(page, { by: -20 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');

      await dragHandle(page, { by: -70 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.15');
    });
  });

  test.describe('content', () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const sessions = Array.from({ length: 40 }, (_, i) => ({
      sport: 'running' as const,
      date: now - (i + 1) * day,
      name: `Seed run ${i + 1}`,
    }));

    test.beforeEach(async ({ page }) => {
      await seedWithSessions(page, sessions);
    });

    test('swaps the content for a summary at peek and back when dragged up', async ({ page }) => {
      const peek = page.locator('[data-sheet-peek]');
      await dragHandle(page, { toY: 840 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');

      await expect(peek).toContainText('Dashboard');
      await expect(peek).toContainText('Current Form');
      await expect(peek).toHaveCSS('opacity', '1');
      await expect(sheetScroller(page)).toHaveCSS('opacity', '0');

      await dragHandle(page, { toY: 0 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');
      await expect(peek).toHaveCSS('opacity', '0');
      await expect(sheetScroller(page)).toHaveCSS('opacity', '1');
    });

    test('shows a divider under the grabber only once the content is scrolled past a nudge', async ({
      page,
    }) => {
      const divider = page.locator('[data-sheet-divider]');
      await expect(page.getByText('Total Distance')).toBeVisible();
      await expect(divider).toHaveCSS('opacity', '0');

      await sheetScroller(page).evaluate((el) => el.scrollTo({ top: 6 }));
      await page.waitForTimeout(300);
      await expect(divider).toHaveCSS('opacity', '0');

      await sheetScroller(page).evaluate((el) => el.scrollTo({ top: 200 }));
      await expect(divider).toHaveCSS('opacity', '1');

      await sheetScroller(page).evaluate((el) => el.scrollTo({ top: 0 }));
      await expect(divider).toHaveCSS('opacity', '0');
    });

    test('renders session rows past the first screen inside the sheet', async ({ page }) => {
      await page.getByRole('link', { name: /sessions/i }).click();
      await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible();

      await sheetScroller(page).evaluate((el) => el.scrollTo({ top: el.scrollHeight }));

      await expect(page.locator('[data-index="39"]')).toBeVisible();
    });
  });
});
