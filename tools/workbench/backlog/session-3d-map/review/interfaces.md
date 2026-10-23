# Interfaces · session-3d-map

Generated 2026-10-23 by `vp run workbench:deps -- session-3d-map` from the TypeScript files changed since the base (as `files.json`): 30 planned, 8 not planned. The checker's types; compare with tech.md `## Interfaces`, the planned record.

```ts
// apps/web/e2e/map.spec.ts
// no exports
```

```ts
// apps/web/src/features/map/DeckGLOverlay.tsx
export const DeckGLOverlay: FC<DeckGLOverlayProps>;
```

```ts
// apps/web/src/features/map/MapBackground.tsx
export const MapBackground: () => JSX.Element;
```

```ts
// apps/web/src/features/map/SessionTerrain.tsx
export const SessionTerrain: FC<SessionTerrainProps>;
```

```ts
// apps/web/src/features/map/hooks/useMapCameraEffect.ts
export const useMapCameraEffect: ({ gpsData, tracks, lapPath, sessionPath, mapLoaded, }: {
  gpsData: SessionGPS[] | null;
  tracks: MapTrack[];
  lapPath: DetailPath | null;
  sessionPath: DetailPath | null;
  mapLoaded: boolean;
}) => void;
```

```ts
// apps/web/src/features/map/hooks/useMapTerrainEffect.ts
export const useMapTerrainEffect: () => void;
```

```ts
// apps/web/src/features/map/hooks/useTerrainHoverPointEffect.ts
export const useTerrainHoverPointEffect: () => void;
```

```ts
// apps/web/src/features/map/hooks/useTerrainLapStateEffect.ts
export const useTerrainLapStateEffect: ({ sourceId, detailPath, runs, }: {
  sourceId: string;
  detailPath: DetailPath | null;
  runs: TerrainLineRun[];
}) => void;
```

```ts
// apps/web/src/features/map/hooks/useTerrainLineEffect.ts
export const useTerrainLineEffect: ({ id, path, runs, colors, width, dimFactor, dimmed, onDrawn, }: {
  id: string;
  path: [number, number][];
  runs: TerrainLineRun[];
  colors: LineColor | LineColor[];
  width: TerrainLineWidths;
  dimFactor: number;
  dimmed: boolean;
  onDrawn?: () => void;
}) => void;
```

```ts
// apps/web/src/features/map/hooks/useTerrainOrbitEffect.ts
export const useTerrainOrbitEffect: () => void;
```

```ts
// apps/web/src/features/map/hooks/useTerrainTrackPickingEffect.ts
export const useTerrainTrackPickingEffect: ({ layerId, detailPath, }: { layerId: string; detailPath: DetailPath | null; }) => void;
```

```ts
// apps/web/src/features/map/lapPath.ts
export const dimmedColor: (color: Color | Color[], factor: number) => Color | Color[];
export const nearestRecordIndex: (detail: DetailPath, coordinate: [number, number]) => number | undefined;
export const lapVertexBounds: ({ detailPath, span, }: {
  detailPath: DetailPath;
  span: LapSpan;
}) => {
  first: number;
  last: number;
} | null;
export const lapVertexBreaks: ({ detailPath, spans, }: { detailPath: DetailPath; spans: LapSpan[]; }) => number[];
export const lapSubPath: (detail: DetailPath, span: LapSpan) => DetailPath | null;
export const pathBounds: (path: [number, number][]) => GPSBounds | null;
```

```ts
// apps/web/src/features/map/mapStyle.ts
export const MAP_MAXZOOM: 20;
export const terrainDemSource: RasterDEMSourceSpecification;
export const TERRAIN_HILLSHADE_PAINT: {
  "hillshade-illumination-direction"?: PropertyValueSpecification<NumberArraySpecification>;
  "hillshade-illumination-altitude"?: PropertyValueSpecification<NumberArraySpecification>;
  "hillshade-illumination-anchor"?: PropertyValueSpecification<"map" | "viewport">;
  "hillshade-exaggeration"?: PropertyValueSpecification<number>;
  "hillshade-exaggeration-transition"?: TransitionSpecification;
  "hillshade-shadow-color"?: PropertyValueSpecification<ColorArraySpecification>;
  "hillshade-shadow-color-transition"?: TransitionSpecification;
  "hillshade-highlight-color"?: PropertyValueSpecification<ColorArraySpecification>;
  "hillshade-highlight-color-transition"?: TransitionSpecification;
  "hillshade-accent-color"?: PropertyValueSpecification<ColorSpecification>;
  "hillshade-accent-color-transition"?: TransitionSpecification;
  "hillshade-method"?: PropertyValueSpecification<"standard" | "basic" | "combined" | "igor" | "multidirectional">;
};
export const styles: Record<"dark", StyleSpecification>;
```

