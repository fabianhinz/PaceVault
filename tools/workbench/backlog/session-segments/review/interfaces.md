# Interfaces · session-segments

Generated 2026-11-02 by `vp run workbench:deps -- session-segments` from the TypeScript files changed since the base (as `files.json`): 80 planned, 36 not planned. The checker's types; compare with tech.md `## Interfaces`, the planned record.

```ts
// apps/web/e2e/helpers/seed.ts
export const seedOnboardingComplete: (page: Page) => Promise<void>;
export const seedIntervalsConnected: (page: Page, options?: {
  importedActivityIds?: string[];
  intervalsSessionDates?: number[];
}) => Promise<void>;
export const seedWithSessions: (page: Page, sessions: SeedSession[]) => Promise<string[]>;
export const seedTrips: (page: Page, trips: {
  name: string;
  description?: string;
  sessionIds: string[];
}[]) => Promise<void>;
export const seedCoachWithThresholdPace: (page: Page, thresholdPace: number, sessions: SeedCoachSession[]) => Promise<void>;
export const FIXTURES_DIR: any;
export const CYCLING_FIT: any;
export const RUNNING_FIT: any;
export const CYCLING_ONLY_ZIP: any;
export const ACTIVITIES_ZIP: any;
```

```ts
// apps/web/e2e/segments.spec.ts
// no exports
```

```ts
// apps/web/src/components/dashboard/index.tsx
export const Dashboard: FC;
```

```ts
// apps/web/src/components/layout/DockTabs.tsx
export const DockTabs: FC<DockTabsProps>;
```

```ts
// apps/web/src/components/mapBackground/DeckGLOverlay.tsx
export const DeckGLOverlay: FC<DeckGLOverlayProps>;
```

```ts
// apps/web/src/components/mapBackground/hooks/useLapLayers.ts
export const useLapLayers: ({ terrain, detailPath, }: { terrain: boolean; detailPath: DetailPath | null; }) => LapLayers;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapCameraEffect.ts
export const useMapCameraEffect: ({ gpsData, tracks, lapPath, sessionPath, mapLoaded, }: {
  gpsData: SessionGPS[] | null;
  tracks: MapTrack[];
  lapPath: DetailPath | null;
  sessionPath: DetailPath | null;
  mapLoaded: boolean;
}) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapCameraTarget.ts
export const useMapCameraTarget: () => MapCameraTarget;
```

```ts
// apps/web/src/components/mapBackground/hooks/useSegmentLayers.ts
export const useSegmentLayers: () => LayersList;
```

```ts
// apps/web/src/components/mapBackground/hooks/useSegmentMapTracks.ts
export type SegmentMapMode = 'off' | 'tab' | 'page';
export const useSegmentMapTracks: () => SegmentMapTracks;
```

```ts
// apps/web/src/components/mapBackground/hooks/useTerrainLapStateEffect.ts
export const useTerrainLapStateEffect: ({ sourceId, detailPath, runs, }: {
  sourceId: string;
  detailPath: DetailPath | null;
  runs: TerrainLineRun[];
}) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useTrackLayers.ts
export const useTrackLayers: ({ tracks, eventHandlers, }: {
  tracks: MapTrack[];
  eventHandlers: DeckEventHandlers;
}) => LayersList | null;
```

```ts
// apps/web/src/components/mapBackground/mapCamera.ts
export type MapCameraTarget =
  | { kind: 'overview' }
  | { kind: 'session'; sessionId: string; lapIndex: number | null; view: MapView }
  | { kind: 'segment'; segmentId: string }
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
  | 'segment'
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
export const nextMapCamera: ({ state, obs, }: { state: MapCameraState; obs: MapCameraObservation; }) => MapCameraState;
export const isMapCameraFitBlocked: ({ fit, obs, }: { fit: MapCameraFit; obs: MapCameraObservation; }) => boolean;
export const settleMapCameraFit: (state: MapCameraState) => MapCameraState;
export const sessionMinZoom: ({ fitZoom, currentZoom, }: { fitZoom: number; currentZoom: number; }) => number;
```

```ts
// apps/web/src/components/segments/BestCrown.tsx
export const BestCrown: FC<BestCrownProps>;
```

```ts
// apps/web/src/components/segments/PassGapSpark.tsx
export const PassGapSpark: FC<PassGapSparkProps>;
```

```ts
// apps/web/src/components/segments/PassItem.tsx
export const PassItem: FC<PassItemProps>;
```

```ts
// apps/web/src/components/segments/PassScatter.tsx
export const PassScatter: FC<PassScatterProps>;
```

```ts
// apps/web/src/components/segments/PassTimesRow.tsx
export const PassTimesRow: FC<PassTimesRowProps>;
```

```ts
// apps/web/src/components/segments/SegmentDetail.tsx
export const SegmentDetail: FC<SegmentDetailProps>;
```

```ts
// apps/web/src/components/segments/SegmentHeader.tsx
export const SegmentHeader: FC<SegmentHeaderProps>;
```

```ts
// apps/web/src/components/segments/SegmentItem.tsx
export const SegmentItem: FC<SegmentItemProps>;
```

```ts
// apps/web/src/components/segments/SegmentPeek.tsx
export const SegmentPeek: FC<SegmentPeekProps>;
```

```ts
// apps/web/src/components/segments/SegmentsTab.tsx
export const SegmentsTab: FC;
```

```ts
// apps/web/src/components/segments/charts/SegmentChartsExplorer.tsx
export const SegmentChartsExplorer: FC<SegmentChartsExplorerProps>;
```

```ts
// apps/web/src/components/segments/charts/SegmentExplorerLegend.tsx
export const SegmentExplorerLegend: FC<SegmentExplorerLegendProps>;
```

```ts
// apps/web/src/components/segments/charts/hooks/useSegmentChartRows.ts
export interface SegmentChartSeries {
  selectedPass: StoredSegmentPass | undefined;
  selected: PassSeries | undefined;
  best: PassSeries | undefined;
  loading: boolean;
}
export const useSegmentChartRows: ({ segment, selected, best, }: {
  segment: Segment;
  selected: StoredSegmentPass | undefined;
  best: StoredSegmentPass | undefined;
}) => SegmentChartSeries;
```

```ts
// apps/web/src/components/segments/charts/segmentChartRows.ts
export const SEGMENT_CHANNELS: readonly ["hr", "power", "speed", "pace", "gap", "elevation", "grade", "cadence"];
export type SegmentChannel = (typeof SEGMENT_CHANNELS)[number];
export interface PassSeries {
  elapsedSec: number[];
  positions: Array<[number, number] | null>;
  values: Record<SegmentChannel, Array<number | null>>;
}
export interface SegmentChartRow {
  elapsedSec: number;
  selected: number | null;
  best: number | null;
}
export const passRecords: ({ records, pass, }: { records: SessionRecord[]; pass: StoredSegmentPass; }) => SessionRecord[];
export const passSeries: ({ records, pass, running, }: {
  records: SessionRecord[];
  pass: StoredSegmentPass;
  running: boolean;
}) => PassSeries;
export const valueAtElapsed: ({ series, channel, elapsedSec, }: {
  series: PassSeries;
  channel: SegmentChannel;
  elapsedSec: number;
}) => number | null;
export const positionAtElapsed: ({ series, elapsedSec, }: { series: PassSeries; elapsedSec: number; }) => [number, number] | null;
export const hasChannelValues: ({ series, channel, }: { series: PassSeries | undefined; channel: SegmentChannel; }) => boolean;
export const segmentChartRows: ({ selected, best, channel, }: {
  selected: PassSeries;
  best: PassSeries | undefined;
  channel: SegmentChannel;
}) => SegmentChartRow[];
```

```ts
// apps/web/src/components/segments/hooks/useFilteredSegments.ts
export const useFilteredSegments: (options?: { enabled?: boolean; }) => SegmentsState;
```

```ts
// apps/web/src/components/segments/hooks/useScatterWindow.ts
export interface ScatterWindow {
  windowSessionIds: Set<string> | null;
  reportVisible: (sessionIds: Set<string> | null) => void;
}
export const useScatterWindow: (segment: Segment) => ScatterWindow;
```

