// Review capture for workbench-flow (from .claude/skills/item-review/references/board-capture-template.ts).
// One scene: the Idea column with a `size: small` card (fixture/fix-typo) next to a normal card
// (fixture/split-chart). The real backlog has no small item, so the board must read the fixture
// backlog next to this spec: start the capture with WB_ROOT set to its absolute path, and with no
// board running on 4321 (a running board is reused and shows the real backlog; the guard below fails then).
// Before (source unchanged, the schema strips `size:`, both cards alike):
//   WB_ROOT="$PWD/tools/workbench/backlog/workbench-flow/review/fixture" WB_SHOTS=before vp run workbench:capture -- tools/workbench/backlog/workbench-flow/review
// After (the small card tinted and outlined): the same without WB_SHOTS=before.
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

const board = (page: Page) => page.locator('main[aria-label="Board"]');

/** The board is a client-only React island: wait for it and its first card. */
const openBoard = async (page: Page) => {
  await page.goto(BOARD);
  await expect(board(page).locator('[data-item]').first()).toBeVisible();
  await settle(page);
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

test('a small card next to a normal card in the Idea column', async ({ page }) => {
  // The board server inherits WB_ROOT from this run; it must point at the fixture next to this spec.
  const fixture = resolve(dirname(test.info().file), 'fixture');
  expect(process.env.WB_ROOT, 'run with WB_ROOT set to the fixture backlog').toBe(fixture);
  await openBoard(page);
  // A board the owner already runs is reused and reads the real backlog: stop it first.
  await expect(board(page).locator('[data-item]')).toHaveCount(2);
  const column = board(page).locator('section[aria-label="Idea"]');
  await expect(column.locator('[data-item="fix-typo"]')).toBeVisible();
  await expect(column.locator('[data-item="split-chart"]')).toBeVisible();
  await shoot(page, 'column-small-card', column);
});