```ts
// apps/web/src/features/map/terrainCamera.ts
export const ENTRY_PITCH: 30;
export const DEM_SETTLE_TIMEOUT_MS: 500;
export const LAP_FIT_DURATION_MS: 800;
export const SESSION_FIT_DURATION_MS: 1200;
export const TILT_DURATION_MS: 800;
export const ORBIT_DRAG_THRESHOLD_PX: 3;
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
export const interpolateTerrainCamera: ({ from, to, progress, }: {
  from: TerrainCamera;
  to: TerrainCamera;
  progress: number;
}) => TerrainCamera;
export const medianElevation: (elevations: Array<number | null>) => number | undefined;
export const fitGroundHeight: ({ settled, terrain, median, current, }: {
  settled: boolean;
  terrain: number | null;
  median: number | undefined;
  current: number;
}) => number;
export const whenTerrainSettled: ({ map, timeout, }: { map: MapLibreMap; timeout: number; }) => Promise<boolean>;
export const screenBox: (points: Array<{ x: number; y: number; }>) => ScreenBox | null;
export const freeArea: ({ width, height, padding, }: { width: number; height: number; padding: MapPadding; }) => ScreenBox;
export const fitCorrection: ({ box, free, center, }: {
  box: ScreenBox;
  free: ScreenBox;
  center: [number, number];
}) => FitCorrection | null;
export const fitSamples: (path: [number, number][]) => [number, number][];
export const terrainFitTarget: ({ map, bounds, path, pitch, bearing, padding, maxZoom, median, settled, }: {
  map: MapLibreMap;
  bounds: GPSBounds;
  path: [number, number][];
  pitch: number;
  bearing: number;
  padding: MapPadding;
  maxZoom?: number;
  median: number | undefined;
  settled: boolean;
}) => TerrainCamera | null;
export const terrainTiltTarget: ({ map, pitch, median, settled, }: {
  map: MapLibreMap;
  pitch: number;
  median: number | undefined;
  settled: boolean;
}) => TerrainCamera;
export const easeTerrainCamera: ({ map, target, duration, onEnd, }: {
  map: MapLibreMap;
  target: TerrainCamera;
  duration: number;
  onEnd?: () => void;
}) => (() => void);
export const orbitCamera: ({ map, drag, dx, dy, }: { map: MapLibreMap; drag: OrbitDrag; dx: number; dy: number; }) => void;
```

```ts
// apps/web/src/features/map/terrainLine.ts
export type LineColor = [number, number, number, number];
export interface TerrainLineRun {
  first: number;
  last: number;
}
export const EMPTY_TERRAIN_LINE: TerrainLineFeatureCollection;
export const terrainLineRuns: ({ path, colors, breaks, }: {
  path: [number, number][];
  colors: LineColor | LineColor[];
  breaks: number[];
}) => TerrainLineRun[];
export const buildTerrainLineFeatures: ({ path, runs, colors, dimFactor, }: {
  path: [number, number][];
  runs: TerrainLineRun[];
  colors: LineColor | LineColor[];
  dimFactor: number;
}) => TerrainLineFeatureCollection;
export const terrainLineRunIdsWithin: ({ runs, first, last, }: { runs: TerrainLineRun[]; first: number; last: number; }) => number[];
export const terrainHoverLine: (path: [number, number][] | null) => TerrainHoverFeature | TerrainLineFeatureCollection;
export const terrainLineWidthExpression: ({ metres, minPixels, latitude, }: {
  metres: number;
  minPixels: number;
  latitude: number;
}) => TerrainLineWidth;
export const nearestLineVertex: ({ path, ranges, coordinate, }: {
  path: [number, number][];
  ranges: TerrainLineRun[];
  coordinate: [number, number];
}) => number | undefined;
export const pickTerrainLineVertex: ({ map, layerId, point, radius, path, }: {
  map: MapLibreMap;
  layerId: string;
  point: [number, number];
  radius: number;
  path: [number, number][];
}) => number | undefined;
export const terrainLineHoverSourceId: (id: string) => string;
export const terrainLineLayerIds: (id: string) => { line: string; hover: string; casing: string; selected: string; };
```