```ts
// apps/web/src/components/segments/hooks/useSegmentPassSelection.ts
export const useSegmentPassSelection: (segment: Segment) => [string, (sessionId: string) => void];
```

```ts
// apps/web/src/components/segments/hooks/useSegments.ts
export interface SegmentsState {
  segments: Segment[] | undefined;
  updating: boolean;
}
export const useSegments: (options?: { enabled?: boolean; }) => SegmentsState;
```

```ts
// apps/web/src/components/segments/hooks/useSessionSegments.ts
export const useSessionSegments: (sessionId: string) => SessionSegment[] | undefined;
```

```ts
// apps/web/src/components/segments/index.tsx
export const Segments: FC;
```

```ts
// apps/web/src/components/segments/segmentFilter.ts
export const segmentsInFilter: ({ segments, sessionsById, criteria, now, }: {
  segments: Segment[];
  sessionsById: Map<string, TrainingSession>;
  criteria: FilterCriteria | null;
  now: number;
}) => Segment[];
export const representedSessionIds: (segments: Segment[]) => Set<string>;
```

```ts
// apps/web/src/components/segments/segmentPasses.ts
export const SCATTER_WINDOW_PASSES: 10;
export const bestPassOf: (segment: Segment) => StoredSegmentPass | undefined;
export const latestPassOf: (segment: Segment) => StoredSegmentPass | undefined;
export const passesFastestFirst: (segment: Segment) => StoredSegmentPass[];
export const passesByDate: (segment: Segment) => StoredSegmentPass[];
export const rollingMedianSec: (passesInDateOrder: StoredSegmentPass[]) => Array<number | null>;
export const passRank: ({ segment, sessionId, }: { segment: Segment; sessionId: string; }) => number | undefined;
export const latestWindowSessionIds: (segment: Segment) => Set<string> | null;
export const gapSeriesSec: ({ pass, best, }: { pass: StoredSegmentPass; best: StoredSegmentPass; }) => number[];
export const passPositionAt: ({ segment, pass, elapsedSec, }: {
  segment: Segment;
  pass: StoredSegmentPass;
  elapsedSec: number;
}) => [number, number] | null;
export interface SessionSegment {
  segment: Segment;
  pass: StoredSegmentPass;
  rank: number;
}
export const sessionSegmentsInRideOrder: ({ segments, sessionId, }: { segments: Segment[]; sessionId: string; }) => SessionSegment[];
```

```ts
// apps/web/src/components/segments/segmentTypeIcons.ts
export const ICON_BY_SEGMENT_TYPE: Record<SegmentType, LucideIcon>;
```

```ts
// apps/web/src/components/sessions/session/SegmentsRow.tsx
export const SegmentsRow: FC<SegmentsRowProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionSummaryCard.tsx
export const SessionSummaryCard: FC<SessionSummaryCardProps>;
```

```ts
// apps/web/src/components/settings/deleteAllData.ts
export const clearAllAppState: (queryClient: QueryClient) => void;
```

```ts
// apps/web/src/lib/analysis/laps.ts
export interface LapAnalysis {
  lapIndex: number;
  paceSecPerKm: number | undefined;
  distance: number | undefined;
  movingTime: number;
  intensity: string;
  interval: boolean;
  partial: boolean;
}
export const analyzeLaps: (laps: SessionLap[]) => LapAnalysis[];
export const detectIntervals: (laps: SessionLap[]) => IntervalPair[];
export interface RecordSpan {
  startRecord: number;
  endRecord: number;
}
export interface LapSpan extends RecordSpan {
  lapIndex: number;
}
export interface LapBand {
  lapIndex: number;
  from: number;
  to: number;
}
export const recordSpanBetween: ({ records, startSec, endSec, }: {
  records: SessionRecord[];
  startSec: number;
  endSec: number;
}) => RecordSpan | null;
export const deviceLapSpans: ({ records, laps, }: { records: SessionRecord[]; laps: SessionLap[]; }) => LapSpan[];
export const lapBands: ({ records, spans, }: { records: SessionRecord[]; spans: LapSpan[]; }) => LapBand[];
export const lapIndexAtRecord: ({ spans, recordIndex, }: { spans: LapSpan[]; recordIndex: number; }) => number | undefined;
export const lapIndexAtTime: ({ bands, minutes, }: { bands: LapBand[]; minutes: number; }) => number | undefined;
export const bandsOnRows: ({ bands, xs }: { bands: LapBand[]; xs: number[]; }) => LapBand[];
export const recordedDistance: (records: SessionRecord[]) => number;
export const splitDistanceRange: ({ sport, sessionMetres, }: { sport: Sport; sessionMetres: number; }) => SplitDistanceRange;
export const computeDynamicLaps: ({ records, splitDistanceMetres, }: {
  records: SessionRecord[];
  splitDistanceMetres: number;
}) => DynamicLapResult;
export const effortWorkAverage: ({ blocks, signal, }: { blocks: EffortBlock[]; signal: EffortSignal; }) => number | undefined;
export const buildEffortLapSet: ({ records, sport, thresholds, }: {
  records: SessionRecord[];
  sport: Sport;
  thresholds: ResolvedThresholds | undefined;
}) => EffortLapResult;
export const effortWorkSet: (set: LapSet) => LapSet;
export const effortWorkCount: (set: LapSet) => number;
export const effortPattern: (set: LapSet) => { count: number; movingTime: number; } | undefined;
export const LAP_SOURCES: readonly ["off", "device", "splits", "efforts"];
export type LapSource = (typeof LAP_SOURCES)[number];
export const effectiveSplitDistance: ({ splitDistance, sport, sessionMetres, }: {
  splitDistance: number | null;
  sport: Sport;
  sessionMetres: number;
}) => number;
export interface LapSetEfforts {
  signal: EffortSignal;
  limitedBy: EffortLimiter | undefined;
  /** see `effortWorkAverage` */
  workAverage: number | undefined;
}
export interface LapSet {
  analysis: LapAnalysis[];
  spans: LapSpan[];
  bands: LapBand[];
  hrRecoveries: number[];
  efforts?: LapSetEfforts;
}
export const buildDeviceLapSet: ({ records, laps, }: { records: SessionRecord[]; laps: SessionLap[]; }) => LapSet | null;
export const buildLapSet: ({ records, laps, source, splitDistance, effortContext, }: {
  records: SessionRecord[];
  laps: SessionLap[];
  source: LapSource;
  splitDistance: number;
  effortContext: EffortContext;
}) => LapSet | null;
export const stepLap: ({ bands, lapIndex, direction, }: {
  bands: LapBand[];
  lapIndex: number;
  direction: -1 | 1;
}) => number | undefined;
export const MIN_SUMMARY_LAPS: 2;
export const summarizeLaps: (set: LapSet) => LapSummary;
```

```ts
// apps/web/src/lib/analysis/segmentDetection.ts
export const segmentsSessionsKey: (sessions: SegmentSessionMeta[]) => string;
export const segmentDetectionInputs: (sessions: TrainingSession[]) => SegmentDetectionInput[];
export const numberedByRecency: (segments: Segment[]) => Segment[];
export interface SportDetection {
  entry: StoredSegments;
  metrics: SportDetectionMetrics;
}
export const detectSegmentsForSport: ({ ignoreCache, clockMs, ...input }: SegmentDetectionInput & {
  ignoreCache?: boolean;
  clockMs?: ClockMs;
}) => Promise<SportDetection>;
```

