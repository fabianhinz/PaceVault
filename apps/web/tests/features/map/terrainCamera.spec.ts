import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { Map as MapLibreMap } from 'maplibre-gl';
import {
  DEM_SETTLE_TIMEOUT_MS,
  fitCorrection,
  fitGroundHeight,
  fitSamples,
  freeArea,
  screenBox,
  interpolateTerrainCamera,
  medianElevation,
  whenTerrainSettled,
  type TerrainCamera,
} from '@/features/map/terrainCamera.ts';

const start: TerrainCamera = {
  center: [8, 47],
  zoom: 10,
  pitch: 0,
  bearing: 350,
  elevation: 0,
};

const target: TerrainCamera = {
  center: [9, 48],
  zoom: 12,
  pitch: 30,
  bearing: 10,
  elevation: 1940,
};

const expectCamera = (actual: TerrainCamera, expected: TerrainCamera) => {
  expect(actual.center[0]).toBeCloseTo(expected.center[0], 9);
  expect(actual.center[1]).toBeCloseTo(expected.center[1], 9);
  expect(actual.zoom).toBeCloseTo(expected.zoom, 9);
  expect(actual.pitch).toBeCloseTo(expected.pitch, 9);
  expect(actual.bearing).toBeCloseTo(expected.bearing, 9);
  expect(actual.elevation).toBeCloseTo(expected.elevation, 9);
};

describe('interpolateTerrainCamera', () => {
  it('starts at the current camera and ends at the target', () => {
    expectCamera(interpolateTerrainCamera({ from: start, to: target, progress: 0 }), start);
    expectCamera(interpolateTerrainCamera({ from: start, to: target, progress: 1 }), target);
  });

  it('turns the short way round, from 350° through north to 10°', () => {
    const halfway = interpolateTerrainCamera({ from: start, to: target, progress: 0.5 });
    expect(halfway.bearing).toBeCloseTo(0, 9);
  });

  it('moves the centre linearly on screen while zooming in', () => {
    const halfway = interpolateTerrainCamera({ from: start, to: target, progress: 0.5 });
    expect(halfway.zoom).toBeCloseTo(11, 9);
    expect(halfway.center[0]).toBeCloseTo(8 + 2 / 3, 9);
  });

  it('tilts in place: same centre and zoom change only pitch and ground height', () => {
    const tilt: TerrainCamera = { ...start, pitch: 30, elevation: 820 };
    const halfway = interpolateTerrainCamera({ from: start, to: tilt, progress: 0.5 });
    expect(halfway.center).toEqual(start.center);
    expect(halfway.zoom).toBe(start.zoom);
    expect(halfway.bearing).toBe(start.bearing);
    expect(halfway.pitch).toBeCloseTo(15, 9);
    expect(halfway.elevation).toBeCloseTo(410, 9);
  });
});

describe('medianElevation', () => {
  it('keeps a recorded 0 m and skips missing heights', () => {
    expect(medianElevation([0, null, 0, 500])).toBe(0);
    expect(medianElevation([300, null, 120, 0])).toBe(120);
    expect(medianElevation([null, null])).toBeUndefined();
  });
});

describe('fitGroundHeight', () => {
  it('uses the queried terrain once the DEM has settled, also a flat 0 m', () => {
    expect(fitGroundHeight({ settled: true, terrain: 1960, median: 1800, current: 0 })).toBe(1960);
    expect(fitGroundHeight({ settled: true, terrain: 0, median: 1800, current: 400 })).toBe(0);
  });

  it('falls back to the median record height while the DEM has not settled', () => {
    expect(fitGroundHeight({ settled: false, terrain: 0, median: 1800, current: 400 })).toBe(1800);
  });

  it('keeps the current height without a median', () => {
    expect(fitGroundHeight({ settled: false, terrain: 0, median: undefined, current: 400 })).toBe(
      400,
    );
  });
});

interface StubDem {
  value: boolean;
  terrain?: string | null;
  source?: boolean;
}

const stubMap = (loaded: StubDem) => {
  const listeners = new Map<string, Set<() => void>>();
  const stub = {
    on: (type: string, listener: () => void) => {
      const set = listeners.get(type) ?? new Set<() => void>();
      set.add(listener);
      listeners.set(type, set);
    },
    off: (type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    },
    getTerrain: () => {
      if (loaded.terrain === null) return null;
      return { source: loaded.terrain ?? 'dem' };
    },
    getSource: () => {
      if (loaded.source === false) return undefined;
      return {};
    },
    isSourceLoaded: () => loaded.value,
  };
  const fire = (type: string) => {
    for (const listener of listeners.get(type) ?? []) listener();
  };
  return { map: stub as unknown as MapLibreMap, fire };
};