```ts
// apps/web/src/features/map/zoneColoredPath.ts
export interface DetailPath {
  path: [number, number][];
  recordIndices: number[];
  color: Color | Color[];
  elevations: Array<number | null>;
}
export const buildZoneColoredPath: (records: SessionRecord[], metric: TrackMetric, scale: ColorScale) => DetailPath | null;
export const buildWindColoredPath: (records: SessionRecord[], angles: Array<number | undefined>) => DetailPath | null;
export const buildSportColoredPath: (records: SessionRecord[], sportColor: Color) => DetailPath | null;
```

```ts
// apps/web/src/features/sessions/session/MapViewControl.tsx
export const MapViewControl: FC;
```

```ts
// apps/web/src/features/sessions/session/SessionMapControls.tsx
export const SessionMapControls: (props: {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}) => JSX.Element;
```

```ts
// apps/web/src/lib/mapCamera.ts
export type MapCameraTarget =
  | { kind: 'overview' }
  | { kind: 'session'; sessionId: string; lapIndex: number | null; view: MapView }
  | { kind: 'trip'; tripKey: string }
  | { kind: 'studioTab' }
  | { kind: 'studioRoute'; routeId: string };
export type MapCameraFit =
  | 'overview'
  | 'session'
  | 'lap'
  | 'lapClose'
  | 'tilt'
  | 'flatten'
  | 'trip'
  | 'studio';
export interface MapCameraObservation {
  target: MapCameraTarget;
  visibleKey: string;
  visibleCount: number;
  filter: unknown;
  lapCloseCount: number;
  refitRequest: number;
  studioHasBounds: boolean;
  sessionDataBlocked: boolean;
  progressOverlayOpen: boolean;
}
export interface MapCameraState {
  target: MapCameraTarget | null;
  pending: MapCameraFit | null;
  initialDone: boolean;
  visibleKey: string;
  filter: unknown;
  lapCloseCount: number;
  refitRequest: number;
}
export const initialMapCameraState: MapCameraState;
export const nextMapCamera: (state: MapCameraState, obs: MapCameraObservation) => MapCameraState;
export const mapCameraFitBlocked: (fit: MapCameraFit, obs: MapCameraObservation) => boolean;
export const settleMapCameraFit: (state: MapCameraState) => MapCameraState;
export const sessionMinZoom: ({ fitZoom, currentZoom, }: { fitZoom: number; currentZoom: number; }) => number;
```

```ts
// apps/web/src/microcopy/mapView.ts
export const LABEL_BY_MAP_VIEW: Record<MapView, () => string>;
export const DESCRIPTION_BY_MAP_VIEW: Record<MapView, () => string>;
```

```ts
// apps/web/src/store/mapControls.ts
export const MAP_VIEWS: readonly ["2d", "3d"];
export type MapView = (typeof MAP_VIEWS)[number];
export const useMapControlsStore: UseBoundStore<WithImmer<StoreApi<MapControlsState>>>;
```

```ts
// apps/web/tests/features/map/lapPath.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/terrainCamera.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/terrainLine.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/zoneColoredPath.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/mapCamera.spec.ts
// no exports
```

```ts
// apps/web/tests/store/mapControls.spec.ts
// no exports
```

```ts
// apps/web/vite.config.ts
export default UserConfig;
```

```ts
// packages/testing/src/records.ts
export const makeCyclingRecords: (count: number, options?: { basePower?: number; baseHr?: number; }) => SessionRecord[];
export const makeRunningRecords: (count: number, options?: { baseSpeed?: number; baseHr?: number; }) => SessionRecord[];
export const makeLaps: (count: number) => SessionLap[];
export const makeLapsFromRecords: (records: SessionRecord[], lapDurationSec?: number) => SessionLap[];
export const makeInvalidRecords: (type: "highHr" | "highPower" | "zeroHr") => SessionRecord[];
export const createMockSessionRecord: (overrides?: Partial<SessionRecord>) => SessionRecord;
```