```ts
// apps/web/src/lib/format/formatters.ts
export type DateFormatMode =
  | 'date'
  | 'date-time'
  | 'short'
  | 'numeric-day'
  | 'numeric-month'
  | 'month-year'
  | 'hour-minute'
  | 'day-month'
  | 'day-month-two-digit-year';
export const formatDate: (value: number | Date, mode?: DateFormatMode) => string;
export const formatShortDate: ({ value, now }: { value: number; now: number; }) => string;
export type DateRangeFormatMode =
  | 'day-month'
  | 'day-month-year'
  | 'month-year-short'
  | 'year'
  | 'day-month-without-year';
export const formatDateRange: (from: number | Date, to: number | Date, mode?: DateRangeFormatMode) => string;
export type NumberFormatMode =
  | 'integer'
  | 'integer-ungrouped'
  | 'one-decimal'
  | 'one-decimal-ungrouped'
  | 'fixed-one-decimal'
  | 'fixed-one-decimal-ungrouped'
  | 'fixed-two-decimals'
  | 'fixed-two-decimals-ungrouped'
  | 'signed-fixed-one-decimal'
  | 'percent';
export const formatNumber: (value: number, mode?: NumberFormatMode) => string;
export type UnitFormatMode =
  | 'celsius'
  | 'kilometer-per-hour'
  | 'kilometer-per-hour-fixed-one-decimal'
  | 'kilometer'
  | 'second'
  | 'minute';
export const formatUnit: (value: number, mode: UnitFormatMode) => string;
export const formatUnitRange: (from: number, to: number, mode: UnitFormatMode) => string;
export const formatMonthName: (date: Date, options: { locale: MonthNameLocale; width: MonthNameWidth; }) => string;
export const formatPlural: (count: number, forms: { one: () => string; other: () => string; }) => string;
export const formatOrdinal: (value: number) => string;
export const formatBytes: (bytes: number) => string;
export const toDateString: (timestamp: number) => string;
export const formatDuration: (seconds: number) => string;
export const formatRaceTime: (seconds: number) => string;
export const formatSignedRaceTime: (seconds: number) => string;
export const formatTimeHMS: (seconds: number) => string;
export const formatDistance: (meters: number | undefined) => string;
export const toKm: (meters: number) => string;
export const formatPace: (secPerKm: number) => string;
export const formatPaceTick: (minPerKm: number) => string;
export const formatPaceInput: (seconds: number) => string;
export const parsePaceInput: (input: string) => number | undefined;
export const parseTimeHMS: (input: string) => number | undefined;
export const pbLabel: (pb: PersonalBest) => string;
export const formatPBValue: (pb: PersonalBest) => string;
export const formatSubSport: (subSport: string) => string;
```

```ts
// apps/web/src/lib/hooks/useDragScroll.ts
export interface DragScroll {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  dragged: RefObject<boolean>;
}
export const useDragScroll: () => DragScroll;
```

```ts
// apps/web/src/lib/storage/db.ts
export interface EnduranceTrackerDB extends DBSchema {
  'session-records': {
    key: string;
    value: { sessionId: string } & EncodedRecords;
  };
  'session-laps': {
    key: string;
    value: { sessionId: string; laps: SessionLap[] };
  };
  'session-gps': {
    key: number;
    value: SessionGPS;
    indexes: { sessionId: string };
  };
  'session-weather': {
    key: string;
    value: SessionWeather;
  };
  'fit-files': {
    key: string;
    value: { sessionId: string; fileName: string; data: ArrayBuffer };
  };
  'studio-route-points': {
    key: string;
    value: { routeId: string; points: RoutePoint[] };
  };
  segments: {
    key: string;
    value: unknown;
  };
  kv: {
    key: string;
    value: string;
  };
}
export const DB_NAME: "endurance-tracker";
export const DB_VERSION: 5;
export const getDB: () => Promise<IDBPDatabase<EnduranceTrackerDB>>;
export const resetDBInstance: () => void;
export const getSessionRecords: (sessionId: string) => Promise<SessionRecord[]>;
export const deleteSessionRecords: (sessionId: string) => Promise<void>;
export const clearAllRecords: () => Promise<void>;
export const saveStudioRoutePoints: ({ routeId, points, }: { routeId: string; points: RoutePoint[]; }) => Promise<void>;
export const getStudioRoutePoints: (routeId: string) => Promise<RoutePoint[]>;
export const deleteStudioRoutePoints: (routeId: string) => Promise<void>;
export const getStoredSegments: () => Promise<StoredSegments[]>;
export const saveStoredSegments: (entry: StoredSegments) => Promise<void>;
export const getSessionLaps: (sessionId: string) => Promise<SessionLap[]>;
export const deleteSessionLaps: (sessionId: string) => Promise<void>;
export const saveSessionGPS: (gps: SessionGPS) => Promise<void>;
export const getSessionGPS: (sessionId: string) => Promise<SessionGPS | undefined>;
export const getAllSessionGPS: () => Promise<SessionGPS[]>;
export const deleteSessionGPS: (sessionId: string) => Promise<void>;
export const bulkSaveSessionData: (entries: SessionDataEntry[], options?: {
  chunkSize?: number;
  onChunkDone?: (chunkIndex: number) => void;
  signal?: AbortSignal;
}) => Promise<void>;
export const bulkReplaceSessionData: (entries: Omit<SessionDataEntry, "fit">[]) => Promise<void>;
export const getFitFile: (sessionId: string) => Promise<{
  sessionId: string;
  fileName: string;
  data: ArrayBuffer;
} | undefined>;
export const deleteFitFile: (sessionId: string) => Promise<void>;
export const getFitFileSessionIds: () => Promise<string[]>;
export type IdbStoreName = StoreNames<EnduranceTrackerDB>;
export const measureStoreBytes: () => Promise<Partial<Record<IdbStoreName, number>>>;
export const idbStorage: StateStorage<unknown>;
export const getSessionWeather: (sessionId: string) => Promise<SessionWeather | undefined>;
export const saveSessionWeather: (weather: SessionWeather) => Promise<void>;
export const deleteSessionWeather: (sessionId: string) => Promise<void>;
```

```ts
// apps/web/src/lib/storage/storageBreakdown.ts
export const breakdownStorage: ({ storeBytes, totalBytes, }: {
  storeBytes: Partial<Record<IdbStoreName, number>>;
  totalBytes: number | undefined;
}) => Record<StorageCategory, number>;
```

```ts
// apps/web/src/lib/workers/segments.worker.ts
// no exports
```