describe('whenTerrainSettled', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'Date',
        'setTimeout',
        'clearTimeout',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('settles at once when the DEM source is already loaded', async () => {
    const stub = stubMap({ value: true });
    await expect(
      whenTerrainSettled({ map: stub.map, timeout: DEM_SETTLE_TIMEOUT_MS }),
    ).resolves.toBe(true);
  });

  it('settles when a failed tile finishes the DEM source', async () => {
    const loaded = { value: false };
    const stub = stubMap(loaded);
    const settled = whenTerrainSettled({ map: stub.map, timeout: DEM_SETTLE_TIMEOUT_MS });
    loaded.value = true;
    stub.fire('error');
    await expect(settled).resolves.toBe(true);
  });

  it('settles on the DEM source loading after the terrain is set during the wait', async () => {
    const dem: StubDem = { value: false, terrain: null };
    const stub = stubMap(dem);
    const settled = whenTerrainSettled({ map: stub.map, timeout: DEM_SETTLE_TIMEOUT_MS });
    dem.terrain = 'terrain-dem';
    stub.fire('terrain');
    vi.advanceTimersByTime(DEM_SETTLE_TIMEOUT_MS / 2);
    dem.value = true;
    stub.fire('sourcedata');
    await expect(settled).resolves.toBe(true);
  });

  it('does not settle while the terrain source is not on the map', async () => {
    const stub = stubMap({ value: true, source: false });
    const settled = whenTerrainSettled({ map: stub.map, timeout: DEM_SETTLE_TIMEOUT_MS });
    stub.fire('sourcedata');
    vi.advanceTimersByTime(DEM_SETTLE_TIMEOUT_MS);
    await expect(settled).resolves.toBe(false);
  });

  it('gives up after the timeout while tiles are still loading', async () => {
    const stub = stubMap({ value: false });
    const settled = whenTerrainSettled({ map: stub.map, timeout: DEM_SETTLE_TIMEOUT_MS });
    vi.advanceTimersByTime(DEM_SETTLE_TIMEOUT_MS);
    await expect(settled).resolves.toBe(false);
  });
});

describe('screenBox', () => {
  it('bounds the projected points', () => {
    expect(
      screenBox([
        { x: 10, y: 40 },
        { x: 30, y: 5 },
        { x: -2, y: 12 },
      ]),
    ).toEqual({ minX: -2, minY: 5, maxX: 30, maxY: 40 });
  });

  it('gives no box for a point that cannot be projected or without points', () => {
    expect(
      screenBox([
        { x: 10, y: 40 },
        { x: Number.NaN, y: 5 },
      ]),
    ).toBeNull();
    expect(screenBox([{ x: Infinity, y: 5 }])).toBeNull();
    expect(screenBox([])).toBeNull();
  });
});

describe('fitCorrection', () => {
  const free = freeArea({
    width: 390,
    height: 844,
    padding: { top: 60, bottom: 384, left: 24, right: 24 },
  });

  const center: [number, number] = [195, 422];

  it('frames the free area left by the padding', () => {
    expect(free).toEqual({ minX: 24, minY: 60, maxX: 366, maxY: 460 });
  });

  it('zooms by log2 of the free size over the box size, limited by the tighter side', () => {
    const correction = fitCorrection({
      box: { minX: 24, minY: 60, maxX: 195, maxY: 160 },
      free,
      center,
    });
    expect(correction?.zoomDelta).toBeCloseTo(1, 9);
    const tooTall = fitCorrection({
      box: { minX: 100, minY: 0, maxX: 200, maxY: 800 },
      free,
      center,
    });
    expect(tooTall?.zoomDelta).toBeCloseTo(Math.log2(400 / 800), 9);
  });

  it('pans so the box centre lands on the free-area centre once zoomed about the canvas centre', () => {
    const correction = fitCorrection({
      box: { minX: 0, minY: 400, maxX: 100, maxY: 600 },
      free,
      center,
    });
    expect(correction?.zoomDelta).toBeCloseTo(1, 9);
    expect(correction?.offset).toEqual([-145, 159]);
  });

  it('pans straight onto the free-area centre when the size already fits', () => {
    const correction = fitCorrection({
      box: { minX: 24, minY: 300, maxX: 366, maxY: 400 },
      free,
      center,
    });
    expect(correction?.zoomDelta).toBeCloseTo(0, 9);
    expect(correction?.offset[0]).toBeCloseTo(0, 9);
    expect(correction?.offset[1]).toBeCloseTo(350 - 260, 9);
  });

  it('gives no correction for a box thrown far off screen behind the horizon', () => {
    expect(
      fitCorrection({ box: { minX: -1e7, minY: 0, maxX: 100, maxY: 100 }, free, center }),
    ).toBeNull();
  });
});

describe('fitSamples', () => {
  it('keeps short paths whole', () => {
    const path: [number, number][] = [
      [8, 47],
      [8.1, 47.1],
    ];
    expect(fitSamples(path)).toEqual(path);
  });

  it('thins long paths evenly and keeps the last point and the outermost points', () => {
    const path = Array.from({ length: 37_801 }, (_, index): [number, number] => [index, 0]);
    path[12_345] = [12_345, 0.5];
    path[23_457] = [23_457, -0.5];
    const samples = fitSamples(path);
    expect(samples.length).toBeLessThanOrEqual(70);
    expect(samples[0]).toEqual([0, 0]);
    expect(samples).toContainEqual([37_800, 0]);
    expect(samples).toContainEqual([12_345, 0.5]);
    expect(samples).toContainEqual([23_457, -0.5]);
  });
});
