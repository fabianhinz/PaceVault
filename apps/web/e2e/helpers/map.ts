import type { Page } from './test';

const SCAN_STEP = 30;

const mapLaunchOptions = () => {
  if (process.platform === 'darwin' && !process.env.CI) {
    return {
      channel: 'chromium',
      args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
    };
  }
  return {
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  };
};

export const MAP_LAUNCH_OPTIONS = mapLaunchOptions();

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

export const exposeMap = (page: Page) =>
  page.evaluate(() => {
    const element = document.querySelector('.maplibregl-map');
    if (!element) throw new Error('no map');
    const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber'));
    let fiber = fiberKey ? Reflect.get(element, fiberKey) : null;
    let mapRef = null;
    while (fiber && !mapRef) {
      const ref = fiber.memoizedProps?.ref ?? fiber.ref;
      if (ref?.current?.getMap) mapRef = ref.current;
      fiber = fiber.return;
    }
    if (!mapRef) throw new Error('no map ref');
    Reflect.set(window, '__mapRef', mapRef);
    Reflect.set(window, '__map', mapRef.getMap());
  });