```ts
// packages/ui/src/lib/tokens.ts
export const tokens: {
  readonly surfaceSunken: "#0a0b0f";
  readonly surface: "#111318";
  readonly surfaceElevated: "#1a1d24";
  readonly surfaceOverlay: "#252830";
  readonly border: "#252830";
  readonly textPrimary: "#e5e7eb";
  readonly textSecondary: "#b0b4be";
  readonly textTertiary: "#8b8f9a";
  readonly textQuaternary: "#5c616e";
  readonly accent: "#3b82f6";
  readonly accentHover: "#60a5fa";
  readonly accentStrong: "#2563eb";
  readonly statusSuccess: "#4ade80";
  readonly statusSuccessStrong: "#22c55e";
  readonly statusWarning: "#facc15";
  readonly statusWarningStrong: "#eab308";
  readonly statusDanger: "#f87171";
  readonly statusDangerStrong: "#ef4444";
  readonly statusInfo: "#60a5fa";
  readonly statusNeutral: "#8b8f9a";
  readonly sportRunning: "#4ade80";
  readonly sportCycling: "#f97316";
  readonly mapShadow: "#000000";
  readonly mapHighlight: "#ffffff";
  readonly mapHillshadeHighlight: "#ffffff1a";
  readonly mapDotStroke: "#00000050";
  readonly chartFitness: "#3b82f6";
  readonly chartFatigue: "#ec4899";
  readonly chartForm: "#eab308";
  readonly chartHr: "#ef4444";
  readonly chartPower: "#3b82f6";
  readonly chartSpeed: "#22c55e";
  readonly chartGrade: "#a78bfa";
  readonly chartCadence: "#f59e0b";
  readonly chartElevation: "#8b5cf6";
  readonly chartClimb: "#c4b5fd";
  readonly chartPace: "#06b6d4";
  readonly chartGap: "#ec4899";
  readonly precipRain: "#60a5fa";
  readonly precipFreezing: "#67e8f9";
  readonly precipSnow: "#e5e7eb";
  readonly precipThunderstorm: "#fbbf24";
};
```

```ts
// apps/web/e2e/helpers/map.ts · not planned
export const MAP_LAUNCH_OPTIONS: { channel: string; args: string[]; } | { args: string[]; channel?: undefined; };
export const pointerState: (page: Page, point: { x: number; y: number; }) => Promise<{ pickCircle: boolean; cursor: string; }>;
export const findPickableTrack: (page: Page) => Promise<{ x: number; y: number; }>;
export const exposeMap: (page: Page) => Promise<void>;
```

```ts
// apps/web/e2e/mobile/map.spec.ts · not planned
// no exports
```

```ts
// apps/web/e2e/studio.spec.ts · not planned
// no exports
```

```ts
// apps/web/src/features/map/DeckOverlayControl.tsx · not planned
export const DeckOverlayControl: FC<DeckOverlayControlProps>;
```

```ts
// apps/web/src/features/map/hooks/useMapRendererHandOver.ts · not planned
export interface MapRendererHandOver {
  deckShown: boolean;
  terrainMounted: boolean;
  onTerrainDrawn: (() => void) | undefined;
  onDeckDrawn: (() => void) | undefined;
}
export const useMapRendererHandOver: ({ terrain, mapLoaded, }: { terrain: boolean; mapLoaded: boolean; }) => MapRendererHandOver;
```

```ts
// apps/web/src/features/map/trackColors.ts · not planned
export const ADDITIVE_BLEND: {
  readonly blendColorSrcFactor: "src-alpha";
  readonly blendColorDstFactor: "one";
  readonly blendColorOperation: "add";
  readonly blendAlphaSrcFactor: "one";
  readonly blendAlphaDstFactor: "one";
  readonly blendAlphaOperation: "add";
};
export const trackModifiers: {
  width: { default: number; highlighted: number; };
  alpha: { default: number; highlighted: number; };
};
export const LAP_DIMMED_BRIGHTNESS: 0.8;
export const LAP_CASING_SCALE: 1.6;
export const trackIntensityAlpha: Record<TrackIntensity, number>;
export const studioRouteModifiers: { width: { default: number; highlighted: number; }; alpha: { default: number; hidden: number; }; };
export const sportTrackColor: Record<Sport, [number, number, number]>;
export const geoAccuracyFill: [number, number, number, number];
export const geoAccuracyLine: [number, number, number, number];
export const geoDotFill: [number, number, number, number];
export const geoDotLine: [number, number, number, number];
```

```ts
// apps/web/tests/features/map/hooks/useMapRendererHandOver.integration.test.ts · not planned
// no exports
```

```ts
// tools/workbench/playwright.review.config.ts · not planned
export default PlaywrightTestConfig<{}, {}>;
```
