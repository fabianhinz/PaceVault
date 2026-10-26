import {
  LngLat,
  Point,
  type CameraForBoundsOptions,
  type LngLatLike,
  type Map as MapLibreMap,
} from 'maplibre-gl';
import type { GPSBounds } from '@pacevault/engine/types.ts';
import type { MapPadding } from './fitPadding.ts';
import { MS_PER_SECOND } from '@pacevault/engine/time.ts';

type FitTransform = MapLibreMap['transform'];
type Terrain = MapLibreMap['terrain'];

export const ENTRY_PITCH = 30;
export const DEM_SETTLE_TIMEOUT_MS = 500;
export const LAP_FIT_DURATION_MS = 800;
export const SESSION_FIT_DURATION_MS = 1.2 * MS_PER_SECOND;
export const TILT_DURATION_MS = 800;

export const ORBIT_DRAG_THRESHOLD_PX = 3;
const ORBIT_DEGREES_PER_PIXEL = 0.4;
const ORBIT_PITCH_PER_PIXEL = 0.3;
const ORBIT_ANCHOR_STEPS = 3;
const ORBIT_ANCHOR_TOLERANCE_PX = 0.3;
const ORBIT_MAX_CENTER_DISTANCE_M = 20_000;

const FULL_TURN = 360;
const HALF_TURN = 180;
const SAME_ZOOM_EPSILON = 1e-3;
const SETTLE_EVENTS = ['sourcedata', 'error', 'terrain', 'idle'] as const;
const FIT_ITERATIONS = 3;
const FIT_SAMPLE_POINTS = 64;
const FIT_ZOOM_EPSILON = 0.005;
const FIT_PAN_EPSILON_PX = 0.5;
const FIT_MAX_SCREEN_FACTOR = 50;

export interface TerrainCamera {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  elevation: number;
}

export interface ScreenBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface FitCorrection {
  zoomDelta: number;
  offset: [number, number];
}

export interface OrbitDrag {
  startX: number;
  startY: number;
  point: [number, number];
  pivot: LngLat;
  bearing: number;
  pitch: number;
}

const easeInOutCubic = (progress: number): number => {
  if (progress < 0.5) return 4 * progress ** 3;
  return 1 - (-2 * progress + 2) ** 3 / 2;
};

const normalizeBearing = (bearing: number): number =>
  ((bearing % FULL_TURN) + FULL_TURN) % FULL_TURN;

const shortBearingDelta = (from: number, to: number): number =>
  ((((to - from) % FULL_TURN) + FULL_TURN + HALF_TURN) % FULL_TURN) - HALF_TURN;

const screenLinearWeight = ({ zoomDelta, eased }: { zoomDelta: number; eased: number }): number => {
  if (Math.abs(zoomDelta) < SAME_ZOOM_EPSILON) return eased;
  return (1 - 2 ** (-zoomDelta * eased)) / (1 - 2 ** -zoomDelta);
};

const between = (from: number, to: number, factor: number): number => from + (to - from) * factor;

export const interpolateTerrainCamera = ({
  from,
  to,
  progress,
}: {
  from: TerrainCamera;
  to: TerrainCamera;
  progress: number;
}): TerrainCamera => {
  const eased = easeInOutCubic(progress);
  const weight = screenLinearWeight({ zoomDelta: to.zoom - from.zoom, eased });
  return {
    center: [
      between(from.center[0], to.center[0], weight),
      between(from.center[1], to.center[1], weight),
    ],
    zoom: between(from.zoom, to.zoom, eased),
    pitch: between(from.pitch, to.pitch, eased),
    bearing: normalizeBearing(from.bearing + shortBearingDelta(from.bearing, to.bearing) * eased),
    elevation: between(from.elevation, to.elevation, eased),
  };
};

export const medianElevation = (elevations: Array<number | null>): number | undefined => {
  const recorded = elevations
    .filter((elevation): elevation is number => elevation !== null)
    .sort((a, b) => a - b);
  return recorded[Math.floor(recorded.length / 2)];
};

