import { test, expect, type Page } from './helpers/test';
import { seedOnboardingComplete, CYCLING_FIT, RUNNING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';

test.use({
  launchOptions: {
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  },
});

const SCAN_STEP = 30;
const MAP_EDGE = { x: 5, y: 5 };

const pointerState = (page: Page, point: { x: number; y: number }) =>
  page.evaluate(async (p) => {
    const mapFocus = await import('/src/store/mapFocus.ts');
    const element = document.elementFromPoint(p.x, p.y);
    let cursor: string | null = null;
    if (element) cursor = getComputedStyle(element).cursor;
    return { pickCircle: mapFocus.useMapFocusStore.getState().pickCircle !== null, cursor };
  }, point);

const findPickableTrack = async (page: Page) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('no viewport');
  for (let y = SCAN_STEP; y < viewport.height; y += SCAN_STEP) {
    for (let x = SCAN_STEP; x < viewport.width; x += SCAN_STEP) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(40);
      const state = await pointerState(page, { x, y });
      if (state.pickCircle) return { x, y };
    }
  }
  throw new Error('no pickable track under any scanned point');
};

const expectPointerOnlyOverTrack = async (page: Page) => {
  const hit = await findPickableTrack(page);
  await expect.poll(() => pointerState(page, hit)).toEqual({ pickCircle: true, cursor: 'pointer' });

  await page.mouse.move(MAP_EDGE.x, MAP_EDGE.y);
  await expect
    .poll(() => pointerState(page, MAP_EDGE))
    .toEqual({ pickCircle: false, cursor: 'grab' });
};

test.describe('map hover', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
  });

  test('map shows a pointer cursor over a pickable track', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await expectPointerOnlyOverTrack(page);
  });

  test('session map shows a pointer cursor over the track while laps are on', async ({ page }) => {
    await page.goto('/sessions');
    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('laps-pill')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(3000);
    await expectPointerOnlyOverTrack(page);
  });

  test('track click opens the picker popover at the click point', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const hit = await findPickableTrack(page);
    await page.mouse.click(hit.x, hit.y);

    const popover = page.locator('[data-radix-popper-content-wrapper]').getByRole('dialog');
    await expect(popover).toContainText('Sessions recorded near this location');
    await page.waitForTimeout(300);
    const box = await popover.boundingBox();
    if (!box) throw new Error('picker not rendered');
    const nearX = Math.min(Math.abs(box.x - hit.x), Math.abs(box.x + box.width - hit.x));
    const nearY = Math.min(Math.abs(box.y - hit.y), Math.abs(box.y + box.height - hit.y));
    expect(nearX).toBeLessThanOrEqual(8);
    expect(nearY).toBeLessThanOrEqual(8);

    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
  });
});