```ts
// apps/web/src/lib/workers/segmentsContract.ts
export const SEGMENT_DETECTOR_VERSION: 1;
export const segmentSessionMetaSchema: z.ZodObject<{
  sessionId: z.ZodString;
  sport: z.ZodEnum<{ [x: string]: any; }>;
  date: z.ZodNumber;
  derivationVersion: z.ZodNumber;
}, z.core.$strip>;
export type SegmentSessionMeta = z.infer<typeof segmentSessionMetaSchema>;
export const storedSegmentPassSchema: z.ZodObject<{
  sessionId: z.ZodString;
  date: z.ZodNumber;
  startTimestampSec: z.ZodNumber;
  endTimestampSec: z.ZodNumber;
  durationSec: z.ZodNumber;
  splitDurationsSec: z.ZodArray<z.ZodNumber>;
  coverageRatio: z.ZodNumber;
}, z.core.$strip>;
export type StoredSegmentPass = z.infer<typeof storedSegmentPassSchema>;
export const segmentSchema: z.ZodObject<{
  id: z.ZodString;
  sport: z.ZodEnum<{ [x: string]: any; }>;
  type: z.ZodEnum<{ climb: "climb"; flat: "flat"; descent: "descent"; route: "route"; }>;
  typeNumber: z.ZodNumber;
  distanceMeters: z.ZodNumber;
  netElevationMeters: z.ZodNullable<z.ZodNumber>;
  geometry: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
  passes: z.ZodArray<z.ZodObject<{ sessionId: z.ZodString; date: z.ZodNumber; startTimestampSec: z.ZodNumber; endTimestampSec: z.ZodNumber; durationSec: z.ZodNumber; splitDurationsSec: z.ZodArray<z.ZodNumber>; coverageRatio: z.ZodNumber; }, z.core.$strip>>;
  lastPassDate: z.ZodNumber;
}, z.core.$strip>;
export type Segment = z.infer<typeof segmentSchema>;
export const storedSegmentsSchema: z.ZodObject<{
  sport: z.ZodEnum<{ [x: string]: any; }>;
  sessionsKey: z.ZodString;
  detectorVersion: z.ZodNumber;
  segments: z.ZodArray<z.ZodObject<{ id: z.ZodString; sport: z.ZodEnum<{ [x: string]: any; }>; type: z.ZodEnum<{ climb: "climb"; flat: "flat"; descent: "descent"; route: "route"; }>; typeNumber: z.ZodNumber; distanceMeters: z.ZodNumber; netElevationMeters: z.ZodNullable<z.ZodNumber>; geometry: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>; passes: z.ZodArray<z.ZodObject<{ sessionId: z.ZodString; date: z.ZodNumber; startTimestampSec: z.ZodNumber; endTimestampSec: z.ZodNumber; durationSec: z.ZodNumber; splitDurationsSec: z.ZodArray<z.ZodNumber>; coverageRatio: z.ZodNumber; }, z.core.$strip>>; lastPassDate: z.ZodNumber; }, z.core.$strip>>;
}, z.core.$strip>;
export type StoredSegments = z.infer<typeof storedSegmentsSchema>;
export const segmentDetectionInputSchema: z.ZodObject<{
  sport: z.ZodEnum<{ [x: string]: any; }>;
  sessionsKey: z.ZodString;
  sessions: z.ZodArray<z.ZodObject<{ sessionId: z.ZodString; sport: z.ZodEnum<{ [x: string]: any; }>; date: z.ZodNumber; derivationVersion: z.ZodNumber; }, z.core.$strip>>;
}, z.core.$strip>;
export type SegmentDetectionInput = z.infer<typeof segmentDetectionInputSchema>;
export const workerMessageInSchema: z.ZodObject<{
  type: z.ZodLiteral<"detect">;
  sports: z.ZodArray<z.ZodObject<{ sport: z.ZodEnum<{ [x: string]: any; }>; sessionsKey: z.ZodString; sessions: z.ZodArray<z.ZodObject<{ sessionId: z.ZodString; sport: z.ZodEnum<{ [x: string]: any; }>; date: z.ZodNumber; derivationVersion: z.ZodNumber; }, z.core.$strip>>; }, z.core.$strip>>;
  ignoreCache: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;
export const segmentEngineStatsSchema: z.ZodObject<{
  leadsProcessed: z.ZodNumber;
  leadsSkippedAsRoute: z.ZodNumber;
  turnAnchors: z.ZodNumber;
  climbAnchors: z.ZodNumber;
  atoms: z.ZodNumber;
  corridorMatches: z.ZodNumber;
  candidates: z.ZodNumber;
  droppedAsDuplicate: z.ZodNumber;
  msByPhase: z.ZodRecord<z.ZodEnum<{ [x: string]: any; }>, z.ZodNumber>;
}, z.core.$strip>;
export const sportDetectionMetricsSchema: z.ZodObject<{
  sport: z.ZodEnum<{ [x: string]: any; }>;
  cache: z.ZodEnum<{ hit: "hit"; miss: "miss"; }>;
  missReason: z.ZodNullable<z.ZodEnum<{ sessionsKey: "sessionsKey"; detectorVersion: "detectorVersion"; noEntry: "noEntry"; forced: "forced"; }>>;
  sessions: z.ZodNumber;
  sessionsWithRecords: z.ZodNumber;
  records: z.ZodNumber;
  tracks: z.ZodNumber;
  resampledPoints: z.ZodNumber;
  segmentsByType: z.ZodRecord<z.ZodEnum<{ climb: "climb"; flat: "flat"; descent: "descent"; route: "route"; }>, z.ZodNumber>;
  passes: z.ZodNumber;
  engine: z.ZodNullable<z.ZodObject<{ leadsProcessed: z.ZodNumber; leadsSkippedAsRoute: z.ZodNumber; turnAnchors: z.ZodNumber; climbAnchors: z.ZodNumber; atoms: z.ZodNumber; corridorMatches: z.ZodNumber; candidates: z.ZodNumber; droppedAsDuplicate: z.ZodNumber; msByPhase: z.ZodRecord<z.ZodEnum<{ [x: string]: any; }>, z.ZodNumber>; }, z.core.$strip>>;
  ms: z.ZodObject<{ readRecords: z.ZodNumber; slowestSessionRead: z.ZodNumber; segmentTrack: z.ZodNumber; detectedSegments: z.ZodNumber; storedSegments: z.ZodNumber; saveCache: z.ZodNumber; total: z.ZodNumber; }, z.core.$strip>;
}, z.core.$strip>;
export type SportDetectionMetrics = z.infer<typeof sportDetectionMetricsSchema>;
export const segmentDetectionMetricsSchema: z.ZodObject<{
  detectorVersion: z.ZodNumber;
  environment: z.ZodObject<{ hardwareConcurrency: z.ZodNullable<z.ZodNumber>; deviceMemoryGb: z.ZodNullable<z.ZodNumber>; userAgent: z.ZodString; }, z.core.$strip>;
  workerMs: z.ZodNumber;
  mainThreadMs: z.ZodNullable<z.ZodNumber>;
  sports: z.ZodArray<z.ZodObject<{ sport: z.ZodEnum<{ [x: string]: any; }>; cache: z.ZodEnum<{ hit: "hit"; miss: "miss"; }>; missReason: z.ZodNullable<z.ZodEnum<{ sessionsKey: "sessionsKey"; detectorVersion: "detectorVersion"; noEntry: "noEntry"; forced: "forced"; }>>; sessions: z.ZodNumber; sessionsWithRecords: z.ZodNumber; records: z.ZodNumber; tracks: z.ZodNumber; resampledPoints: z.ZodNumber; segmentsByType: z.ZodRecord<z.ZodEnum<{ climb: "climb"; flat: "flat"; descent: "descent"; route: "route"; }>, z.ZodNumber>; passes: z.ZodNumber; engine: z.ZodNullable<z.ZodObject<{ leadsProcessed: z.ZodNumber; leadsSkippedAsRoute: z.ZodNumber; turnAnchors: z.ZodNumber; climbAnchors: z.ZodNumber; atoms: z.ZodNumber; corridorMatches: z.ZodNumber; candidates: z.ZodNumber; droppedAsDuplicate: z.ZodNumber; msByPhase: z.ZodRecord<z.ZodEnum<{ [x: string]: any; }>, z.ZodNumber>; }, z.core.$strip>>; ms: z.ZodObject<{ readRecords: z.ZodNumber; slowestSessionRead: z.ZodNumber; segmentTrack: z.ZodNumber; detectedSegments: z.ZodNumber; storedSegments: z.ZodNumber; saveCache: z.ZodNumber; total: z.ZodNumber; }, z.core.$strip>; }, z.core.$strip>>;
}, z.core.$strip>;
export type SegmentDetectionMetrics = z.infer<typeof segmentDetectionMetricsSchema>;
export const workerMessageOutSchema: z.ZodObject<{
  type: z.ZodLiteral<"done">;
  entries: z.ZodArray<z.ZodObject<{ sport: z.ZodEnum<{ [x: string]: any; }>; sessionsKey: z.ZodString; detectorVersion: z.ZodNumber; segments: z.ZodArray<z.ZodObject<{ id: z.ZodString; sport: z.ZodEnum<{ [x: string]: any; }>; type: z.ZodEnum<{ climb: "climb"; flat: "flat"; descent: "descent"; route: "route"; }>; typeNumber: z.ZodNumber; distanceMeters: z.ZodNumber; netElevationMeters: z.ZodNullable<z.ZodNumber>; geometry: z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>; passes: z.ZodArray<z.ZodObject<{ sessionId: z.ZodString; date: z.ZodNumber; startTimestampSec: z.ZodNumber; endTimestampSec: z.ZodNumber; durationSec: z.ZodNumber; splitDurationsSec: z.ZodArray<z.ZodNumber>; coverageRatio: z.ZodNumber; }, z.core.$strip>>; lastPassDate: z.ZodNumber; }, z.core.$strip>>; }, z.core.$strip>>;
  metrics: z.ZodOptional<z.ZodObject<{ detectorVersion: z.ZodNumber; environment: z.ZodObject<{ hardwareConcurrency: z.ZodNullable<z.ZodNumber>; deviceMemoryGb: z.ZodNullable<z.ZodNumber>; userAgent: z.ZodString; }, z.core.$strip>; workerMs: z.ZodNumber; mainThreadMs: z.ZodNullable<z.ZodNumber>; sports: z.ZodArray<z.ZodObject<{ sport: z.ZodEnum<{ [x: string]: any; }>; cache: z.ZodEnum<{ hit: "hit"; miss: "miss"; }>; missReason: z.ZodNullable<z.ZodEnum<{ sessionsKey: "sessionsKey"; detectorVersion: "detectorVersion"; noEntry: "noEntry"; forced: "forced"; }>>; sessions: z.ZodNumber; sessionsWithRecords: z.ZodNumber; records: z.ZodNumber; tracks: z.ZodNumber; resampledPoints: z.ZodNumber; segmentsByType: z.ZodRecord<z.ZodEnum<{ climb: "climb"; flat: "flat"; descent: "descent"; route: "route"; }>, z.ZodNumber>; passes: z.ZodNumber; engine: z.ZodNullable<z.ZodObject<{ leadsProcessed: z.ZodNumber; leadsSkippedAsRoute: z.ZodNumber; turnAnchors: z.ZodNumber; climbAnchors: z.ZodNumber; atoms: z.ZodNumber; corridorMatches: z.ZodNumber; candidates: z.ZodNumber; droppedAsDuplicate: z.ZodNumber; msByPhase: z.ZodRecord<z.ZodEnum<{ [x: string]: any; }>, z.ZodNumber>; }, z.core.$strip>>; ms: z.ZodObject<{ readRecords: z.ZodNumber; slowestSessionRead: z.ZodNumber; segmentTrack: z.ZodNumber; detectedSegments: z.ZodNumber; storedSegments: z.ZodNumber; saveCache: z.ZodNumber; total: z.ZodNumber; }, z.core.$strip>; }, z.core.$strip>>; }, z.core.$strip>>;
}, z.core.$strip>;
export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
```