export const fitGroundHeight = ({
  settled,
  terrain,
  median,
  current,
}: {
  settled: boolean;
  terrain: number | null;
  median: number | undefined;
  current: number;
}): number => {
  if (settled && terrain !== null) return terrain;
  if (median !== undefined) return median;
  return current;
};

const isTerrainLoaded = (map: MapLibreMap): boolean => {
  const terrain = map.getTerrain();
  if (terrain === null) return false;
  if (map.getSource(terrain.source) === undefined) return false;
  return map.isSourceLoaded(terrain.source);
};

export const whenTerrainSettled = ({
  map,
  timeout,
}: {
  map: MapLibreMap;
  timeout: number;
}): Promise<boolean> =>
  new Promise((resolve) => {
    let done = false;
    let frame = 0;
    const finish = (settled: boolean) => {
      done = true;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      for (const event of SETTLE_EVENTS) map.off(event, check);
      resolve(settled);
    };
    const check = () => {
      if (!done && isTerrainLoaded(map)) finish(true);
    };
    const loop = () => {
      check();
      if (!done) frame = requestAnimationFrame(loop);
    };
    const timer = setTimeout(() => finish(false), timeout);
    for (const event of SETTLE_EVENTS) map.on(event, check);
    loop();
  });

const toLngLatTuple = (lngLat: LngLatLike): [number, number] => {
  if (Array.isArray(lngLat)) return [lngLat[0], lngLat[1]];
  if ('lng' in lngLat) return [lngLat.lng, lngLat.lat];
  return [lngLat.lon, lngLat.lat];
};

const currentCamera = (map: MapLibreMap): TerrainCamera => ({
  center: toLngLatTuple(map.getCenter()),
  zoom: map.getZoom(),
  pitch: map.getPitch(),
  bearing: map.getBearing(),
  elevation: map.getCenterElevation(),
});

const groundHeightAt = ({
  map,
  center,
  median,
  settled,
}: {
  map: MapLibreMap;
  center: [number, number];
  median: number | undefined;
  settled: boolean;
}): number =>
  fitGroundHeight({
    settled,
    terrain: map.queryTerrainElevation(center),
    median,
    current: map.getCenterElevation(),
  });

export const screenBox = (points: Array<{ x: number; y: number }>): ScreenBox | null => {
  if (points.length === 0) return null;
  const box: ScreenBox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    box.minX = Math.min(box.minX, point.x);
    box.minY = Math.min(box.minY, point.y);
    box.maxX = Math.max(box.maxX, point.x);
    box.maxY = Math.max(box.maxY, point.y);
  }
  return box;
};

export const freeArea = ({
  width,
  height,
  padding,
}: {
  width: number;
  height: number;
  padding: MapPadding;
}): ScreenBox => ({
  minX: padding.left,
  minY: padding.top,
  maxX: width - padding.right,
  maxY: height - padding.bottom,
});

export const fitCorrection = ({
  box,
  free,
  center,
}: {
  box: ScreenBox;
  free: ScreenBox;
  center: [number, number];
}): FitCorrection | null => {
  const reach = FIT_MAX_SCREEN_FACTOR * Math.max(free.maxX, free.maxY);
  if (Math.max(-box.minX, -box.minY, box.maxX, box.maxY) > reach) return null;
  const boxWidth = Math.max(box.maxX - box.minX, 1);
  const boxHeight = Math.max(box.maxY - box.minY, 1);
  const scale = Math.min((free.maxX - free.minX) / boxWidth, (free.maxY - free.minY) / boxHeight);
  const zoomDelta = Math.log2(scale);
  if (!Number.isFinite(zoomDelta)) return null;
  return {
    zoomDelta,
    offset: [
      (box.minX + box.maxX) / 2 - center[0] - ((free.minX + free.maxX) / 2 - center[0]) / scale,
      (box.minY + box.maxY) / 2 - center[1] - ((free.minY + free.maxY) / 2 - center[1]) / scale,
    ],
  };
};

