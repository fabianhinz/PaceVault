import type { Page } from './test';

const SCAN_STEP = 30;

export const SWIFTSHADER_LAUNCH_OPTIONS = {
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
};

export const pointerState = (page: Page, point: { x: number; y: number }) =>
  page.evaluate(async (p) => {
    const mapFocus = await import('/src/store/mapFocus.ts');
    const element = document.elementFromPoint(p.x, p.y);
    let cursor: string | null = null;
    if (element) cursor = getComputedStyle(element).cursor;
    return { pickCircle: mapFocus.useMapFocusStore.getState().pickCircle !== null, cursor };
  }, point);

export const findPickableTrack = async (page: Page) => {
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