```ts
// apps/web/src/microcopy/segments.ts
export const LABEL_BY_SEGMENT_TYPE: Record<SegmentType, (inputs: { number: string; }) => string>;
export const segmentLabel: (segment: { type: SegmentType; typeNumber: number; }) => string;
export const segmentCountLabel: (count: number) => string;
export const passCountLabel: (count: number) => string;
export const showMorePassesLabel: (count: number) => string;
export const passRankLabel: ({ rank, count }: { rank: number; count: number; }) => string;
export const showMoreSegmentsLabel: (count: number) => string;
```

```ts
// apps/web/src/pages/SegmentDetailPage.tsx
export const SegmentDetailPage: FC;
```

```ts
// apps/web/src/queries/segments/useDetectedSegments.ts
export const detectSegments: (options: {
  sports: SegmentDetectionInput[];
  signal: AbortSignal;
}) => Promise<QueryResults["detectedSegments"]>;
export const detectedSegmentsQueryKey: (options?: { sessionsKeys?: string[]; }) => string[];
export const useDetectedSegments: (options: { enabled: boolean; }) => UseQueryResult<QueryResults["detectedSegments"]>;
export const resetDetectedSegments: (queryClient: QueryClient) => Promise<void>;
```

```ts
// apps/web/src/queries/segments/useStoredSegments.ts
export const loadStoredSegments: () => Promise<QueryResults["storedSegments"]>;
export const storedSegmentsQueryKey: () => string[];
export const useStoredSegments: (options: { enabled: boolean; }) => UseQueryResult<QueryResults["storedSegments"]>;
export const resetStoredSegments: (queryClient: QueryClient) => Promise<void>;
```

```ts
// apps/web/src/routing/AppRoutes.tsx
export const AppRoutes: FC;
```

```ts
// apps/web/src/routing/dashboardTab.ts
export type DashboardTab = (typeof DASHBOARD_TABS)[number];
export const resolveDashboardTab: (rawTab: string | null) => DashboardTab;
```

```ts
// apps/web/src/routing/pageRegistry.ts
export const SUPPORTED_PAGES: {
  readonly dashboard: "dashboard";
  readonly sessions: "sessions";
  readonly sessionDetail: "sessionDetail";
  readonly tripDetail: "tripDetail";
  readonly segmentDetail: "segmentDetail";
  readonly studioDetail: "studioDetail";
  readonly labs: "labs";
  readonly settings: "settings";
};
export type SupportedPage = (typeof SUPPORTED_PAGES)[keyof typeof SUPPORTED_PAGES];
export type SessionsTab = 'log' | 'trips' | 'records';
export type StudioDetailTab = 'overview' | 'tools';
export type SettingsTab = 'general' | 'data';
export const PATTERN_BY_PAGE: {
  dashboard: string;
  sessions: string;
  sessionDetail: string;
  tripDetail: string;
  segmentDetail: string;
  studioDetail: string;
  labs: string;
  settings: string;
};
export const URL_BY_PAGE: {
  dashboard: (params: { tab?: DashboardTab; }) => string;
  sessions: (params: { tab?: SessionsTab; }) => string;
  sessionDetail: (params: { sessionId: string; }) => string;
  tripDetail: (params: { tripId: string; }) => string;
  segmentDetail: (params: { segmentId: string; from?: string; }) => string;
  studioDetail: (params: { routeId: string; tab?: StudioDetailTab; }) => string;
  labs: (params: { tab?: LabsTab; }) => string;
  settings: (params: { tab?: SettingsTab; }) => string;
};
export type ResolvePageParams<P extends SupportedPage> = Parameters<(typeof URL_BY_PAGE)[P]>[0];
export type PageTarget = {
  [P in SupportedPage]: { page: P; params: ResolvePageParams<P> };
}[SupportedPage];
export const pageUrl: (target: PageTarget) => string;
```

```ts
// apps/web/src/routing/urlQuery.ts
export const SUPPORTED_QUERY: { readonly id: "id"; readonly tab: "tab"; readonly from: "from"; };
export type SupportedQuery = (typeof SUPPORTED_QUERY)[keyof typeof SUPPORTED_QUERY];
```

```ts
// apps/web/src/store/mapControls.ts
export const MAP_VIEWS: readonly ["2d", "3d"];
export type MapView = (typeof MAP_VIEWS)[number];
export const INITIAL_MAP_CONTROLS_STORE_STATE: Pick<MapControlsState, "trackColorMode" | "sessionLaps" | "selectedLapIndex" | "hoveredSegmentSpan" | "lapCloseCount" | "hoveredLapIndex" | "overviewMapControlsShown" | "sessionMapView" | "terrainTrackHovered">;
export const useMapControlsStore: UseBoundStore<WithImmer<StoreApi<MapControlsState>>>;
```

```ts
// apps/web/src/store/segmentFocus.ts
export type MapMarker = [number, number];
export const INITIAL_SEGMENT_FOCUS_STORE_STATE: Pick<SegmentFocusState, "hoveredSegmentId" | "hoveredPassSessionId" | "passMarker" | "bestMarker">;
export const useSegmentFocusStore: UseBoundStore<WithImmer<StoreApi<SegmentFocusState>>>;
```

