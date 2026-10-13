import { test, expect, type Page } from './helpers/test';
import { SWIFTSHADER_LAUNCH_OPTIONS, findPickableTrack, pointerState } from './helpers/map';
import { seedOnboardingComplete, CYCLING_FIT, RUNNING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';

test.use({ launchOptions: SWIFTSHADER_LAUNCH_OPTIONS });

const MAP_EDGE = { x: 5, y: 5 };

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