const extremePoints = (path: [number, number][]): [number, number][] => {
  const extremes: [number, number][] = [];
  for (const axis of [0, 1] as const) {
    let low = path[0];
    let high = path[0];
    for (const point of path) {
      if (low === undefined || point[axis] < low[axis]) low = point;
      if (high === undefined || point[axis] > high[axis]) high = point;
    }
    if (low !== undefined && high !== undefined) extremes.push(low, high);
  }
  return extremes;
};

export const fitSamples = (path: [number, number][]): [number, number][] => {
  const stride = Math.max(1, Math.ceil(path.length / FIT_SAMPLE_POINTS));
  const spread = path.filter((_, index) => index % stride === 0 || index === path.length - 1);
  if (stride === 1) return spread;
  return [...spread, ...extremePoints(path)];
};

const transformAt = ({
  map,
  camera,
}: {
  map: MapLibreMap;
  camera: TerrainCamera;
}): FitTransform => {
  const transform = map.transform.clone();
  transform.setCenter(new LngLat(camera.center[0], camera.center[1]));
  transform.setZoom(camera.zoom);
  transform.setBearing(camera.bearing);
  transform.setPitch(camera.pitch);
  transform.setElevation(camera.elevation);
  return transform;
};

const correctedCamera = ({
  map,
  camera,
  points,
  free,
  terrain,
}: {
  map: MapLibreMap;
  camera: TerrainCamera;
  points: [number, number][];
  free: ScreenBox;
  terrain: Terrain | undefined;
}): { camera: TerrainCamera; correction: FitCorrection } | null => {
  const transform = transformAt({ map, camera });
  const projected = points.map((point) =>
    transform.locationToScreenPoint(new LngLat(point[0], point[1]), terrain),
  );
  const box = screenBox(projected);
  if (box === null) return null;
  const middle: [number, number] = [transform.width / 2, transform.height / 2];
  const correction = fitCorrection({ box, free, center: middle });
  if (correction === null) return null;
  const pivot = new Point(middle[0] + correction.offset[0], middle[1] + correction.offset[1]);
  const center = transform.screenPointToLocation(pivot);
  if (!Number.isFinite(center.lng) || !Number.isFinite(center.lat)) return null;
  return {
    camera: {
      ...camera,
      center: [center.lng, center.lat],
      zoom: camera.zoom + correction.zoomDelta,
    },
    correction,
  };
};

const isConverged = (correction: FitCorrection): boolean =>
  Math.abs(correction.zoomDelta) < FIT_ZOOM_EPSILON &&
  Math.hypot(correction.offset[0], correction.offset[1]) < FIT_PAN_EPSILON_PX;

const pitchAwareFit = ({
  map,
  start,
  path,
  padding,
  maxZoom,
  ground,
  terrain,
}: {
  map: MapLibreMap;
  start: TerrainCamera;
  path: [number, number][];
  padding: MapPadding;
  maxZoom: number | undefined;
  ground: (center: [number, number]) => number;
  terrain: Terrain | undefined;
}): TerrainCamera => {
  const points = fitSamples(path);
  const free = freeArea({ width: map.transform.width, height: map.transform.height, padding });
  let camera = start;
  for (let step = 0; step < FIT_ITERATIONS && points.length > 0; step++) {
    const next = correctedCamera({ map, camera, points, free, terrain });
    if (next === null) return camera;
    camera = { ...next.camera, zoom: Math.min(next.camera.zoom, maxZoom ?? Infinity) };
    camera.elevation = ground(camera.center);
    if (isConverged(next.correction)) return camera;
  }
  return camera;
};