```ts
// apps/web/src/types.ts
export type ThresholdKey = 'restHr' | 'maxHr' | 'thresholdHr' | 'ftp' | 'thresholdPace' | 'weight';
export interface UserProfile {
  id: string;
  gender: Gender;
  thresholds: {
    restHr: DatedValue<number>[];
    maxHr: DatedValue<number>[];
    ftp?: DatedValue<number>[];
    thresholdPace?: DatedValue<number>[];
    thresholdHr?: DatedValue<number>[];
  };
  weight?: DatedValue<number>[];
  birthYear?: number;
  showMetricHelp: boolean;
  createdAt: number;
}
export interface CoachingRecommendation {
  status: FormStatus;
  message: string;
  tsb: number;
  acwr: number;
  injuryRisk: InjuryRisk;
  dataMaturityDays: number;
}
export type WorkoutType =
  | 'rest'
  | 'recovery'
  | 'easy'
  | 'long-run'
  | 'tempo'
  | 'threshold-intervals'
  | 'vo2max-intervals';
export interface WorkoutStep {
  type: StepType;
  durationSec: number;
  zone: RunningZoneName;
  targetPaceMin: number;
  targetPaceMax: number;
  repeat?: number;
}
export interface PrescribedWorkout {
  id: string;
  date: string;
  dayLabel: string;
  type: WorkoutType;
  title: string;
  steps: WorkoutStep[];
  estimatedDurationSec: number;
  estimatedTss: number;
  rationale: string;
  isTaper: boolean;
}
export type PlanContext =
  | { mode: 'normal'; formStatus: FormStatus; tsb: number; acwr: number; dataMaturityDays: number }
  | { mode: 'taper'; raceDate: string; raceDistance: RaceDistance; daysToRace: number }
  | { mode: 'no-data' };
export interface WeeklyPlan {
  weekOf: string;
  workouts: PrescribedWorkout[];
  totalEstimatedTss: number;
  context: PlanContext;
}
export type StorageCategory = 'heatmap' | 'fitFiles' | 'weather' | 'appData';
export interface StorageBreakdown {
  total: number | null;
  categories: Record<StorageCategory, number> | null;
}
export interface PreviewPass {
  sport: Sport;
  /** [lng, lat] pairs. */
  path: [number, number][];
  /** Cumulative distance in metres at each point. */
  cumulative: number[];
  length: number;
  /** Delay in ms after the reveal before this pass starts drawing. */
  start: number;
  duration: number;
}
export interface PreviewPasses {
  passes: PreviewPass[];
  bounds: GPSBounds | null;
}
export interface WeatherSnapshot {
  time: number;
  lat: number;
  lng: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  weatherCode: number;
}
export interface SessionWeather {
  sessionId: string;
  snapshots: WeatherSnapshot[];
  fetchedAt: number;
}
export interface IntervalsSyncSummary {
  available: number;
  pending: number;
  imported: number;
  duplicated: number;
  failed: number;
}
export interface QueryResults {
  onboardingPreviewRoutes: PreviewPasses;
  sessionWeather: SessionWeather | null;
  personalBests: PersonalBest[];
  storedSegments: StoredSegments[];
  detectedSegments: StoredSegments[];
  intervalsKeyCheck: true;
  intervalsSync: IntervalsSyncSummary;
  studioRoutePoints: RoutePoint[];
  sessionRecords: SessionRecord[];
  sessionLaps: SessionLap[];
  sessionGps: SessionGPS | null;
  sessionGpsTracks: SessionGPS[];
  storageBreakdown: StorageBreakdown;
  outdatedSessionsReprocessing: number;
  trainingLoadRecompute: true;
}
export type StudioRouteColor = 'amber' | 'orange' | 'rose' | 'fuchsia' | 'violet' | 'emerald';
export type StudioMarkerType = 'track_modifier' | 'point_of_interest';
export interface StudioMarkerBase {
  id: string;
  distanceM: number;
}
export interface TrackModifierMarker extends StudioMarkerBase {
  type: 'track_modifier';
}
export interface PointOfInterestMarker extends StudioMarkerBase {
  type: 'point_of_interest';
  label: string;
  description?: string;
}
export type StudioMarker = TrackModifierMarker | PointOfInterestMarker;
export interface StudioRoute {
  id: string;
  name: string;
  sourceFileName: string;
  importedAt: number;
  color: StudioRouteColor;
  encodedPolylines: string[];
  bounds: GPSBounds;
  distance: number;
  elevation?: RouteElevationStats;
  markers: StudioMarker[];
}
```

```ts
// apps/web/tests/components/segments/PassTimesRow.spec.tsx
// no exports
```

```ts
// apps/web/tests/components/segments/charts/segmentChartRows.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/segmentFilter.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/segmentPasses.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/session/SegmentsRow.spec.tsx
// no exports
```

```ts
// apps/web/tests/lib/analysis/segmentDetection.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/format/formatters.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/storage/db.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/storage/db.segments.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/routing/dashboardTab.spec.ts
// no exports
```

```ts
// apps/web/tests/routing/pageRegistry.spec.ts
// no exports
```

```ts
// packages/engine/src/segments.ts
export type SegmentType = 'climb' | 'flat' | 'descent' | 'route';
export interface SegmentTrackPoint {
  lat: number;
  lng: number;
  distanceMeters: number;
  timestampSec: number;
  elevationMeters: number | undefined;
}
export interface SegmentClimbSpan {
  fromPoint: number;
  toPoint: number;
}
export interface SegmentTrack {
  sessionId: string;
  sport: Sport;
  date: number;
  points: SegmentTrackPoint[];
  climbSpans: SegmentClimbSpan[];
}
export interface SegmentPass {
  sessionId: string;
  startTimestampSec: number;
  endTimestampSec: number;
  durationSec: number;
  splitDurationsSec: number[];
  coverageRatio: number;
}
export interface DetectedSegment {
  sport: Sport;
  type: SegmentType;
  leadSessionId: string;
  startMeters: number;
  endMeters: number;
  distanceMeters: number;
  netElevationMeters: number | null;
  geometry: Array<[number, number]>;
  passes: SegmentPass[];
}
export interface SegmentDetectionStats {
  leadsProcessed: number;
  leadsSkippedAsRoute: number;
  turnAnchors: number;
  climbAnchors: number;
  atoms: number;
  corridorMatches: number;
  candidates: number;
  droppedAsDuplicate: number;
  msByPhase: Record<SegmentDetectionPhase, number>;
}
export interface SegmentDetectionResult {
  segments: DetectedSegment[];
  stats: SegmentDetectionStats;
}
export const SEGMENT_DETECTION_PHASES: readonly ["grid", "corridorMatch", "anchors", "typing", "dedupe"];
export type SegmentDetectionPhase = (typeof SEGMENT_DETECTION_PHASES)[number];
export const SEGMENT_SPLIT_COUNT: 24;
export const segmentTrack: ({ sessionId, sport, date, records, }: {
  sessionId: string;
  sport: Sport;
  date: number;
  records: SessionRecord[];
}) => SegmentTrack | undefined;
export const segmentDetectionResult: ({ sport, tracks, clockMs, }: {
  sport: Sport;
  tracks: SegmentTrack[];
  clockMs?: () => number;
}) => SegmentDetectionResult;
export const detectedSegments: ({ sport, tracks, }: { sport: Sport; tracks: SegmentTrack[]; }) => DetectedSegment[];
```

```ts
// packages/engine/tests/segments.spec.ts
// no exports
```

```ts
// packages/testing/src/series.ts
export interface PathWaypoint {
  eastMeters: number;
  northMeters: number;
}
export const cyclingRecordSeries: ({ count, basePowerWatts, baseHrBpm, }: {
  count: number;
  basePowerWatts?: number;
  baseHrBpm?: number;
}) => SessionRecord[];
export const runningRecordSeries: ({ count, baseSpeedMetersPerSec, baseHrBpm, }: {
  count: number;
  baseSpeedMetersPerSec?: number;
  baseHrBpm?: number;
}) => SessionRecord[];
export const lapSeries: (count: number) => SessionLap[];
export const invalidRecordSeries: (kind: InvalidRecordKind) => SessionRecord[];
export const gpsRunningRecordSeries: (count: number) => SessionRecord[];
export const indoorRecordSeries: (count: number) => SessionRecord[];
export const sessionSeries: ({ count, startDate, baseTss, tssVariation, }: {
  count: number;
  startDate: number;
  baseTss: number;
  tssVariation: number;
}) => TrainingSession[];
export const gpsPathRecordSeries: ({ path, speedMetersPerSec, legSpeedsMetersPerSec, reverse, gradeRatio, }: {
  path: PathWaypoint[];
  speedMetersPerSec: number;
  legSpeedsMetersPerSec?: number[];
  reverse?: boolean;
  gradeRatio?: number | null;
}) => SessionRecord[];
```

```ts
// packages/ui/src/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx
export const PvCollapsibleListItem: FC<PvCollapsibleListItemProps>;
```

```ts
// packages/ui/src/components/pvStatRail/PvStatRail.tsx
export const PvStatRail: FC<PvStatRailProps>;
```

