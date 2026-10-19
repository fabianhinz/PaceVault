// Copied to tools/workbench/backlog/<f>/review/capture.spec.ts for an item that changes the board
// (tools/workbench/site); PWA screens use capture-spec-template.ts. One test per review entry;
// `shoot` writes review/after/<name>.png (review/before/ with WB_SHOTS=before) at 1280×800 (a 1600×1000 layout, scaled 0.8).
// The board runs on http://localhost:4321: tools/workbench/playwright.review.config.ts starts it,
// or reuses the one the owner runs (`vp run workbench`). The board shows the real backlog, so
// pick items that exist and say which in the scene.
// Run: vp run workbench:capture -- tools/workbench/backlog/<f>/review
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';

const BOARD = 'http://localhost:4321/';

// The board needs ~1400px; lay it out at 1600×1000 and save at 0.8 scale, so the PNG is 1280×800 like the app shots.
test.use({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 0.8, colorScheme: 'dark' });

/** Finite animations done (dialog and popover transitions), then three frames. */
const settle = async (page: Page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
    for (let frame = 0; frame < 3; frame++) {
      await new Promise((done) => requestAnimationFrame(done));
    }
  });
};

const openBoard = async (page: Page) => {
  await page.goto(BOARD);
  await expect(page.locator('.wb-board')).toBeVisible();
  await settle(page);
};

/** The card's dialog, opened by a click on the card, on `tab` (mockup | plan | tech | review). */
const openDialog = async (page: Page, folder: string, tab: string) => {
  await page.locator(`.wb-card[data-item="${folder}"]`).click();
  const dialog = page.locator(`dialog#dlg-${folder}`);
  await expect(dialog).toBeVisible();
  await dialog.locator(`label.wb-tabs__${tab}`).click();
  await settle(page);
  return dialog;
};

/** review/<after|before>/<name>.png next to this spec: one element, or the page (`fullPage`). */
const shoot = async (page: Page, name: string, target?: Locator, fullPage = false) => {
  let round = 'after';
  if (process.env.WB_SHOTS === 'before') round = 'before';
  const outDir = resolve(dirname(test.info().file), round);
  mkdirSync(outDir, { recursive: true });
  const path = resolve(outDir, `${name}.png`);
  await page.mouse.move(2, 998);
  await settle(page);
  if (target) await target.screenshot({ path });
  else await page.screenshot({ path, fullPage });
};

test('the whole board', async ({ page }) => {
  await openBoard(page);
  await shoot(page, 'board', undefined, true);
});

test('one column', async ({ page }) => {
  await openBoard(page);
  await shoot(page, 'column-in-review', page.locator('.wb-col[data-col="in-review"]'));
});

test('a card and its dialog on the Plan tab', async ({ page }) => {
  await openBoard(page);
  // an item that exists on the board right now
  await shoot(page, 'card', page.locator('.wb-card[data-item="<folder>"]'));
  await openDialog(page, '<folder>', 'plan');
  await shoot(page, 'dialog-plan');
});