export const terrainFitTarget = ({
  map,
  bounds,
  path,
  pitch,
  bearing,
  padding,
  maxZoom,
  median,
  settled,
}: {
  map: MapLibreMap;
  bounds: GPSBounds;
  path: [number, number][];
  pitch: number;
  bearing: number;
  padding: MapPadding;
  maxZoom?: number;
  median: number | undefined;
  settled: boolean;
}): TerrainCamera | null => {
  const options: CameraForBoundsOptions = { padding, bearing };
  if (maxZoom !== undefined) options.maxZoom = maxZoom;
  const fit = map.cameraForBounds(
    [
      [bounds.minLng, bounds.minLat],
      [bounds.maxLng, bounds.maxLat],
    ],
    options,
  );
  if (fit?.center === undefined || fit.zoom === undefined) return null;
  const ground = (center: [number, number]) => groundHeightAt({ map, center, median, settled });
  const center = toLngLatTuple(fit.center);
  const start: TerrainCamera = {
    center,
    zoom: fit.zoom,
    pitch,
    bearing,
    elevation: ground(center),
  };
  let terrain: Terrain | undefined = undefined;
  if (settled && map.terrain !== null) terrain = map.terrain;
  return pitchAwareFit({ map, start, path, padding, maxZoom, ground, terrain });
};

export const terrainTiltTarget = ({
  map,
  pitch,
  median,
  settled,
}: {
  map: MapLibreMap;
  pitch: number;
  median: number | undefined;
  settled: boolean;
}): TerrainCamera => {
  const current = currentCamera(map);
  return {
    center: current.center,
    zoom: current.zoom,
    pitch,
    bearing: current.bearing,
    elevation: groundHeightAt({ map, center: current.center, median, settled }),
  };
};

export const easeTerrainCamera = ({
  map,
  target,
  duration,
  onEnd,
}: {
  map: MapLibreMap;
  target: TerrainCamera;
  duration: number;
  onEnd?: () => void;
}): (() => void) => {
  const from = currentCamera(map);
  const start = performance.now();
  let running = true;
  let frame = 0;
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
    map.off('movestart', onMoveStart);
    map.setCenterClampedToGround(true);
  };
  const cancel = () => {
    if (running) stop();
  };
  const onMoveStart = (event: { originalEvent?: unknown }) => {
    if (event.originalEvent !== undefined) cancel();
  };
  const step = (now: number) => {
    if (!running) return;
    const progress = Math.min(1, Math.max(0, (now - start) / duration));
    map.jumpTo(interpolateTerrainCamera({ from, to: target, progress }));
    if (progress < 1) {
      frame = requestAnimationFrame(step);
      return;
    }
    stop();
    onEnd?.();
  };
  map.setCenterClampedToGround(false);
  map.on('movestart', onMoveStart);
  frame = requestAnimationFrame(step);
  return cancel;
};

const anchorPivot = ({ map, drag }: { map: MapLibreMap; drag: OrbitDrag }) => {
  for (let step = 0; step < ORBIT_ANCHOR_STEPS; step++) {
    const projected = map.project(drag.pivot);
    const offsetX = projected.x - drag.point[0];
    const offsetY = projected.y - drag.point[1];
    if (Math.hypot(offsetX, offsetY) < ORBIT_ANCHOR_TOLERANCE_PX) return;
    map.panBy([offsetX, offsetY], { duration: 0 });
  }
};

export const orbitCamera = ({
  map,
  drag,
  dx,
  dy,
}: {
  map: MapLibreMap;
  drag: OrbitDrag;
  dx: number;
  dy: number;
}): void => {
  const lastGood = currentCamera(map);
  const pitch = Math.min(map.getMaxPitch(), Math.max(0, drag.pitch - dy * ORBIT_PITCH_PER_PIXEL));
  map.jumpTo({ bearing: drag.bearing + dx * ORBIT_DEGREES_PER_PIXEL, pitch });
  anchorPivot({ map, drag });
  if (map.getCenter().distanceTo(drag.pivot) <= ORBIT_MAX_CENTER_DISTANCE_M) return;
  map.jumpTo({
    center: lastGood.center,
    zoom: lastGood.zoom,
    bearing: lastGood.bearing,
    pitch: lastGood.pitch,
  });
};