```ts
// packages/ui/src/components/pvStatRail/types.ts
export interface StatRailRow {
  key: string;
  name?: string;
  color?: TokenColor;
  info?: ReactNode;
  value: ReactNode;
  unit?: string;
  secondary?: ReactNode;
}
export interface StatRailNote {
  text: string;
  color: string;
  icon?: ReactNode;
}
```

```ts
// packages/ui/src/hooks/useScrollFadeEffect.ts
export const useScrollFadeEffect: (ref: RefObject<HTMLElement | null>, options?: { axis?: ScrollFadeAxis; }) => void;
```

```ts
// packages/ui/src/lib/scrollFade.ts
export const scrollFadeEdges: (metrics: ScrollMetrics) => { top: boolean; bottom: boolean; };
export const horizontalScrollFadeEdges: (metrics: HorizontalScrollMetrics) => { left: boolean; right: boolean; };
```

```ts
// packages/ui/src/lib/tokens.ts
export const tokens: {
  readonly surfaceBase: "#030712";
  readonly surfaceSunken: "#0a0b0f";
  readonly surface: "#111318";
  readonly surfaceElevated: "#1a1d24";
  readonly surfaceOverlay: "#252830";
  readonly border: "#252830";
  readonly borderStrong: "#3a3e48";
  readonly textPrimary: "#e5e7eb";
  readonly textSecondary: "#b0b4be";
  readonly textTertiary: "#8b8f9a";
  readonly textQuaternary: "#5c616e";
  readonly accent: "#3b82f6";
  readonly accentHover: "#60a5fa";
  readonly accentStrong: "#2563eb";
  readonly accentPressed: "oklch(48.8% 0.243 264.376)";
  readonly statusSuccess: "#4ade80";
  readonly statusSuccessStrong: "#22c55e";
  readonly statusWarning: "#facc15";
  readonly statusWarningStrong: "#eab308";
  readonly statusWarningMuted: "#eab30833";
  readonly statusDanger: "#f87171";
  readonly statusDangerStrong: "#ef4444";
  readonly statusInfo: "#60a5fa";
  readonly statusNeutral: "#8b8f9a";
  readonly bannerWarning: "oklch(76.9% 0.188 70.08)";
  readonly bannerWarningText: "oklch(92.4% 0.12 95.746)";
  readonly bannerWarningIcon: "oklch(82.8% 0.189 84.429)";
  readonly best: "oklch(82.8% 0.189 84.429)";
  readonly bannerSuccess: "oklch(69.6% 0.17 162.48)";
  readonly bannerSuccessText: "oklch(90.5% 0.093 164.15)";
  readonly bannerSuccessIcon: "oklch(76.5% 0.177 163.223)";
  readonly bannerInfoText: "oklch(88.2% 0.059 254.128)";
  readonly bannerErrorText: "oklch(88.5% 0.062 18.334)";
  readonly tileSelectedText: "oklch(21% 0.006 285.885)";
  readonly tileSelectedMuted: "oklch(55.2% 0.016 285.938)";
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
  readonly windTail: "#34d399";
  readonly windCross: "#fbbf24";
  readonly windHead: "#ef4444";
  readonly routeFuchsia: "#e879f9";
  readonly routeEmerald: "#34d399";
  readonly routeAmber: "#fbbf24";
  readonly routeViolet: "#a78bfa";
  readonly routeOrange: "#f97316";
  readonly routeRose: "#fb7185";
  readonly zoneSlate: "#94a3b8";
  readonly zoneBlue: "#60a5fa";
  readonly zoneEmerald: "#34d399";
  readonly zoneAmber: "#fbbf24";
  readonly zoneOrange: "#f97316";
  readonly zoneRed: "#ef4444";
  readonly zoneCrimson: "#dc2626";
  readonly zoneUnknown: "#888888";
  readonly guideBaseline: "#ffffff1a";
  readonly guideHover: "#ffffff40";
  readonly guideToday: "#ffffff14";
  readonly typeFeature: "#38bdf8";
  readonly typeBug: "#fb7185";
  readonly typeChore: "#a3e635";
  readonly white: "#ffffff";
  readonly white4: "rgb(255 255 255 / 0.04)";
  readonly white10: "rgb(255 255 255 / 0.1)";
  readonly white18: "rgb(255 255 255 / 0.18)";
  readonly white22: "rgb(255 255 255 / 0.22)";
  readonly white25: "rgb(255 255 255 / 0.25)";
  readonly white30: "rgb(255 255 255 / 0.3)";
  readonly white32: "rgb(255 255 255 / 0.32)";
  readonly white35: "rgb(255 255 255 / 0.35)";
  readonly white45: "rgb(255 255 255 / 0.45)";
  readonly white50: "rgb(255 255 255 / 0.5)";
  readonly white60: "rgb(255 255 255 / 0.6)";
  readonly white75: "rgb(255 255 255 / 0.75)";
  readonly white95: "rgb(255 255 255 / 0.95)";
};
export type TokenColor = (typeof tokens)[keyof typeof tokens];
export const fontSizes: { readonly '2xs': 11; readonly '3xs': 9; };
```

```ts
// packages/ui/tests/hooks/useScrollFadeEffect.spec.ts
// no exports
```

```ts
// packages/ui/tests/lib/scrollFade.spec.ts
// no exports
```

```ts
// apps/web/src/components/layout/VirtualItemList.tsx · not planned
export const VirtualItemList: <T>(props: VirtualItemListProps<T>) => ReactNode;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapCameraInputs.ts · not planned
export const useMapCameraInputs: ({ gpsData, tracks, }: { gpsData: SessionGPS[] | null; tracks: MapTrack[]; }) => MapCameraInputs;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapInteraction.ts · not planned
export const useMapInteraction: ({ mapRef, tracks, }: {
  mapRef: React.RefObject<MapRef | null>;
  tracks: MapTrack[];
}) => MapInteraction;
```

```ts
// apps/web/src/components/mapBackground/hooks/useSegmentsPickPopup.ts · not planned
export interface SegmentsPickPopupInfo {
  x: number;
  y: number;
  segments: Segment[];
}
export interface SegmentsPickPopupState {
  popup: SegmentsPickPopupInfo | null;
  onClick: (info: PickingInfo) => boolean;
  close: () => void;
}
export const useSegmentsPickPopup: (mapRef: React.RefObject<MapRef | null>) => SegmentsPickPopupState;
```

```ts
// apps/web/src/components/mapBackground/index.tsx · not planned
export const MapBackground: FC;
```

```ts
// apps/web/src/components/mapBackground/lapPath.ts · not planned
export const dimmedColor: (color: Color | Color[], factor: number) => Color | Color[];
export const nearestRecordIndex: ({ detail, coordinate, }: {
  detail: DetailPath;
  coordinate: [number, number];
}) => number | undefined;
export const lapVertexBounds: ({ detailPath, span, }: {
  detailPath: DetailPath;
  span: RecordSpan;
}) => {
  first: number;
  last: number;
} | null;
export const lapVertexBreaks: ({ detailPath, spans, }: { detailPath: DetailPath; spans: LapSpan[]; }) => number[];
export const lapSubPath: ({ detail, span, }: { detail: DetailPath; span: RecordSpan; }) => DetailPath | null;
export const pathBounds: (path: [number, number][]) => GPSBounds | null;
```

```ts
// apps/web/src/components/mapBackground/segmentBounds.ts · not planned
export const segmentBounds: (segment: Pick<Segment, "geometry">) => GPSBounds | null;
```

```ts
// apps/web/src/components/mapBackground/trackColors.ts · not planned
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
export const ALPHA_BY_TRACK_INTENSITY: Record<TrackIntensity, number>;
export const studioRouteModifiers: { width: { default: number; highlighted: number; }; alpha: { default: number; hidden: number; }; };
export const TRACK_COLOR_BY_SPORT: Record<Sport, [number, number, number]>;
export const BEST_MARKER_COLOR: [number, number, number];
export const geoAccuracyFill: [number, number, number, number];
export const geoAccuracyLine: [number, number, number, number];
export const geoDotFill: [number, number, number, number];
export const geoDotLine: [number, number, number, number];
export const HIGHLIGHT_TRANSITIONS: { getWidth: number; getColor: number; };
```

```ts
// apps/web/src/components/mapBackground/trackPicking.ts · not planned
export interface PickableTrack {
  sessionId: string;
  bounds: GPSBounds;
  path: [number, number][];
}
export const PICK_RADIUS: 25;
export const decodeCached: ({ sessionId, encoded, }: { sessionId: string; encoded: string; }) => [number, number][];
export const pickBoundsFromCorners: (a: GeoCorner, b: GeoCorner) => GPSBounds;
export const filterTracksByPickBounds: ({ tracks, pickBounds, }: { tracks: PickableTrack[]; pickBounds: GPSBounds; }) => string[];
export const pickSessionsAt: ({ map, info, tracks, }: {
  map: MapRef;
  info: Pick<PickingInfo, "x" | "y">;
  tracks: MapTrack[];
}) => TrainingSession[];
export const segmentsInPickBounds: ({ segments, pickBounds, }: { segments: Segment[]; pickBounds: GPSBounds; }) => Segment[];
export const pickSegmentsAt: ({ map, info, segments, }: {
  map: MapRef;
  info: Pick<PickingInfo, "x" | "y">;
  segments: Segment[];
}) => Segment[];
```

```ts
// apps/web/src/components/segments/BestHighlight.tsx · not planned
export const BestHighlight: FC<BestHighlightProps>;
```

```ts
// apps/web/src/components/segments/SegmentDetailSkeleton.tsx · not planned
export const SegmentDetailSkeleton: FC;
```

```ts
// apps/web/src/components/segments/SegmentItemSkeleton.tsx · not planned
export const SegmentItemSkeleton: FC;
```

```ts
// apps/web/src/components/segments/SegmentsEmpty.tsx · not planned
export const SegmentsEmpty: FC;
```

```ts
// apps/web/src/components/segments/SegmentsPickPopup.tsx · not planned
export const SegmentsPickPopup: FC<SegmentsPickPopupProps>;
```

```ts
// apps/web/src/components/segments/SegmentsUpdatingNote.tsx · not planned
export const SegmentsUpdatingNote: FC;
```

```ts
// apps/web/src/components/segments/charts/SegmentChannelChart.tsx · not planned
export const SegmentChannelChart: FC<SegmentChannelChartProps>;
```

```ts
// apps/web/src/components/segments/charts/SegmentChannelRail.tsx · not planned
export const SegmentChannelRail: FC<SegmentChannelRailProps>;
```

```ts
// apps/web/src/components/segments/charts/segmentChannels.ts · not planned
export interface ChannelRest {
  header: string;
  value: string;
  secondary?: string;
}
export const SPEC_BY_SEGMENT_CHANNEL: Record<"hr" | "power" | "speed" | "pace" | "gap" | "elevation" | "grade" | "cadence", ChannelSpec>;
export const channelIcon: ({ channel, sport, }: { channel: SegmentChannel; sport: Sport; }) => LucideIcon;
export const channelUnit: ({ channel, sport, }: { channel: SegmentChannel; sport: Sport; }) => string;
```

```ts
// apps/web/src/components/segments/charts/segmentExplorerHover.ts · not planned
export const SEGMENT_HOVER_GROUP: "segment-detail";
export const SECONDS_PER_MINUTE: 60;
export const hoverSegmentExplorer: ({ elapsedSec, selected, best, }: {
  elapsedSec: number | null;
  selected: PassSeries;
  best: PassSeries | undefined;
}) => void;
```

```ts
// apps/web/src/components/segments/hooks/useListExpansion.ts · not planned
export interface ListExpansion {
  expanded: boolean;
  toggle: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
}
export const useListExpansion: () => ListExpansion;
```

```ts
// apps/web/src/components/segments/hooks/useScatterScrollEndEffect.ts · not planned
export const useScatterScrollEndEffect: ({ ref, contentWidthPx, }: { ref: RefObject<HTMLElement | null>; contentWidthPx: number; }) => void;
```

```ts
// apps/web/src/components/segments/segmentFacts.ts · not planned
export const segmentFacts: (segment: Segment) => string[];
```

```ts
// apps/web/src/components/sessions/SessionList.tsx · not planned
export const SessionList: FC;
```

```ts
// apps/web/src/components/sessions/session/SessionSegmentList.tsx · not planned
export const COLLAPSED_SESSION_SEGMENTS: 5;
export const SessionSegmentList: FC<SessionSegmentListProps>;
```

```ts
// apps/web/src/lib/debug/pvDebug.ts · not planned
export const registerPvDebug: () => void;
```

```ts
// apps/web/src/lib/debug/segmentMetrics.ts · not planned
export const SEGMENT_DEBUG_FLAG_KEY: "pv:debug:segments";
export type SegmentDebugMode = 'off' | 'log' | 'cold';
export const segmentDebugMode: () => SegmentDebugMode;
export const latestSegmentMetrics: () => SegmentDetectionMetrics | null;
export const reportSegmentMetrics: (metrics: SegmentDetectionMetrics) => void;
```

```ts
// apps/web/src/routing/useRouteMatch.ts · not planned
export interface RouteMatch {
  id: string | undefined;
}
export const useRouteMatch: (page: SupportedPage) => RouteMatch | null;
```

```ts
// apps/web/tests/components/mapBackground/lapPath.spec.ts · not planned
// no exports
```

```ts
// apps/web/tests/components/mapBackground/segmentBounds.spec.ts · not planned
// no exports
```

```ts
// apps/web/tests/components/mapBackground/trackPicking.segments.spec.ts · not planned
// no exports
```

```ts
// apps/web/tests/factories/segments.ts · not planned
export const createMockStoredSegmentPass: (overrides?: Partial<StoredSegmentPass>) => StoredSegmentPass;
export const createMockSegment: (overrides?: Partial<Segment>) => Segment;
export const createMockStoredSegments: (overrides?: Partial<StoredSegments>) => StoredSegments;
export const createMockSegmentSessionMeta: (overrides?: Partial<SegmentSessionMeta>) => SegmentSessionMeta;
```

```ts
// apps/web/tests/lib/workers/segmentsContract.spec.ts · not planned
// no exports
```

```ts
// apps/web/tests/routing/useRouteMatch.spec.ts · not planned
// no exports
```

```ts
// packages/engine/tests/segments.perf.spec.ts · not planned
// no exports
```

```ts
// packages/testing/src/segments.ts · not planned
export const createMockSegmentPass: (overrides?: Partial<SegmentPass>) => SegmentPass;
export const createMockDetectedSegment: (overrides?: Partial<DetectedSegment>) => DetectedSegment;
export const createMockSegmentTrack: (overrides?: Partial<SegmentTrack>) => SegmentTrack;
```

```ts
// packages/ui/src/components/pvActionItem/PvActionItem.tsx · not planned
export type ActionItemSize = 'md' | 'sm';
export const PvActionItem: FC<PvActionItemProps>;
```

## Missing

- `apps/web/src/components/segments/SegmentsListHeader.tsx`: planned, not changed
- `apps/web/src/components/sessions/session/hooks/useSessionSegmentSelectionEffect.ts`: planned, not changed
- `apps/web/src/routing/useRouterQuery.ts`: planned, not changed
- `apps/web/src/components/sessions/session/ColorByControl.tsx`: planned, not changed
- `apps/web/src/components/sessions/session/MapViewControl.tsx`: planned, not changed
- `apps/web/src/components/mapBackground/SessionTerrain.tsx`: planned, not changed
- `apps/web/src/components/mapBackground/hooks/useDetailLayers.ts`: planned, not changed
- `apps/web/src/components/mapBackground/hooks/useTerrainTrackPickingEffect.ts`: planned, not changed
- `apps/web/src/components/charts/LapBands.tsx`: planned, not changed
- `apps/web/src/components/charts/LapBandShape.tsx`: planned, not changed
- `apps/web/src/components/sessions/charts/hooks/useSessionRailStats.ts`: planned, not changed
- `apps/web/tests/store/mapControls.spec.ts`: planned, not changed
