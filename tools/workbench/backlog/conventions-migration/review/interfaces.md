# Interfaces · conventions-migration

Generated 2026-10-26 by `vp run workbench:deps -- conventions-migration` from the TypeScript files changed since the base (as `files.json`): 880 planned, 22 not planned. The checker's types; compare with tech.md `## Interfaces`, the planned record.

```ts
// apps/web/e2e/dashboard.spec.ts
// no exports
```

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
// apps/web/e2e/labs.spec.ts
// no exports
```

```ts
// apps/web/e2e/onboarding.spec.ts
// no exports
```

```ts
// apps/web/e2e/sessions.spec.ts
// no exports
```

```ts
// apps/web/e2e/studio.spec.ts
// no exports
```

```ts
// apps/web/src/App.tsx
export const App: FC;
```

```ts
// apps/web/src/commonSnackbars.ts
export const COMMON_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/components/ExplanationBody.tsx
export const ExplanationBody: FC<ExplanationBodyProps>;
```

```ts
// apps/web/src/components/FallbackActions.tsx
export const FallbackActions: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/components/ImportProgressOverlay.tsx
export const ImportProgressOverlay: FC;
```

```ts
// apps/web/src/components/MetricLabel.tsx
export const MetricLabel: FC<MetricLabelProps>;
```

```ts
// apps/web/src/components/OverlayContent.tsx
export const OverlayContent: FC<OverlayContentProps>;
```

```ts
// apps/web/src/components/PaceRange.tsx
export const PaceRange: FC<PaceRangeProps>;
```

```ts
// apps/web/src/components/ProgressRing.tsx
export const ProgressRing: FC<ProgressRingProps>;
```

```ts
// apps/web/src/components/ReportBugButton.tsx
export const ReportBugButton: FC<ReportBugButtonProps>;
```

```ts
// apps/web/src/components/RootErrorFallback.tsx
export const RootErrorFallback: FC<RootErrorFallbackProps>;
```

```ts
// apps/web/src/components/RouteErrorFallback.tsx
export const RouteErrorFallback: FC<FallbackProps>;
```

```ts
// apps/web/src/components/ToastHost.tsx
export const ToastHost: FC;
```

```ts
// apps/web/src/components/charts/LapBandShape.tsx
export const LapBandShape: FC<LapBandShapeProps>;
```

```ts
// apps/web/src/components/charts/LapBands.tsx
export const LAP_STRIP_TICK_MARGIN: 12;
export const LapBands: <K extends string, T extends Record<K, number>>(props: LapBandsProps<K, T>) => any;
```

```ts
// apps/web/src/components/charts/MultiSeriesRail.tsx
export const MultiSeriesRail: FC<MultiSeriesRailProps>;
```

```ts
// apps/web/src/components/charts/SeriesRail.tsx
export const SeriesRail: FC<SeriesRailProps>;
```

```ts
// apps/web/src/components/charts/hooks/useZoneLineStroke.tsx
export const useZoneLineStroke: ({ scale, values, reversed, }: {
  scale: ColorScale | undefined;
  values: Array<number | null | undefined>;
  reversed: boolean;
}) => ZoneLineStroke;
```

```ts
// apps/web/src/components/charts/types.ts
export interface RailReading {
  value: ReactNode;
  secondary?: ReactNode;
  note?: StatRailNote;
}
export interface AreaShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}
```

```ts
// apps/web/src/components/importProgressCopy.ts
export const foregroundLabel: (foreground: ForegroundImport) => string;
export const summaryTitle: (summary: ImportSummary) => string;
export const summaryDescription: (summary: ImportSummary) => string;
```

```ts
// apps/web/src/components/layout/AppLayout.tsx
export const AppLayout: FC;
```

```ts
// apps/web/src/components/layout/DemoBanner.tsx
export const DemoBanner: FC;
```

```ts
// apps/web/src/components/layout/Dock.tsx
export const Dock: FC;
```

```ts
// apps/web/src/components/layout/DockBar.tsx
export const DockBar: FC<DockBarProps>;
```

```ts
// apps/web/src/components/layout/DockCircle.tsx
export const DockCircle: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/components/layout/DockFilterButton.tsx
export const DockFilterButton: FC<DockFilterButtonProps>;
```

```ts
// apps/web/src/components/layout/DockLocateButton.tsx
export const DockLocateButton: FC<DockLocateButtonProps>;
```

```ts
// apps/web/src/components/layout/DockRail.tsx
export const DockRail: FC<DockRailProps>;
```

```ts
// apps/web/src/components/layout/DockSegment.tsx
export const DockSegment: FC<DockSegmentProps>;
```

```ts
// apps/web/src/components/layout/DockTabs.tsx
export const DockTabs: FC<DockTabsProps>;
```

```ts
// apps/web/src/components/layout/MobileSheet.tsx
export const MobileSheet: FC;
```

```ts
// apps/web/src/components/layout/NewerVersionOverlay.tsx
export const NewerVersionOverlay: FC;
```

```ts
// apps/web/src/components/layout/RouteContent.tsx
export const RouteContent: FC;
```

```ts
// apps/web/src/components/layout/dockItemClasses.ts
export const itemClasses: Record<"rail" | "pill" | "circle", string>;
export const itemClass: "relative shrink-0 rounded-full text-text-tertiary";
export const activeItemClass: "bg-accent-muted text-accent-hover hover:bg-accent-muted hover:text-accent-hover";
export const segmentClass: any;
```

```ts
// apps/web/src/components/layout/types.ts
export type DockItemKind = 'rail' | 'circle';
export interface DockList {
  open: boolean;
  close: () => void;
  toggle: () => void;
  handleTabClick: () => void;
}
```

```ts
// apps/web/src/components/layout/useDockList.ts
export const useDockList: () => DockList;
```

```ts
// apps/web/src/components/layout/useOverscrollLockEffect.ts
export const useOverscrollLockEffect: () => void;
```

```ts
// apps/web/src/components/useHeldReprocess.ts
export const MIN_OPEN_MS: number;
export const useHeldReprocess: (foreground: ForegroundImport | null) => ForegroundImport | null;
```

```ts
// apps/web/src/components/useMinOpenTimeReached.ts
export const useMinOpenTimeReached: (openedAt: number) => boolean;
```

```ts
// apps/web/src/features/dashboard/ACWRGauge.tsx
export const ACWRGauge: FC;
```

```ts
// apps/web/src/features/dashboard/DashboardPeek.tsx
export const DashboardPeek: FC;
```

```ts
// apps/web/src/features/dashboard/DashboardZoomReset.tsx
export const DashboardZoomReset: FC;
```

```ts
// apps/web/src/features/dashboard/FormStatusCard.tsx
export const FormStatusCard: FC;
```

```ts
// apps/web/src/features/dashboard/LegendLine.tsx
export const LegendLine: FC<LegendLineProps>;
```

```ts
// apps/web/src/features/dashboard/LoadBucketBand.tsx
export const LoadBucketBand: FC<LoadBucketBandProps>;
```

```ts
// apps/web/src/features/dashboard/LoadChart.tsx
export const LoadChart: FC;
```

```ts
// apps/web/src/features/dashboard/PerformanceChart.tsx
export const PerformanceChart: FC;
```

```ts
// apps/web/src/features/dashboard/ReadinessGauge.tsx
export const ReadinessGauge: FC;
```

```ts
// apps/web/src/features/dashboard/VolumeChart.tsx
export const VolumeChart: FC;
```

```ts
// apps/web/src/features/dashboard/dashboardDate.ts
export const formatDashboardDate: (x: ChartHoverX) => string;
```

```ts
// apps/web/src/features/dashboard/hooks/useDashboardAxis.ts
export interface DashboardAxis {
  history: DailyMetrics[];
  sportTss: FilteredMetrics['sportTss'];
  sessions: TrainingSession[];
  days: DashboardZoomRange['days'];
  onZoomComplete: DashboardZoomRange['onZoomComplete'];
}
export const useDashboardAxis: () => DashboardAxis;
```

```ts
// apps/web/src/features/dashboard/hooks/useDashboardChartEvents.ts
export const DASHBOARD_HOVER_GROUP: "dashboard";
export const useDashboardChartEvents: (zoom: DashboardChartZoom) => DashboardChartEvents;
```

```ts
// apps/web/src/features/dashboard/hooks/useDashboardChartZoom.ts
export interface DashboardZoomRange {
  days: { from: string; to: string; count: number } | null;
  onZoomComplete: (from: string | number, to: string | number) => void;
}
export const useDashboardChartZoom: () => DashboardZoomRange;
```

```ts
// apps/web/src/features/dashboard/hooks/useDashboardSports.ts
export const useDashboardSports: () => Sport[];
```

```ts
// apps/web/src/features/dashboard/hooks/useFilteredMetrics.ts
export interface FilteredMetrics {
  history: DailyMetrics[];
  sportTss: Map<string, Record<string, number>>;
  sessions: TrainingSession[];
}
export const useFilteredMetrics: () => FilteredMetrics;
```

```ts
// apps/web/src/features/dashboard/hooks/useLoadChartData.ts
export const useLoadChartData: (axis: DashboardAxis) => LoadChartData;
```

```ts
// apps/web/src/features/dashboard/hooks/useMetrics.ts
export const useMetrics: () => TrainingMetrics;
```

```ts
// apps/web/src/features/dashboard/hooks/useVolumeChartRails.ts
export const useVolumeChartRails: ({ series, metric, }: { series: VolumeSeries; metric: VolumeMetric; }) => VolumeChartRails;
```

```ts
// apps/web/src/features/dashboard/hooks/useVolumeSeries.ts
export interface VolumeRow {
  date: string;
  current: number | null;
  before: number | null;
  running: number | null;
  cycling: number | null;
}
export interface VolumeSeries {
  rows: VolumeRow[];
  current: VolumeTotal[];
  before: VolumeTotal[] | null;
  beforeLabel: string | null;
  indexByDate: Map<ChartHoverX, number>;
  ticks: number[] | undefined;
}
export const useVolumeSeries: (axis: DashboardAxis) => VolumeSeries;
```

```ts
// apps/web/src/features/dashboard/types.ts
export const sportColors: Record<Sport, TokenColor>;
```

```ts
// apps/web/src/features/demo/buildDemoDataset.ts
export const DEMO_SEED: 20260518;
export const DEMO_PERSONA: DemoPersona & { gender: Gender; birthYear: number; thresholdHr: number; };
export type DemoSession = Omit<TrainingSession, 'createdAt' | 'isNew'>;
export interface DemoSessionData {
  sessionId: string;
  records: SessionRecord[];
  laps: SessionLap[];
}
export interface DemoDataset {
  profile: Omit<UserProfile, 'id' | 'createdAt'>;
  sessions: DemoSession[];
  sessionData: DemoSessionData[];
  trips: Array<{ name: string; description: string; sessionIds: string[] }>;
  studioRoutes: Array<{ name: string; sourceFileName: string; points: ParsedGpxPoint[] }>;
}
export const buildDemoDataset: (input: { seed: number; today: Date; routes: DemoRoutesJson; }) => DemoDataset;
```

```ts
// apps/web/src/features/demo/demoRecords.ts
export type DemoRoutesJson = z.infer<typeof demoRoutesJsonSchema>;
export const parseDemoRoutes: (data: unknown) => DemoRoutesJson | undefined;
export interface DemoRoutePoint {
  lat: number;
  lng: number;
  ele: number;
}
export interface DemoRoute {
  key: string;
  name: string;
  points: DemoRoutePoint[];
  /** Cumulative distance in metres at each point. */
  cumulative: number[];
  length: number;
}
export const prepareRoute: (json: z.infer<typeof demoRouteJsonSchema>) => DemoRoute;
export const routeAt: ({ route, distance, }: { route: DemoRoute; distance: number; }) => DemoRoutePoint;
export interface DemoPersona {
  maxHr: number;
  restHr: number;
  ftp: number;
  /** sec/km */
  thresholdPace: number;
}
export interface SimulateInput {
  sport: Sport;
  workout: DemoWorkout;
  route: DemoRoute | undefined;
  persona: DemoPersona;
  rng: SeededRandom;
  /** Per-session form: scales every step's effort. */
  effortScale: number;
  hrRecorded: boolean;
  /** Traffic lights in the first and last kilometres of a city ride. */
  cityStops: boolean;
}
export interface SimulatedSession {
  records: SessionRecord[];
  /** Record index where each step begins (shared with the previous step's end). */
  stepStarts: number[];
  /** Timer seconds from the first to the last record. */
  duration: number;
}
export const simulateSession: (input: SimulateInput) => SimulatedSession;
export const buildDemoLaps: ({ sport, workout, simulated, sessionStart, }: {
  sport: Sport;
  workout: DemoWorkout;
  simulated: SimulatedSession;
  sessionStart: number;
}) => SessionLap[];
export const elevationTotals: (records: SessionRecord[]) => { gain: number; loss: number; } | undefined;
```

```ts
// apps/web/src/features/demo/demoSchedule.ts
export const FLAUCHER_EASY: "Flaucher easy";
export const ISAR_800S: "6×800 m Isar";
export const STARNBERGER_LONG_RIDE: "Starnberger See long ride";
export const TEGERNSEE_LOOP: "Tegernsee loop";
export const GARDA_TRIP: "Lake Garda";
export type DemoLapIntensity = 'warmup' | 'active' | 'rest' | 'cooldown';
export interface DemoStep {
  intensity: DemoLapIntensity;
  effort: number;
  distance?: number;
  duration?: number;
}
export interface DemoWorkout {
  name: string;
  sport: Sport;
  /** Route key in `demoRoutes.json`; missing for indoor sessions. */
  route?: string;
  loops?: number;
  subSport?: 'treadmill' | 'indoor_cycling';
  /** One step = steady session with device auto-laps; several = one lap per step. */
  steps: DemoStep[];
}
export interface DemoScheduleEntry {
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  /** Local wall-clock start time, `HH:MM`. */
  start: string;
  workout: DemoWorkoutKey;
  /** Ride without a chest strap: power only, no HR. */
  noHr?: boolean;
  trip?: 'garda';
}
export interface DemoWeek {
  /** Weeks before the final week: 0 = last week of the plan. */
  weeksBeforeEnd: number;
  entries: DemoScheduleEntry[];
}
export const DEMO_WORKOUTS: {
  flaucherEasy: { name: string; sport: string; route: string; steps: DemoStep[]; };
  isarSouthEasy: { name: string; sport: string; route: string; steps: DemoStep[]; };
  isarNorthRecovery: { name: string; sport: string; route: string; steps: DemoStep[]; };
  westparkEasy: { name: string; sport: string; route: string; steps: DemoStep[]; };
  theresienwieseShakeout: { name: string; sport: string; route: string; steps: DemoStep[]; };
  englischerGarten: { name: string; sport: string; route: string; steps: DemoStep[]; };
  olympiaparkLong: { name: string; sport: string; route: string; steps: DemoStep[]; };
  isarLong: { name: string; sport: string; route: string; steps: DemoStep[]; };
  halfMarathon: { name: string; sport: string; route: string; steps: { intensity: "active"; effort: number; distance: number; }[]; };
  isar800s: { name: string; sport: string; route: string; steps: ({ intensity: "warmup"; effort: number; distance: number; } | { intensity: "active"; effort: number; distance: number; } | { intensity: "rest"; effort: number; distance: number; } | { intensity: "cooldown"; effort: number; distance: number; })[]; };
  isar1ks: { name: string; sport: string; route: string; steps: ({ intensity: "warmup"; effort: number; distance: number; duration?: undefined; } | { intensity: "active"; effort: number; distance: number; duration?: undefined; } | { intensity: "rest"; effort: number; duration: number; distance?: undefined; } | { intensity: "cooldown"; effort: number; distance: number; duration?: undefined; })[]; };
  tempo2ks: { name: string; sport: string; route: string; steps: ({ intensity: "warmup"; effort: number; distance: number; } | { intensity: "active"; effort: number; distance: number; } | { intensity: "rest"; effort: number; distance: number; } | { intensity: "cooldown"; effort: number; distance: number; })[]; };
  treadmillEasy: { name: string; sport: string; subSport: "treadmill"; steps: DemoStep[]; };
  treadmillShort: { name: string; sport: string; subSport: "treadmill"; steps: DemoStep[]; };
  indoorEndurance: { name: string; sport: string; subSport: "indoor_cycling"; steps: DemoStep[]; };
  indoorSweetSpot: { name: string; sport: string; subSport: "indoor_cycling"; steps: ({ intensity: "warmup"; effort: number; duration: number; } | { intensity: "active"; effort: number; duration: number; } | { intensity: "rest"; effort: number; duration: number; } | { intensity: "cooldown"; effort: number; duration: number; })[]; };
  garchingRide: { name: string; sport: string; route: string; steps: DemoStep[]; };
  gruenwaldRide: { name: string; sport: string; route: string; steps: DemoStep[]; };
  dachauRide: { name: string; sport: string; route: string; steps: DemoStep[]; };
  marktSchwabenRide: { name: string; sport: string; route: string; steps: DemoStep[]; };
  starnbergerLong: { name: string; sport: string; route: string; steps: DemoStep[]; };
  wolfratshausenRide: { name: string; sport: string; route: string; steps: DemoStep[]; };
  gardaTenno: { name: string; sport: string; route: string; steps: DemoStep[]; };
  gardaLoppio: { name: string; sport: string; route: string; steps: DemoStep[]; };
  gardaArco: { name: string; sport: string; route: string; steps: DemoStep[]; };
  gardaTorbole: { name: string; sport: string; route: string; steps: DemoStep[]; };
};
export type DemoWorkoutKey = keyof typeof DEMO_WORKOUTS;
export const DEMO_WEEKS: DemoWeek[];
```

```ts
// apps/web/src/features/demo/loadDemoData.ts
export const loadDemoData: (queryClient: QueryClient) => Promise<number>;
```

```ts
// apps/web/src/features/filters/FilterEmptyState.tsx
export const FilterEmptyState: FC;
```

```ts
// apps/web/src/features/filters/hooks/useFilterBuilder.ts
export const useFilterBuilder: ({ open, onClose, }: { open: boolean; onClose: () => void; }) => FilterBuilder;
```

```ts
// apps/web/src/features/filters/hooks/useNotUnderstoodHint.ts
export const useNotUnderstoodHint: ({ text, interpretations, }: { text: string; interpretations: FilterCriteria[]; }) => boolean;
```

```ts
// apps/web/src/features/filters/index.tsx
export const Filters: FC<FiltersProps>;
```

```ts
// apps/web/src/features/intervals/ErrorLine.tsx
export const ErrorLine: FC<ErrorLineProps>;
```

```ts
// apps/web/src/features/intervals/IntervalsStatusLine.tsx
export const IntervalsStatusLine: FC<IntervalsStatusLineProps>;
```

```ts
// apps/web/src/features/intervals/LoadingLine.tsx
export const LoadingLine: FC<LoadingLineProps>;
```

```ts
// apps/web/src/features/intervals/hooks/useIntervalsImport.ts
export const useIntervalsImport: ({ keyInput, onSynced, profileGate, }: {
  keyInput: string;
  onSynced: (() => void) | undefined;
  profileGate: ProfileGate | undefined;
}) => IntervalsImport;
```

```ts
// apps/web/src/features/intervals/hooks/useIntervalsKeyInput.ts
export const useIntervalsKeyInput: (storedKey: string | null) => IntervalsKeyInput;
```

```ts
// apps/web/src/features/intervals/index.tsx
export const Intervals: FC<IntervalsProps>;
```

```ts
// apps/web/src/features/intervals/runIntervalsImport.ts
export const runIntervalsImport: ({ apiKey, profile, activities, onProgress, queryClient, markNew, onSaving, onChunkIngested, }: {
  apiKey: string;
  profile: UserProfile;
  activities: IntervalsActivity[];
  onProgress: (processed: number) => void;
  queryClient: QueryClient;
  markNew?: boolean;
  onSaving?: () => void;
  onChunkIngested: (activityIds: string[]) => void;
}) => Promise<IntervalsImportResult>;
```

```ts
// apps/web/src/features/intervals/runIntervalsSync.ts
export interface IntervalsSyncSummary {
  available: number;
  pending: number;
  imported: number;
  duplicated: number;
  failed: number;
}
export const runIntervalsSync: (options: {
  queryClient: QueryClient;
  apiKey: string | null;
  full?: boolean;
  foreground?: boolean;
}) => Promise<IntervalsSyncSummary>;
```

```ts
// apps/web/src/features/intervals/types.ts
export type IntervalsKeyCheck =
  | { kind: 'checking' }
  | { kind: 'valid' }
  | { kind: 'rejected' }
  | { kind: 'failed'; message: string };
```

```ts
// apps/web/src/features/labs/LabsPeek.tsx
export const LabsPeek: FC;
```

```ts
// apps/web/src/features/labs/PaceCalculator.tsx
export const PaceCalculator: FC;
```

```ts
// apps/web/src/features/labs/RacePredictor.tsx
export const RacePredictor: FC;
```

```ts
// apps/web/src/features/labs/StepRow.tsx
export const StepRow: FC<StepRowProps>;
```

```ts
// apps/web/src/features/labs/WeeklyPlanTimeline.tsx
export const WeeklyPlanTimeline: FC<WeeklyPlanTimelineProps>;
```

```ts
// apps/web/src/features/labs/WorkoutCard.tsx
export const WorkoutCard: FC<WorkoutCardProps>;
```

```ts
// apps/web/src/features/labs/WorkoutExpansionPanel.tsx
export const WorkoutExpansionPanel: FC<WorkoutExpansionPanelProps>;
```

```ts
// apps/web/src/features/labs/hooks/useCoachPlan.ts
export const useCoachPlan: () => CoachPlan;
```

```ts
// apps/web/src/features/labs/hooks/usePaceCalculator.ts
export const usePaceCalculator: () => PaceCalculatorForm;
```

```ts
// apps/web/src/features/labs/hooks/useRacePredictor.ts
export const useRacePredictor: () => RacePredictorForm;
```

```ts
// apps/web/src/features/labs/workoutDisplay.ts
export const WORKOUT_ICONS: Record<WorkoutType, LucideIcon>;
export const STEP_LABELS: Record<string, () => string>;
```

```ts
// apps/web/src/features/map/DeckGLOverlay.tsx
export const DeckGLOverlay: FC<DeckGLOverlayProps>;
```

```ts
// apps/web/src/features/map/DeckOverlayControl.tsx
export const DeckOverlayControl: FC<DeckOverlayControlProps>;
```

```ts
// apps/web/src/features/map/MapBackground.tsx
export const MapBackground: FC;
```

```ts
// apps/web/src/features/map/MapControlsBar.tsx
export const MapControlsBar: FC<MapControlsBarProps>;
```

```ts
// apps/web/src/features/map/MapPickPopup.tsx
export const MapPickPopup: FC<MapPickPopupProps>;
```

```ts
// apps/web/src/features/map/OverviewMapControls.tsx
export const OverviewMapControls: FC;
```

```ts
// apps/web/src/features/map/RampSwatch.tsx
export const RampSwatch: FC<RampSwatchProps>;
```

```ts
// apps/web/src/features/map/SessionTerrain.tsx
export const SessionTerrain: FC<SessionTerrainProps>;
```

```ts
// apps/web/src/features/map/TrackIntensityControl.tsx
export const TrackIntensityControl: FC;
```

```ts
// apps/web/src/features/map/gpsBuild.worker.ts
// no exports
```

```ts
// apps/web/src/features/map/gpsBuildContract.ts
export const workerMessageInSchema: z.ZodObject<{ type: z.ZodLiteral<"build">; sessionIds: z.ZodArray<z.ZodString>; }, z.core.$strip>;
export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;
export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
```

```ts
// apps/web/src/features/map/hooks/cameraRuns.ts
export interface CameraRuns {
  token: number;
  cancelEase: (() => void) | null;
  limit: { sessionId: string; off: () => void } | null;
}
export const cancelRunning: (runs: CameraRuns) => void;
export const clearZoomLimit: ({ map, runs }: { map: MapLibreMap; runs: CameraRuns; }) => void;
```

```ts
// apps/web/src/features/map/hooks/types.ts
export interface MapTrack {
  sessionId: string;
  sport: Sport;
  gps: SessionGPS;
  session: TrainingSession;
}
export type PickHandler = (info: PickingInfo, event: unknown) => boolean | void;
export interface DeckEventHandlers {
  onClick?: PickHandler;
  onHover?: PickHandler;
}
```

```ts
// apps/web/src/features/map/hooks/useCameraRuns.ts
export const useCameraRuns: (map: MapLibreMap | undefined) => RefObject<CameraRuns>;
```

```ts
// apps/web/src/features/map/hooks/useDeckEventHandlers.ts
export const useDeckEventHandlers: ({ onClick, onHover, }: {
  onClick: PickHandler | undefined;
  onHover: PickHandler | undefined;
}) => DeckEventHandlers;
```

```ts
// apps/web/src/features/map/hooks/useDetailLayers.ts
export const useDetailLayers: ({ terrain, eventHandlers, }: {
  terrain: boolean;
  eventHandlers: DeckEventHandlers;
}) => DetailLayers;
```

```ts
// apps/web/src/features/map/hooks/useGeoLayers.ts
export const useGeoLayers: (terrain: boolean) => LayersList | null;
```

```ts
// apps/web/src/features/map/hooks/useGeolocationCameraEffect.ts
export const useGeolocationCameraEffect: (mapRef: React.RefObject<MapRef | null>) => void;
```

```ts
// apps/web/src/features/map/hooks/useLapLayers.ts
export const useLapLayers: ({ terrain, detailPath, }: { terrain: boolean; detailPath: DetailPath | null; }) => LapLayers;
```

```ts
// apps/web/src/features/map/hooks/useMapBackgroundEffects.ts
export const useMapBackgroundEffects: ({ mapRef, mapLoaded, }: { mapRef: React.RefObject<MapRef | null>; mapLoaded: boolean; }) => void;
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
// apps/web/src/features/map/hooks/useMapCameraInputs.ts
export const useMapCameraInputs: ({ gpsData, tracks, }: { gpsData: SessionGPS[] | null; tracks: MapTrack[]; }) => MapCameraInputs;
```

```ts
// apps/web/src/features/map/hooks/useMapCameraTarget.ts
export const useMapCameraTarget: () => MapCameraTarget;
```

```ts
// apps/web/src/features/map/hooks/useMapHover.ts
export const useMapHover: ({ kind, id }: { kind: MapHoverKind; id: string; }) => MapHoverHandlers;
```

```ts
// apps/web/src/features/map/hooks/useMapInteraction.ts
export const useMapInteraction: ({ mapRef, tracks, }: {
  mapRef: React.RefObject<MapRef | null>;
  tracks: MapTrack[];
}) => MapInteraction;
```

```ts
// apps/web/src/features/map/hooks/useMapPopupState.ts
export interface MapPopupState {
  popup: PopupInfo | null;
  hoveringTrack: boolean;
  interactive: boolean;
  onClick: PickHandler;
  onHover: PickHandler;
  closePopup: () => void;
  onPointerLeave: () => void;
}
export const useMapPopupState: ({ mapRef, tracks, }: {
  mapRef: React.RefObject<MapRef | null>;
  tracks: MapTrack[];
}) => MapPopupState;
```

```ts
// apps/web/src/features/map/hooks/useMapRendererHandOver.ts
export const useMapRendererHandOver: ({ terrain, mapLoaded, }: { terrain: boolean; mapLoaded: boolean; }) => MapRendererHandOver;
```

```ts
// apps/web/src/features/map/hooks/useMapTerrainEffect.ts
export const useMapTerrainEffect: () => void;
```

```ts
// apps/web/src/features/map/hooks/useMapTracks.ts
export const useMapTracks: (gpsData: SessionGPS[] | null) => MapTrack[];
```

```ts
// apps/web/src/features/map/hooks/useOnboardingPreviewCameraEffect.ts
export const useOnboardingPreviewCameraEffect: () => void;
```

```ts
// apps/web/src/features/map/hooks/useOnboardingPreviewLayer.ts
export const useOnboardingPreviewLayer: () => PathLayer<PreviewSlice> | null;
```

```ts
// apps/web/src/features/map/hooks/useOpenedSessionEffect.ts
export const useOpenedSessionEffect: (sessionId: string | null) => void;
```

```ts
// apps/web/src/features/map/hooks/useOverviewMapControlsEffect.ts
export const useOverviewMapControlsEffect: (tracks: MapTrack[]) => void;
```

```ts
// apps/web/src/features/map/hooks/usePickLayers.ts
export const usePickLayers: (terrain: boolean) => PickLayers;
```

```ts
// apps/web/src/features/map/hooks/useSessionDetailPath.ts
export const useSessionDetailPath: ({ hoveredSessionId, openedSessionId, sessions, }: {
  hoveredSessionId: string | null;
  openedSessionId: string | null;
  sessions: TrainingSession[];
}) => DetailPath | null;
```

```ts
// apps/web/src/features/map/hooks/useSessionFitBounds.ts
export const useSessionFitBounds: ({ gpsData, sessionId, }: {
  gpsData: SessionGPS[] | null;
  sessionId: string | null;
}) => GPSBounds | null;
```

```ts
// apps/web/src/features/map/hooks/useStudioMapTracks.ts
export const useStudioMapTracks: () => StudioMapTracks;
```

```ts
// apps/web/src/features/map/hooks/useStudioRouteLayer.ts
export const useStudioRouteLayer: (eventHandlers: DeckEventHandlers) => Layer | null;
```

```ts
// apps/web/src/features/map/hooks/useSuppressTapMouseEffect.ts
export const useSuppressTapMouseEffect: ({ mapRef, mapLoaded, }: { mapRef: React.RefObject<MapRef | null>; mapLoaded: boolean; }) => void;
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
// apps/web/src/features/map/hooks/useTrackLayers.ts
export const useTrackLayers: ({ tracks, eventHandlers, }: {
  tracks: MapTrack[];
  eventHandlers: DeckEventHandlers;
}) => LayersList | null;
```

```ts
// apps/web/src/features/map/hooks/useWatchPositionEffect.ts
export const useWatchPositionEffect: () => void;
```

```ts
// apps/web/src/features/map/lapPath.ts
export const dimmedColor: (color: Color | Color[], factor: number) => Color | Color[];
export const nearestRecordIndex: ({ detail, coordinate, }: {
  detail: DetailPath;
  coordinate: [number, number];
}) => number | undefined;
export const lapVertexBounds: ({ detailPath, span, }: {
  detailPath: DetailPath;
  span: LapSpan;
}) => {
  first: number;
  last: number;
} | null;
export const lapVertexBreaks: ({ detailPath, spans, }: { detailPath: DetailPath; spans: LapSpan[]; }) => number[];
export const lapSubPath: ({ detail, span, }: { detail: DetailPath; span: LapSpan; }) => DetailPath | null;
export const pathBounds: (path: [number, number][]) => GPSBounds | null;
```

```ts
// apps/web/src/features/map/mapPadding.ts
export const MAP_FIT_MARGIN: 80;
export const MAP_CONTROLS_HEIGHT: 44;
export const MAP_CONTROLS_BOTTOM: 40;
export const mapPadding: (margin: number, options?: MapPaddingOptions) => MapPadding;
```

```ts
// apps/web/src/features/map/popupSafeZone.ts
export const popupCollisionPadding: (desktop: boolean) => { left: number; top: number; right: number; bottom: number; };
```

```ts
// apps/web/src/features/map/previewDrawIn.ts
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
export const buildPreviewPasses: (routes: PreviewRoute[]) => PreviewPasses;
export const previewDrawInEnd: (passes: PreviewPass[]) => number;
export const slicePath: ({ pass, elapsedMs, }: { pass: PreviewPass; elapsedMs: number; }) => [number, number][];
```

```ts
// apps/web/src/features/map/terrainCamera.ts
export const ENTRY_PITCH: 30;
export const DEM_SETTLE_TIMEOUT_MS: 500;
export const LAP_FIT_DURATION_MS: 800;
export const SESSION_FIT_DURATION_MS: number;
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
// apps/web/src/features/map/trackColors.ts
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
export const HIGHLIGHT_TRANSITIONS: { getWidth: number; getColor: number; };
```

```ts
// apps/web/src/features/map/trackPicking.ts
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
```

```ts
// apps/web/src/features/map/zoneColoredPath.ts
export interface DetailPath {
  path: [number, number][];
  recordIndices: number[];
  color: Color | Color[];
  elevations: Array<number | null>;
}
export const buildZoneColoredPath: ({ records, metric, scale, }: {
  records: SessionRecord[];
  metric: TrackMetric;
  scale: ColorScale;
}) => DetailPath | null;
export const buildWindColoredPath: ({ records, angles, }: {
  records: SessionRecord[];
  angles: Array<number | undefined>;
}) => DetailPath | null;
export const buildSportColoredPath: ({ records, sportColor, }: { records: SessionRecord[]; sportColor: Color; }) => DetailPath | null;
```

```ts
// apps/web/src/features/onboarding/BackButton.tsx
export const BackButton: FC;
```

```ts
// apps/web/src/features/onboarding/CardBody.tsx
export const CardBody: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/features/onboarding/ContinueButton.tsx
export const ContinueButton: FC<ContinueButtonProps>;
```

```ts
// apps/web/src/features/onboarding/DesktopOnboarding.tsx
export const DesktopOnboarding: FC<ShellProps>;
```

```ts
// apps/web/src/features/onboarding/FieldInput.tsx
export const FieldInput: FC<FieldInputProps>;
```

```ts
// apps/web/src/features/onboarding/GenderPick.tsx
export const GenderPick: FC<GenderPickProps>;
```

```ts
// apps/web/src/features/onboarding/OnboardingCrumbs.tsx
export const OnboardingCrumbs: FC;
```

```ts
// apps/web/src/features/onboarding/OnboardingHeading.tsx
export const OnboardingHeading: FC<OnboardingHeadingProps>;
```

```ts
// apps/web/src/features/onboarding/OnboardingIntro.tsx
export const OnboardingIntro: FC<OnboardingIntroProps>;
```

```ts
// apps/web/src/features/onboarding/OnboardingIntroActions.tsx
export const OnboardingIntroActions: FC<OnboardingIntroActionsProps>;
```

```ts
// apps/web/src/features/onboarding/OnboardingProgress.tsx
export const OnboardingProgress: FC;
```

```ts
// apps/web/src/features/onboarding/OnboardingStep.tsx
export const OnboardingStep: FC<StepProps>;
```

```ts
// apps/web/src/features/onboarding/PhoneCard.tsx
export const PhoneCard: FC<ShellProps>;
```

```ts
// apps/web/src/features/onboarding/PhoneOnboarding.tsx
export const PhoneOnboarding: FC<ShellProps>;
```

```ts
// apps/web/src/features/onboarding/ReopenPill.tsx
export const ReopenPill: FC;
```

```ts
// apps/web/src/features/onboarding/SourcePicker.tsx
export const SourcePicker: FC<SourcePickerProps>;
```

```ts
// apps/web/src/features/onboarding/ThresholdFields.tsx
export const ThresholdFields: FC<ThresholdFieldsProps>;
```

```ts
// apps/web/src/features/onboarding/YouFields.tsx
export const YouFields: FC<YouFieldsProps>;
```

```ts
// apps/web/src/features/onboarding/hooks/useRevealOnboardingPreviewEffect.ts
export const useRevealOnboardingPreviewEffect: () => void;
```

```ts
// apps/web/src/features/onboarding/hooks/useStepFocusEffect.ts
export const useStepFocusEffect: ({ step, headingRef, }: {
  step: OnboardingStep;
  headingRef: RefObject<HTMLElement | null>;
}) => void;
```

```ts
// apps/web/src/features/onboarding/index.tsx
export const Onboarding: FC;
```

```ts
// apps/web/src/features/onboarding/onboardingFields.ts
export const fieldId: (field: FormField) => string;
```

```ts
// apps/web/src/features/onboarding/onboardingScreens.tsx
export const screenOf: ({ step, source, props, profileGate, }: {
  step: Step;
  source: OnboardingSource | null;
  props: StepProps;
  profileGate: ProfileGate;
}) => Screen;
```

```ts
// apps/web/src/features/onboarding/types.ts
export type OnboardingShell = 'card' | 'dialog';
export interface ShellProps {
  thresholds: ThresholdsForm;
  onDemo: () => void;
}
export interface StepProps {
  shell: OnboardingShell;
  thresholds: ThresholdsForm;
  onDemo: () => void;
}
```

```ts
// apps/web/src/features/records/SportRecordsCard.tsx
export const SportRecordsCard: FC<SportRecordsCardProps>;
```

```ts
// apps/web/src/features/records/index.tsx
export const Records: FC;
```

```ts
// apps/web/src/features/records/personalBests.worker.ts
// no exports
```

```ts
// apps/web/src/features/records/personalBestsContract.ts
export type PBSessionMeta = z.infer<typeof pbSessionMetaSchema>;
export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;
export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
```

```ts
// apps/web/src/features/sessions/FitUploadButton.tsx
export const FitUploadButton: FC<FitUploadButtonProps>;
```

```ts
// apps/web/src/features/sessions/SessionHeader.tsx
export const SessionHeader: FC<SessionHeaderProps>;
```

```ts
// apps/web/src/features/sessions/SessionItem.tsx
export const SessionItem: FC<SessionItemProps>;
```

```ts
// apps/web/src/features/sessions/SessionList.tsx
export const SessionList: FC;
```

```ts
// apps/web/src/features/sessions/SessionPeek.tsx
export const SessionPeek: FC<SessionPeekProps>;
```

```ts
// apps/web/src/features/sessions/SessionsPeek.tsx
export const SessionsPeek: FC;
```

```ts
// apps/web/src/features/sessions/SessionsPickPopup.tsx
export const SessionsPickPopup: FC<SessionsPickPopupProps>;
```

```ts
// apps/web/src/features/sessions/SportBadge.tsx
export const SportBadge: FC<SportBadgeProps>;
```

```ts
// apps/web/src/features/sessions/ZoneLegend.tsx
export const ZoneLegend: FC<ZoneLegendProps>;
```

```ts
// apps/web/src/features/sessions/charts/CadenceChart.tsx
export const CadenceChart: FC<CadenceChartProps>;
```

```ts
// apps/web/src/features/sessions/charts/GradeAdjustedPaceChart.tsx
export const GradeAdjustedPaceChart: FC<GradeAdjustedPaceChartProps>;
```

```ts
// apps/web/src/features/sessions/charts/HrChart.tsx
export const HrChart: FC<HrChartProps>;
```

```ts
// apps/web/src/features/sessions/charts/PaceChart.tsx
export const PaceChart: FC<PaceChartProps>;
```

```ts
// apps/web/src/features/sessions/charts/PowerChart.tsx
export const PowerChart: FC<PowerChartProps>;
```

```ts
// apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx
export const SessionChartsExplorer: FC<SessionChartsExplorerProps>;
```

```ts
// apps/web/src/features/sessions/charts/SpeedChart.tsx
export const SpeedChart: FC<SpeedChartProps>;
```

```ts
// apps/web/src/features/sessions/charts/hooks/useSessionChartHover.ts
export const useSessionChartHover: (gpsLookup: Map<number, [number, number]>) => SessionChartHover;
```

```ts
// apps/web/src/features/sessions/charts/hooks/useSessionChartNodes.tsx
export const useSessionChartNodes: ({ compactRows, running, hrScale, powerScale, paceScale, speedColorScale, onHover, onSelectTime, onZoomComplete, terrain, }: {
  compactRows: ReturnType<typeof buildSessionChartRows>;
  running: boolean;
  hrScale: ZoneScale | undefined;
  powerScale: ZoneScale | undefined;
  paceScale: ZoneScale | undefined;
  speedColorScale: SpeedScale | undefined;
  onHover: (time: number | null) => void;
  onSelectTime: (time: number) => void;
  onZoomComplete: (from: string | number, to: string | number) => void;
  terrain: SessionTerrain;
}) => SessionChartNodes;
```

```ts
// apps/web/src/features/sessions/charts/hooks/useSessionChartRows.ts
export const useSessionChartRows: ({ sport, records, zoomRange, }: {
  sport: Sport;
  records: SessionRecord[];
  zoomRange: { from: number; to: number; } | null;
}) => SessionChartRows;
```

```ts
// apps/web/src/features/sessions/charts/hooks/useSessionChartScales.ts
export const useSessionChartScales: ({ date, records, }: { date: number; records: SessionRecord[]; }) => SessionChartScales;
```

```ts
// apps/web/src/features/sessions/charts/hooks/useSessionRailStats.ts
export const useSessionRailStats: ({ session, records, terrain, extremes, zoomRange, }: {
  session: TrainingSession;
  records: SessionRecord[];
  terrain: SessionTerrain;
  extremes: ReturnType<typeof computeRecordExtremes>;
  zoomRange: { from: number; to: number; } | null;
}) => SessionRailStats;
```

```ts
// apps/web/src/features/sessions/charts/types.ts
export const HOVER_GROUP: "session-detail";
```

```ts
// apps/web/src/features/sessions/createIngestBatcher.ts
export const INGEST_CHUNK_SIZE: 10;
export const INGEST_BATCH_SIZE: 50;
export const createIngestBatcher: (options: {
  queryClient: QueryClient;
  markNew?: boolean;
  onFlushed?: (stored: ParsedFitResultWithMeta[]) => void;
}) => {
  add: (entry: ParsedFitResultWithMeta) => Promise<void>;
  finish: () => Promise<IngestOutcome>;
};
```

```ts
// apps/web/src/features/sessions/hooks/useClearSessionChartHoverEffect.ts
export const useClearSessionChartHoverEffect: (group: string) => void;
```

```ts
// apps/web/src/features/sessions/hooks/useFileDropEffect.ts
export const useFileDropEffect: ({ onDrop, enabled, }: { onDrop: (files: FileList) => Promise<void>; enabled: boolean; }) => void;
```

```ts
// apps/web/src/features/sessions/hooks/useFileUpload.ts
export const useFileUpload: () => FileUpload;
```

```ts
// apps/web/src/features/sessions/hooks/useSessionReprocessingActive.ts
export const useSessionReprocessingActive: () => boolean;
```

```ts
// apps/web/src/features/sessions/hooks/useSessionTitle.ts
export const useSessionTitle: (session: TrainingSession | undefined) => SessionTitle;
```

```ts
// apps/web/src/features/sessions/recomputeTrainingLoad.ts
export const recomputeTrainingLoad: () => Promise<number>;
```

```ts
// apps/web/src/features/sessions/reprocessSessions.ts
export const SESSION_REPROCESSING_LOCK: "pacevault-session-reprocessing";
export const REPROCESS_BATCH_SIZE: 50;
export const reprocessOutdatedSessions: () => Promise<number>;
```

```ts
// apps/web/src/features/sessions/session/AvatarFrame.tsx
export const AvatarFrame: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/features/sessions/session/Bars.tsx
export const Bars: FC<BarsProps>;
```

```ts
// apps/web/src/features/sessions/session/ColorByControl.tsx
export const ColorByControl: FC<ColorByControlProps>;
```

```ts
// apps/web/src/features/sessions/session/DeleteSessionDialog.tsx
export const DeleteSessionDialog: FC<DeleteSessionDialogProps>;
```

```ts
// apps/web/src/features/sessions/session/HrZonesCell.tsx
export const HrZonesCell: FC<HrZonesCellProps>;
```

```ts
// apps/web/src/features/sessions/session/KeyValue.tsx
export const KeyValue: FC<KeyValueProps>;
```

```ts
// apps/web/src/features/sessions/session/LapExtreme.tsx
export const LapExtreme: FC<LapExtremeProps>;
```

```ts
// apps/web/src/features/sessions/session/LapStepper.tsx
export const LapStepper: FC<LapStepperProps>;
```

```ts
// apps/web/src/features/sessions/session/LapStrip.tsx
export const LapStrip: FC<LapStripProps>;
```

```ts
// apps/web/src/features/sessions/session/LapStripAvatar.tsx
export const LapStripAvatar: FC<LapStripAvatarProps>;
```

```ts
// apps/web/src/features/sessions/session/LapStripDetail.tsx
export const LapStripDetail: FC<LapStripDetailProps>;
```

```ts
// apps/web/src/features/sessions/session/LapSwatch.tsx
export const LapSwatch: FC<LapSwatchProps>;
```

```ts
// apps/web/src/features/sessions/session/LapsControl.tsx
export const LapsControl: FC<LapsControlProps>;
```

```ts
// apps/web/src/features/sessions/session/LapsDetails.tsx
export const LapsDetails: FC<LapsDetailsProps>;
```

```ts
// apps/web/src/features/sessions/session/LapsPicker.tsx
export const LapsPicker: FC<LapsPickerProps>;
```

```ts
// apps/web/src/features/sessions/session/LapsRow.tsx
export const LapsRow: FC<LapsRowProps>;
```

```ts
// apps/web/src/features/sessions/session/LegendDot.tsx
export const LegendDot: FC<LegendDotProps>;
```

```ts
// apps/web/src/features/sessions/session/MapViewControl.tsx
export const MapViewControl: FC;
```

```ts
// apps/web/src/features/sessions/session/MeterBar.tsx
export const MeterBar: FC<MeterBarProps>;
```

```ts
// apps/web/src/features/sessions/session/MoreStatsRow.tsx
export const MoreStatsRow: FC<MoreStatsRowProps>;
```

```ts
// apps/web/src/features/sessions/session/NoGpsBanner.tsx
export const NoGpsBanner: FC<NoGpsBannerProps>;
```

```ts
// apps/web/src/features/sessions/session/PeakBars.tsx
export const PeakBars: FC<PeakBarsProps>;
```

```ts
// apps/web/src/features/sessions/session/PeakPowerCell.tsx
export const PeakPowerCell: FC<PeakPowerCellProps>;
```

```ts
// apps/web/src/features/sessions/session/PrecipitationDots.tsx
export const PrecipitationDots: FC<PrecipitationDotsProps>;
```

```ts
// apps/web/src/features/sessions/session/SensorWarningBanner.tsx
export const SensorWarningBanner: FC<SensorWarningBannerProps>;
```

```ts
// apps/web/src/features/sessions/session/SessionActionsMenu.tsx
export const SessionActionsMenu: FC<SessionActionsMenuProps>;
```

```ts
// apps/web/src/features/sessions/session/SessionLapSetSync.tsx
export const SessionLapSetSync: FC<SessionLapSetSyncProps>;
```

```ts
// apps/web/src/features/sessions/session/SessionMapControls.tsx
export const SessionMapControls: FC<SessionMapControlsProps>;
```

```ts
// apps/web/src/features/sessions/session/SessionOverview.tsx
export const SessionOverview: FC<SessionOverviewProps>;
```

```ts
// apps/web/src/features/sessions/session/SessionSummaryCard.tsx
export const SessionSummaryCard: FC<SessionSummaryCardProps>;
```

```ts
// apps/web/src/features/sessions/session/SplitSlider.tsx
export const SplitSlider: FC<SplitSliderProps>;
```

```ts
// apps/web/src/features/sessions/session/StepButton.tsx
export const StepButton: FC<StepButtonProps>;
```

```ts
// apps/web/src/features/sessions/session/Swatch.tsx
export const Swatch: FC<SwatchProps>;
```

```ts
// apps/web/src/features/sessions/session/TrainingEffectCard.tsx
export const TrainingEffectCard: FC<TrainingEffectCardProps>;
```

```ts
// apps/web/src/features/sessions/session/TrainingEffectGauge.tsx
export const TrainingEffectGauge: FC<TrainingEffectGaugeProps>;
```

```ts
// apps/web/src/features/sessions/session/TrainingEffectGlyph.tsx
export const TrainingEffectGlyph: FC<TrainingEffectGlyphProps>;
```

```ts
// apps/web/src/features/sessions/session/WeatherCard.tsx
export const WeatherCard: FC<WeatherCardProps>;
```

```ts
// apps/web/src/features/sessions/session/WeatherDetails.tsx
export const WeatherDetails: FC<WeatherDetailsProps>;
```

```ts
// apps/web/src/features/sessions/session/WeatherHourlyTable.tsx
export const WeatherHourlyTable: FC<WeatherHourlyTableProps>;
```

```ts
// apps/web/src/features/sessions/session/Wedges.tsx
export const Wedges: FC<WedgesProps>;
```

```ts
// apps/web/src/features/sessions/session/WindLegend.tsx
export const WindLegend: FC<WindLegendProps>;
```

```ts
// apps/web/src/features/sessions/session/WindRose.tsx
export const WindRose: FC<WindRoseProps>;
```

```ts
// apps/web/src/features/sessions/session/WindRoseGlyph.tsx
export const WindRoseGlyph: FC<WindRoseGlyphProps>;
```

```ts
// apps/web/src/features/sessions/session/hooks/useEditInStudio.ts
export const useEditInStudio: (session: TrainingSession) => EditInStudio;
```

```ts
// apps/web/src/features/sessions/session/hooks/useLapsControlState.ts
export const useLapsControlState: ({ records, laps, sport, }: {
  records: SessionRecord[];
  laps: SessionLap[];
  sport: Sport;
}) => LapsControlState;
```

```ts
// apps/web/src/features/sessions/session/hooks/useLapsPickerSets.ts
export const useLapsPickerSets: ({ source, records, laps, current, splitDistance, sport, date, }: {
  source: LapSource;
  records: SessionRecord[];
  laps: SessionLap[];
  current: LapSet | null;
  splitDistance: number;
  sport: Sport;
  date: number;
}) => LapsPickerSets;
```

```ts
// apps/web/src/features/sessions/session/hooks/useMarkSessionSeenEffect.ts
export const useMarkSessionSeenEffect: (sessionId: string | undefined) => void;
```

```ts
// apps/web/src/features/sessions/session/hooks/useMiniRailHover.ts
export const useMiniRailHover: () => MiniRailHover;
```

```ts
// apps/web/src/features/sessions/session/hooks/useMoreStats.ts
export const useMoreStats: ({ session, records, }: { session: TrainingSession; records: SessionRecord[]; }) => MoreStats;
```

```ts
// apps/web/src/features/sessions/session/hooks/useSessionColorModes.ts
export const useSessionColorModes: ({ session, records, }: {
  session: TrainingSession;
  records: SessionRecord[];
}) => SessionColorModes;
```

```ts
// apps/web/src/features/sessions/session/hooks/useSessionExport.ts
export const useSessionExport: (session: TrainingSession) => SessionExport;
```

```ts
// apps/web/src/features/sessions/session/hooks/useSessionLapsEffect.ts
export const useSessionLapsEffect: ({ records, laps, }: { records: SessionRecord[]; laps: SessionLap[]; }) => void;
```

```ts
// apps/web/src/features/sessions/session/hooks/useTrackColorModeEffect.ts
export const useTrackColorModeEffect: (mode: ColorMode) => void;
```

```ts
// apps/web/src/features/sessions/session/hooks/useWindExposure.ts
export const useWindExposure: ({ records, weather, sessionStartMs, }: {
  records: SessionRecord[];
  weather: SessionWeather | null;
  sessionStartMs: number;
}) => WindExposure | null;
```

```ts
// apps/web/src/features/sessions/session/hooks/useWindRose.ts
export const useWindRose: ({ records, weather, sessionStartMs, }: {
  records: SessionRecord[];
  weather: SessionWeather | null;
  sessionStartMs: number;
}) => number[] | null;
```

```ts
// apps/web/src/features/sessions/session/lapLabels.ts
export const speedRangeLabel: ({ slowKmh, fastKmh, }: { slowKmh: number; fastKmh: number; }) => string;
export const splitDistanceLabel: (metres: number) => string;
export const lapCountLabel: ({ count, source, }: { count: number; source: Exclude<LapSource, "off">; }) => string;
export const lapPaceLabel: ({ secPerKm, sport }: { secPerKm: number; sport: Sport; }) => string;
export const lapsRowLabels: ({ source, set, sport, }: { source: LapSource; set: LapSet | null; sport: Sport; }) => LapsRowLabels;
export const effortChipLabel: ({ set, efforts, }: { set: LapSet; efforts: LapSetEfforts; }) => string;
export const lapsPickerDescriptions: ({ source, current, deviceLapCount, effortSet, limitedBy, }: {
  source: LapSource;
  current: LapSet | null;
  deviceLapCount: number;
  effortSet: LapSet | null;
  limitedBy: EffortLimiter | undefined;
}) => LapsPickerDescriptions;
export const lapName: ({ set, lapIndex, source, sport, }: {
  set: LapSet;
  lapIndex: number;
  source: LapSource;
  sport: Sport;
}) => string;
```

```ts
// apps/web/src/features/sessions/session/lapStripLayout.ts
export const FASTER: any;
export const SLOWER: any;
export interface StripBar {
  lapIndex: number;
  x: number;
  width: number;
  y: number;
  height: number;
  fill: string;
  opacity: number;
}
export const layoutStrip: ({ set, width, height, gap, }: {
  set: LapSet;
  width: number;
  height: number;
  gap: number;
}) => StripLayout;
```

```ts
// apps/web/src/features/sessions/session/sensorWarningText.ts
export const sensorWarningText: (warning: SensorWarning) => string;
```

```ts
// apps/web/src/features/sessions/session/statFormat.ts
export const statFormat: {
  watts: (value: number) => string;
  duration: (seconds: number) => string;
  percent: (share: number) => string;
  peakWindow: (seconds: number) => string;
  integer: (value: number) => string;
};
```

```ts
// apps/web/src/features/sessions/session/trainingEffectScale.ts
export const TE_ZONES: { from: number; to: number; color: any; }[];
export const fillOf: (value: number) => string;
```

```ts
// apps/web/src/features/sessions/session/types.ts
export interface MiniRailSegmentProps {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onClick: () => void;
}
export interface MiniRailProps {
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
}
export interface LapsControlProps {
  records: SessionRecord[];
  laps: SessionLap[];
  sport: Sport;
  date: number;
}
```

```ts
// apps/web/src/features/sessions/session/weatherConditions.ts
export const weatherIcon: (weatherCode: number) => LucideIcon;
export const weatherLabel: (weatherCode: number) => string;
export const WIND_LEGEND: readonly [{
  readonly key: "head";
  readonly label: any;
  readonly mostly: any;
  readonly pct: (exposure: WindExposure) => any;
}, {
  readonly key: "cross";
  readonly label: any;
  readonly mostly: any;
  readonly pct: (exposure: WindExposure) => any;
}, {
  readonly key: "tail";
  readonly label: any;
  readonly mostly: any;
  readonly pct: (exposure: WindExposure) => any;
}];
```

```ts
// apps/web/src/features/sessions/sessionsSnackbars.ts
export const SESSIONS_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/features/sessions/types.ts
export interface PopupInfo {
  x: number;
  y: number;
  sessions: TrainingSession[];
}
```

```ts
// apps/web/src/features/settings/AboutSection.tsx
export const GITHUB_URL: "https://github.com/fabianhinz/PaceVault";
export const AboutSection: FC;
```

```ts
// apps/web/src/features/settings/DataManagementSection.tsx
export const DataManagementSection: FC;
```

```ts
// apps/web/src/features/settings/DeleteAllDataDialog.tsx
export const DeleteAllDataDialog: FC<DeleteAllDataDialogProps>;
```

```ts
// apps/web/src/features/settings/Divider.tsx
export const Divider: FC;
```

```ts
// apps/web/src/features/settings/FitFilesCard.tsx
export const FitFilesCard: FC;
```

```ts
// apps/web/src/features/settings/IntegrationsCard.tsx
export const IntegrationsCard: FC;
```

```ts
// apps/web/src/features/settings/PaceEstimateButton.tsx
export const PaceEstimateButton: FC<PaceEstimateButtonProps>;
```

```ts
// apps/web/src/features/settings/PaceEstimatorDialog.tsx
export const PaceEstimatorDialog: FC<PaceEstimatorDialogProps>;
```

```ts
// apps/web/src/features/settings/ProfileFields.tsx
export const ProfileFields: FC<ProfileFieldsProps>;
```

```ts
// apps/web/src/features/settings/SettingsPeek.tsx
export const SettingsPeek: FC;
```

```ts
// apps/web/src/features/settings/ThresholdEditDialog.tsx
export const ThresholdEditDialog: FC<ThresholdEditDialogProps>;
```

```ts
// apps/web/src/features/settings/ThresholdEditForm.tsx
export const ThresholdEditForm: FC<ThresholdEditFormProps>;
```

```ts
// apps/web/src/features/settings/ThresholdSparkline.tsx
export const ThresholdSparkline: FC<ThresholdSparklineProps>;
```

```ts
// apps/web/src/features/settings/ThresholdTile.tsx
export const ThresholdTile: FC<ThresholdTileProps>;
```

```ts
// apps/web/src/features/settings/ThresholdTiles.tsx
export const ThresholdTiles: FC<ThresholdTilesProps>;
```

```ts
// apps/web/src/features/settings/ThresholdsSection.tsx
export const ThresholdsSection: FC;
```

```ts
// apps/web/src/features/settings/deleteAllData.ts
export const clearAllAppState: (queryClient: QueryClient) => void;
```

```ts
// apps/web/src/features/settings/hooks/types.ts
export type NumberField = 'restHr' | 'maxHr' | 'thresholdHr' | 'ftp' | 'weight' | 'birthYear';
export type TextField = NumberField | 'thresholdPace';
export type FormField = TextField | 'gender';
export interface ProfileGate {
  ready: boolean;
  save: () => void;
}
```

```ts
// apps/web/src/features/settings/hooks/useThresholdDraft.ts
export const useThresholdDraft: ({ field, thresholds, }: { field: ThresholdKey; thresholds: ThresholdsForm; }) => ThresholdDraft;
```

```ts
// apps/web/src/features/settings/hooks/useThresholdTileReading.ts
export const useThresholdTileReading: ({ tile, histories, context, scrub, fresh, }: {
  tile: TileSpec;
  histories: ThresholdHistories;
  context: ThresholdTileContext;
  scrub: TileScrub | null;
  fresh: boolean;
}) => ThresholdTileReading;
```

```ts
// apps/web/src/features/settings/hooks/useThresholdsAt.ts
export const useThresholdsAt: (date: number) => ResolvedThresholds | undefined;
```

```ts
// apps/web/src/features/settings/hooks/useThresholdsForm.ts
export const fieldErrorFor: ({ field, draft, values, }: { field: TextField; draft: string; values: FormValues; }) => string;
export interface ThresholdsForm {
  form: FormValues;
  current: FormValues;
  dirty: boolean;
  valid: boolean;
  visibleError: (field: FormField) => string;
  revealErrors: (targets: FormField[]) => FormField[];
  setField: ({ field, value }: { field: TextField; value: string }) => void;
  saveField: ({ field, value }: { field: ThresholdKey; value: string }) => ThresholdKey | undefined;
  setGender: (value: string) => void;
  save: () => void;
}
export const useThresholdsForm: (mode: "create" | "update") => ThresholdsForm;
```

```ts
// apps/web/src/features/settings/settingsSnackbars.ts
export const SETTINGS_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/features/settings/thresholdIcons.ts
export type ThresholdTileKey = ThresholdKey | 'wkg';
export const THRESHOLD_TILE_ICONS: Record<any, LucideIcon>;
export const isEditable: (key: ThresholdTileKey) => key is ThresholdKey;
```

```ts
// apps/web/src/features/settings/types.ts
export interface TileSpec {
  key: ThresholdTileKey;
  title: () => string;
  color: TokenColor;
  unit: string;
  format: (value: number) => string;
}
export interface TileScrub {
  key: ThresholdTileKey;
  date: number;
}
export interface ThresholdTileContext {
  firstSessionDate: number | undefined;
  createdAt: number;
  today: number;
}
export type ThresholdHistories = Record<ThresholdTileKey, DatedValue<number>[]>;
```

```ts
// apps/web/src/features/studio/DeleteStudioRouteDialog.tsx
export const DeleteStudioRouteDialog: FC<DeleteStudioRouteDialogProps>;
```

```ts
// apps/web/src/features/studio/MarkerCard.tsx
export const MarkerCard: FC<MarkerCardProps>;
```

```ts
// apps/web/src/features/studio/RouteStatsGrid.tsx
export const RouteStatsGrid: FC<RouteStatsGridProps>;
```

```ts
// apps/web/src/features/studio/StudioActionsMenu.tsx
export const StudioActionsMenu: FC<StudioActionsMenuProps>;
```

```ts
// apps/web/src/features/studio/StudioColorPicker.tsx
export const StudioColorPicker: FC<StudioColorPickerProps>;
```

```ts
// apps/web/src/features/studio/StudioDetail.tsx
export const StudioDetail: FC<StudioDetailProps>;
```

```ts
// apps/web/src/features/studio/StudioRouteFormDialog.tsx
export const StudioRouteFormDialog: FC<StudioRouteFormDialogProps>;
```

```ts
// apps/web/src/features/studio/StudioRouteHeader.tsx
export const StudioRouteHeader: FC<StudioRouteHeaderProps>;
```

```ts
// apps/web/src/features/studio/StudioRouteItem.tsx
export const StudioRouteItem: FC<StudioRouteItemProps>;
```

```ts
// apps/web/src/features/studio/StudioRoutePeek.tsx
export const StudioRoutePeek: FC<StudioRoutePeekProps>;
```

```ts
// apps/web/src/features/studio/StudioTab.tsx
export const StudioTab: FC;
```

```ts
// apps/web/src/features/studio/StudioToolsTab.tsx
export const StudioToolsTab: FC<StudioToolsTabProps>;
```

```ts
// apps/web/src/features/studio/charts/RouteChartsExplorer.tsx
export const RouteChartsExplorer: FC<RouteChartsExplorerProps>;
```

```ts
// apps/web/src/features/studio/createStudioRoute.ts
export const createStudioRouteFromPoints: ({ points, name, sourceFileName, }: {
  points: ParsedGpxPoint[];
  name: string;
  sourceFileName: string;
}, queryClient: QueryClient) => Promise<string | null>;
export const createStudioRouteFromGpx: ({ text, fallbackName, sourceFileName, }: {
  text: string;
  fallbackName: string;
  sourceFileName: string;
}, queryClient: QueryClient) => Promise<string | null>;
```

```ts
// apps/web/src/features/studio/hooks/useClearRouteChartHoverEffect.ts
export const useClearRouteChartHoverEffect: (group: string) => void;
```

```ts
// apps/web/src/features/studio/hooks/useGpxImport.ts
export const useGpxImport: () => GpxImport;
```

```ts
// apps/web/src/features/studio/hooks/useRouteChartHover.ts
export const useRouteChartHover: (gpsLookup: Map<number, [number, number]>) => ((dist: number | null) => void);
```

```ts
// apps/web/src/features/studio/hooks/useRouteChartRows.ts
export const useRouteChartRows: ({ points, zoomRange, }: {
  points: RoutePoint[];
  zoomRange: { from: number; to: number; } | null;
}) => RouteChartRows;
```

```ts
// apps/web/src/features/studio/hooks/useStudioMapPopup.ts
export interface StudioMapPopup {
  popup: StudioTrackPickInfo | null;
  onClick: (info: PickingInfo) => void;
  close: () => void;
}
export const useStudioMapPopup: () => StudioMapPopup;
```

```ts
// apps/web/src/features/studio/hooks/useStudioMarkerForm.ts
export const useStudioMarkerForm: (route: StudioRoute) => StudioMarkerForm;
```

```ts
// apps/web/src/features/studio/hooks/useStudioRouteExport.ts
export interface StudioRouteExport {
  exporting: boolean;
  exportRoute: (route: StudioRoute) => Promise<void>;
  exportSegment: ({
    route,
    startM,
    endM,
    index,
  }: {
    route: StudioRoute;
    startM: number;
    endM: number;
    index: number;
  }) => Promise<void>;
}
export const useStudioRouteExport: () => StudioRouteExport;
```

```ts
// apps/web/src/features/studio/hooks/useStudioRoutesPopup.ts
export interface StudioRoutesPopup {
  popup: StudioRoutesPopupInfo | null;
  onClick: (info: PickingInfo) => void;
  close: () => void;
}
export const useStudioRoutesPopup: (mapRef: React.RefObject<MapRef | null>) => StudioRoutesPopup;
```

```ts
// apps/web/src/features/studio/hooks/useStudioTrackPickSegment.ts
export const useStudioTrackPickSegment: (info: StudioTrackPickInfo) => StudioTrackPickSegment;
```

```ts
// apps/web/src/features/studio/markers/AddMarkerButton.tsx
export const AddMarkerButton: FC<AddMarkerButtonProps>;
```

```ts
// apps/web/src/features/studio/markers/MarkerRow.tsx
export const MarkerRow: FC<MarkerRowProps>;
```

```ts
// apps/web/src/features/studio/markers/StudioMarkerDialog.tsx
export const StudioMarkerDialog: FC<StudioMarkerDialogProps>;
```

```ts
// apps/web/src/features/studio/markers/StudioMarkerPins.tsx
export const StudioMarkerPins: FC<StudioMarkerPinsProps>;
```

```ts
// apps/web/src/features/studio/markers/StudioRoutesPickPopup.tsx
export const StudioRoutesPickPopup: FC<StudioRoutesPickPopupProps>;
```

```ts
// apps/web/src/features/studio/markers/StudioTrackPickPopup.tsx
export const StudioTrackPickPopup: FC<StudioTrackPickPopupProps>;
```

```ts
// apps/web/src/features/studio/markers/routeSegments.ts
export interface RouteSegment {
  /** 1-based number of the segment the distance falls into. */
  index: number;
  startM: number;
  endM: number;
  /** Split ordinal (1-based) preceding the segment, or `null` for the route start. */
  startSplit: number | null;
}
export const segmentAtDistance: ({ splitDistancesM, totalM, distanceM, }: {
  splitDistancesM: number[];
  totalM: number;
  distanceM: number;
}) => RouteSegment;
```

```ts
// apps/web/src/features/studio/routeColors.ts
export const routeColors: Record<StudioRouteColor, RouteColorValue>;
export const routeColorOrder: StudioRouteColor[];
export const nextRouteColor: (used: StudioRouteColor[]) => StudioRouteColor;
```

```ts
// apps/web/src/features/studio/studioSnackbars.ts
export const STUDIO_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/features/studio/types.ts
export interface StudioTrackPickInfo {
  x: number;
  y: number;
  routeId: string;
  distanceM: number;
}
export interface StudioRoutesPopupInfo {
  x: number;
  y: number;
  routes: StudioRoute[];
}
export const HOVER_GROUP: "studio-detail";
```

```ts
// apps/web/src/features/trips/DeleteTripDialog.tsx
export const DeleteTripDialog: FC<DeleteTripDialogProps>;
```

```ts
// apps/web/src/features/trips/ManageTripDialog.tsx
export const ManageTripDialog: FC<ManageTripDialogProps>;
```

```ts
// apps/web/src/features/trips/TripActionsMenu.tsx
export const TripActionsMenu: FC<TripActionsMenuProps>;
```

```ts
// apps/web/src/features/trips/TripBadge.tsx
export const TripBadge: FC;
```

```ts
// apps/web/src/features/trips/TripDetail.tsx
export const TripDetail: FC<TripDetailProps>;
```

```ts
// apps/web/src/features/trips/TripFormDialog.tsx
export const TripFormDialog: FC<TripFormDialogProps>;
```

```ts
// apps/web/src/features/trips/TripHeader.tsx
export const TripHeader: FC<TripHeaderProps>;
```

```ts
// apps/web/src/features/trips/TripItem.tsx
export const TripItem: FC<TripItemProps>;
```

```ts
// apps/web/src/features/trips/TripPeek.tsx
export const TripPeek: FC<TripPeekProps>;
```

```ts
// apps/web/src/features/trips/TripStatsGrid.tsx
export const TripStatsGrid: FC<TripStatsGridProps>;
```

```ts
// apps/web/src/features/trips/TripsTab.tsx
export const TripsTab: FC;
```

```ts
// apps/web/src/features/trips/hooks/useTripDraft.ts
export const useTripDraft: ({ open, trip, }: { open: boolean; trip: Trip | undefined; }) => TripDraft;
```

```ts
// apps/web/src/features/trips/hooks/useTripMapFocusEffect.ts
export const useTripMapFocusEffect: (sessionIds: string[] | undefined) => void;
```

```ts
// apps/web/src/features/trips/hooks/useTripSessionPicker.ts
export const useTripSessionPicker: (showAll: boolean) => TripSessionPicker;
```

```ts
// apps/web/src/features/trips/tripStats.ts
export const computeTripTotals: (sessions: TrainingSession[]) => TripTotals;
export const formatTripStatsLine: (totals: TripTotals) => string;
```

```ts
// apps/web/src/lib/archive.ts
export const UPLOAD_EXTENSIONS: readonly [".fit", ".tcx", ".zip"];
export interface ArchiveEntry {
  path: string;
  fileName: string;
  extension: ActivityExtension;
}
export const isArchiveFile: (fileName: string) => boolean;
export const listActivityEntries: (archive: ArrayBuffer) => ArchiveEntry[];
export const extractArchiveEntry: ({ archive, path, }: { archive: ArrayBuffer; path: string; }) => ArrayBuffer;
export interface UploadSource {
  file: File;
  archiveEntries?: ArchiveEntry[];
}
export const collectUploadSources: (files: File[]) => Promise<{ sources: UploadSource[]; fitCount: number; failed: number; }>;
```

```ts
// apps/web/src/lib/chartData.ts
export const TARGET_ROWS: 1500;
export const bucketSeries: <Row, K extends string, C extends string>(rows: Row[], options: BucketSeriesOptions<Row, K, C>) => BucketRow<Row, K, C>[];
export interface CadencePoint extends TimeSeriesPoint {
  cadence: number | null;
}
export interface HrPoint extends TimeSeriesPoint {
  hr: number | null;
}
export interface PowerPoint extends TimeSeriesPoint {
  power: number | null;
}
export interface SpeedPoint extends TimeSeriesPoint {
  speed: number | null;
}
export interface PacePoint extends TimeSeriesPoint {
  pace: number | null;
}
export interface GAPPoint extends TimeSeriesPoint {
  gap: number | null;
}
export const hasSeriesValues: <K extends string>(points: ReadonlyArray<Record<K, number | null>>, key: K) => boolean;
export const buildSessionChartRows: (records: SessionRecord[], options: SessionChartRowOptions) => BucketRow<SessionRecord, "time", "elevation" | "speed" | "gap" | "hr" | "power" | "cadence" | "climbElevation" | "grade" | "pace">[];
export const gpsByX: <K extends string>(rows: ReadonlyArray<Record<K, number> & {
  source: { lat?: number; lng?: number; } | undefined;
}>, key: K) => Map<number, [number, number]>;
export interface RouteChartProfile {
  elevation: { dist: number; elevation: number; lng: number; lat: number }[];
  grade: { dist: number; grade: number | undefined; lng: number; lat: number }[];
}
export const routeChartProfile: (profile: RouteProfile) => RouteChartProfile;
export const buildRouteChartRows: (profile: RouteChartProfile, range?: {
  from: number;
  to: number;
}) => BucketRow<{
  dist: number;
  elevation: number;
  lng: number;
  lat: number;
}, "dist", "elevation" | "grade">[];
```

```ts
// apps/web/src/lib/chartTheme.ts
export const formatChartTime: (minutes: number) => string;
export const niceStep: (rough: number) => number;
export const niceAxis: (values: Array<number | null | undefined>, { tickCount }?: {
  tickCount?: number;
}) => {
  domain: [number, number];
  ticks: number[];
} | undefined;
export const formatTick: (v: number, { unit }?: { unit?: string; }) => string;
export interface ChartXAxis<K extends string> {
  key: K;
  syncId: string;
  type: 'number' | 'category';
  tickFormatter: (v: number) => string;
}
export const sessionTimeXAxis: ChartXAxis<"time">;
export const routeDistanceXAxis: ChartXAxis<"dist">;
export const chartTheme: {
  readonly tick: { readonly fill: any; readonly fontSize: any; };
  readonly compactYAxisWidth: 36;
  readonly axisLine: { readonly stroke: any; };
};
export const yAxisWidthFor: (labels: readonly string[]) => number;
```

```ts
// apps/web/src/lib/chartZoom.ts
export const zoomSelection: <T>({ data, xKey, pressed, released, }: {
  data: T[];
  xKey: keyof T & string;
  pressed: string | number;
  released: string | number;
}) => {
  left: number;
  right: number;
} | null;
```

```ts
// apps/web/src/lib/coachingMessages.ts
export const getFormMessage: (status: FormStatus) => string;
export const getFormMessageDetailed: (rec: CoachingRecommendation) => string;
export const getCoachingRecommendation: ({ metrics, historyDays, }: {
  metrics: DailyMetrics | undefined;
  historyDays: number;
}) => CoachingRecommendation;
```

```ts
// apps/web/src/lib/colorModes.ts
export const COLOR_MODES: readonly ["sport", "hr", "power", "pace", "speed", "wind"];
export type ColorMode = (typeof COLOR_MODES)[number];
export type ColorModeUnavailableReason =
  | 'hrThresholds'
  | 'ftp'
  | 'thresholdPace'
  | 'noHrData'
  | 'noPowerData'
  | 'noPaceData'
  | 'noSpeedData'
  | 'noWeather'
  | 'weatherLoading'
  | 'noGps';
export type ColorModeStatus =
  | { available: true }
  | { available: false; reason: ColorModeUnavailableReason };
export interface ColorModeOption {
  mode: ColorMode;
  status: ColorModeStatus;
}
export type WindInput = { state: 'loading' } | { state: 'ready'; samples: WindSample[] };
export const colorModeOptions: (input: ColorModeInput) => ColorModeOption[];
export const effectiveColorMode: (stored: ColorMode, options: ColorModeOption[]) => ColorMode;
```

```ts
// apps/web/src/lib/crashReport.ts
export const buildIssueUrl: (error: unknown) => string;
```

```ts
// apps/web/src/lib/dashboardVolume.ts
export const VOLUME_METRICS: readonly ["distance", "duration", "elevation"];
export type VolumeMetric = (typeof VOLUME_METRICS)[number];
export interface VolumeTotal {
  value: number | undefined;
  recorded: number;
  sessions: number;
}
export const beforeVolumeWindow: ({ time, from, count, through, }: {
  time: FilterTime | null;
  from: string;
  count: number;
  through: readonly string[];
}) => BeforeVolumeWindow;
export const cumulativeVolume: ({ sessions, metric, from, through, }: {
  sessions: readonly VolumeSession[];
  metric: VolumeMetric;
  from: string;
  through: readonly string[];
}) => VolumeTotal[];
export const volumeTotals: ({ sessions, metric, time, range, through, }: {
  sessions: readonly VolumeSession[];
  metric: VolumeMetric;
  time: FilterTime | null;
  range: VolumeRange | null;
  through: readonly string[];
}) => VolumeTotals;
export const formatVolumeWindow: (window: BeforeVolumeWindow) => string | null;
export const toVolumeDisplay: ({ metric, value, }: { metric: VolumeMetric; value: number; }) => number;
export const volumeUnit: (metric: VolumeMetric) => string;
export const formatVolume: ({ metric, value, }: { metric: VolumeMetric; value: number | undefined; }) => string;
export const formatVolumeTick: (value: number) => string;
export const volumeAxisTicks: (values: readonly (number | null)[]) => number[] | undefined;
export const DASHBOARD_Y_AXIS_WIDTH: number;
```

```ts
// apps/web/src/lib/db.ts
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
  kv: {
    key: string;
    value: string;
  };
}
export const DB_NAME: "endurance-tracker";
export const DB_VERSION: 4;
export const getDB: () => Promise<IDBPDatabase<EnduranceTrackerDB>>;
export const resetDBInstance: () => void;
export const getSessionRecords: (sessionId: string) => Promise<SessionRecord[]>;
export const deleteSessionRecords: (sessionId: string) => Promise<void>;
export const clearAllRecords: () => Promise<void>;
export const saveStudioRoutePoints: ({ routeId, points, }: { routeId: string; points: RoutePoint[]; }) => Promise<void>;
export const getStudioRoutePoints: (routeId: string) => Promise<RoutePoint[]>;
export const deleteStudioRoutePoints: (routeId: string) => Promise<void>;
export const getSessionLaps: (sessionId: string) => Promise<SessionLap[]>;
export const deleteSessionLaps: (sessionId: string) => Promise<void>;
export const saveSessionGPS: (gps: SessionGPS) => Promise<void>;
export const getSessionGPS: (sessionId: string) => Promise<SessionGPS | undefined>;
export const getAllSessionGPS: () => Promise<SessionGPS[]>;
export const deleteSessionGPS: (sessionId: string) => Promise<void>;
export const bulkSaveSessionData: (entries: SessionDataEntry[], options?: {
  chunkSize?: number;
  onChunkDone?: (chunkIndex: number) => void;
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
// apps/web/src/lib/debug/CrashTrigger.tsx
export const CrashTrigger: FC<CrashTriggerProps>;
```

```ts
// apps/web/src/lib/debug/DebugCrashTrigger.tsx
export const DebugCrashTrigger: FC<DebugCrashTriggerProps>;
```

```ts
// apps/web/src/lib/debug/crashCommands.ts
export const crashCommands: {
  crashRoot: () => void;
  crashRoute: () => void;
  crashMap: () => void;
  crashBoot: () => void;
  reportUrl: (error?: unknown) => any;
};
```

```ts
// apps/web/src/lib/debug/crashSignal.ts
export type CrashTarget = 'root' | 'route' | 'map';
export const subscribeCrash: (listener: () => void) => () => void;
export const getCrashTarget: () => CrashTarget;
export const triggerCrash: (target: CrashTarget) => void;
export const clearCrash: () => void;
export const requestBootCrash: () => void;
export const throwIfBootCrashRequested: () => void;
```

```ts
// apps/web/src/lib/debug/migrationCommands.ts
export const migrationCommands: { rerunMigration: (options?: { count?: number; }) => Promise<void>; };
```

```ts
// apps/web/src/lib/debug/outdatedSessions.ts
export const SESSIONS_PERSIST_KEY: "store-sessions";
export const OUTDATED_VERSION: number;
export const persistedSessionsSchema: z.ZodObject<{
  state: z.ZodObject<{ sessions: z.ZodArray<z.ZodObject<{ id: z.ZodString; date: z.ZodNumber; }, z.core.$loose>>; }, z.core.$loose>;
}, z.core.$loose>;
export const markSessionsOutdated: (persisted: PersistedSessions, { count }?: {
  count?: number;
}) => {
  persisted: PersistedSessions;
  marked: number;
};
```

```ts
// apps/web/src/lib/debug/pvDebug.ts
export const registerPvDebug: () => void;
```

```ts
// apps/web/src/lib/explanations.ts
export type MetricId =
  | 'tss'
  | 'trimp'
  | 'duration'
  | 'tripLoad'
  | 'ctl'
  | 'atl'
  | 'tsb'
  | 'acwr'
  | 'normalizedPower'
  | 'gradeAdjustedPace'
  | 'recovery'
  | 'trainingZones'
  | 'aerobicTE'
  | 'anaerobicTE'
  | 'avgHr'
  | 'avgPace'
  | 'avgSpeed'
  | 'avgPower'
  | 'elevation'
  | 'vam'
  | 'cadence'
  | 'vdot'
  | 'calories'
  | 'movingTime'
  | 'decoupling'
  | 'intensityFactor'
  | 'variabilityIndex'
  | 'peakPower'
  | 'stepLength';
export interface MetricExplanation {
  id: MetricId;
  shortLabel?: string;
  friendlyName: string;
  oneLiner: string;
  range: string;
}
export const METRIC_EXPLANATIONS: Record<MetricId, MetricExplanation>;
```

```ts
// apps/web/src/lib/fetchResponse.ts
export type FailedResponseReason = 'unauthorized' | 'rate-limited' | 'failed';
export const failedResponseReason: (response: Response) => FailedResponseReason;
export class FailedResponseError extends Error {
  public readonly response: Response;
  public readonly reason: FailedResponseReason;

  constructor(options: { operation: string; response: Response }) {
    const reason = failedResponseReason(options.response);
    super(`${options.operation} failed with status ${options.response.status}. Reason: ${reason}`);
    this.name = 'FailedResponseError';
    this.response = options.response;
    this.reason = reason;
  }
}
```

```ts
// apps/web/src/lib/filterGrammar.ts
export const interpretFilterText: ({ text, now, }: { text: string; now: number; }) => FilterCriteria[];
```

```ts
// apps/web/src/lib/filterVocabulary.ts
export type QuantityUnit = 'km' | 'mi' | 'h' | 'min' | 'hm';
export type Unit = QuantityUnit | 'd' | 'w' | 'm' | 'y';
export const KEYWORDS: {
  approx: string[];
  km: string[];
  mi: string[];
  h: string[];
  min: string[];
  hm: string[];
  d: string[];
  w: string[];
  m: string[];
  y: string[];
  relative: string[];
  year: string[];
  this: string[];
  since: string[];
  today: string[];
  yesterday: string[];
  running: string[];
  cycling: string[];
};
export const EXACT_ONLY_UNITS: Unit[];
export const EXACT_UNIT_ORDER: Unit[];
export const PREFIX_UNIT_ORDER: Unit[];
export const MONTH_NAMES: string[][];
export const normalizeText: (text: string) => string;
```

```ts
// apps/web/src/lib/fingerprint.ts
export const generateFingerprint: ({ fileId, fallback, }: { fileId: FitFileId | undefined; fallback: FallbackFields; }) => string;
export const findDuplicates: ({ fingerprints, existingSessions, }: {
  fingerprints: string[];
  existingSessions: TrainingSession[];
}) => Set<string>;
```

```ts
// apps/web/src/lib/fitParseProfile.ts
export const toFitParseProfile: (profile: UserProfile) => (date: number) => FitParseProfile;
```

```ts
// apps/web/src/lib/formatters.ts
export type DateFormatMode =
  | 'date'
  | 'date-time'
  | 'short'
  | 'numeric-day'
  | 'numeric-month'
  | 'month-year'
  | 'hour-minute';
export const formatDate: (value: number | Date, mode?: DateFormatMode) => string;
export type DateRangeFormatMode =
  | 'day-month'
  | 'day-month-year'
  | 'month-year-short'
  | 'year'
  | 'day-month-without-year';
export const formatDateRange: (from: number | Date, to: number | Date, mode?: DateRangeFormatMode) => string;
export type NumberFormatMode =
  | 'integer'
  | 'one-decimal'
  | 'one-decimal-ungrouped'
  | 'fixed-one-decimal'
  | 'fixed-two-decimals'
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
export const formatBytes: (bytes: number) => string;
export const toDateString: (timestamp: number) => string;
export const formatDuration: (seconds: number) => string;
export const formatRaceTime: (seconds: number) => string;
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
// apps/web/src/lib/gpsTrack.ts
export const encodedSegmentPolylines: (points: RoutePoint[]) => string[];
export const buildSessionGPS: ({ sessionId, records, }: { sessionId: string; records: SessionRecord[]; }) => SessionGPS | null;
export const decodeTrackForRendering: (encodedPolyline: string) => [number, number][];
```

```ts
// apps/web/src/lib/gpxExport.ts
export const buildSessionGpx: ({ session, records, }: { session: TrainingSession; records: SessionRecord[]; }) => string | null;
export const buildRouteGpx: ({ points, markers, metadata, }: {
  points: RoutePoint[];
  markers: StudioMarker[];
  metadata: RouteGpxMetadata;
}) => string | null;
export const buildRouteSegmentGpx: ({ points, markers, startM, endM, metadata, }: {
  points: RoutePoint[];
  markers: StudioMarker[];
  startM: number;
  endM: number;
  metadata: RouteGpxMetadata;
}) => string | null;
export const buildGpxFilename: ({ sport, dateMs }: { sport: string; dateMs: number; }) => string;
```

```ts
// apps/web/src/lib/groupSteps.ts
export const groupSteps: (steps: WorkoutStep[]) => GroupedStep[];
```

```ts
// apps/web/src/lib/guardedSessionsStorage.ts
export const SESSIONS_DERIVATION_MARKER_KEY: "sessions-derivation-version";
export const claimSessionsDerivationVersion: () => Promise<"claimed" | "newer">;
export const createGuardedSessionsStorage: (guard: {
  isWriteAllowed: () => boolean;
  onNewerVersion: () => void;
}) => StateStorage & {
  flush: () => Promise<void>;
};
```

```ts
// apps/web/src/lib/hooks/useChartZoom.ts
export const useChartZoom: <T>({ data, xKey, onZoomComplete, onClick, }: UseChartZoomOptions<T>) => UseChartZoomReturn<T>;
```

```ts
// apps/web/src/lib/hooks/useDebouncedValue.ts
export const INPUT_DEBOUNCE_MS: 600;
export const useDebouncedValue: <T>(value: T, delayMs: number) => T;
```

```ts
// apps/web/src/lib/hooks/useDismiss.ts
export const useDismiss: (onClose: () => void, options?: DismissOptions) => RefObject<HTMLDivElement | null>;
```

```ts
// apps/web/src/lib/hooks/useSnackbar.ts
export interface Snackbar {
  enqueueSnackbar: (entry: SnackbarEntry) => void;
  closeSnackbar: (key: string) => void;
}
export const useSnackbar: () => Snackbar;
```

```ts
// apps/web/src/lib/hooks/useSyncedChartZoom.ts
export const useSyncedChartZoom: () => SyncedChartZoom;
```

```ts
// apps/web/src/lib/hooks/useZoomSelectionState.ts
export const useZoomSelectionState: <T>(data: T[]) => ZoomSelectionState;
```

```ts
// apps/web/src/lib/intervals.ts
export const MAX_ACTIVITIES_PER_IMPORT: 2000;
export type IntervalsErrorCode = FailedResponseReason | 'network';
export const intervalsErrorCode: (error: unknown) => IntervalsErrorCode;
export type IntervalsActivity = z.infer<typeof intervalsActivitySchema>;
export const verifyIntervalsKey: (apiKey: string) => Promise<void>;
export const FULL_HISTORY_OLDEST: "1990-01-01";
export const listIntervalsActivities: ({ apiKey, oldest, }: { apiKey: string; oldest?: string; }) => Promise<IntervalsActivity[]>;
export const downloadActivityFit: ({ apiKey, activity, }: { apiKey: string; activity: IntervalsActivity; }) => Promise<ArrayBuffer>;
export const intervalsSyncWindowOldest: (sessions: TrainingSession[]) => string | undefined;
```

```ts
// apps/web/src/lib/labsTab.ts
export type LabsTab = (typeof LABS_TABS)[number];
export const resolveLabsTab: (rawTab: string | null) => LabsTab;
```

```ts
// apps/web/src/lib/laps.ts
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
export interface LapSpan {
  lapIndex: number;
  startRecord: number;
  endRecord: number;
}
export interface LapBand {
  lapIndex: number;
  from: number;
  to: number;
}
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
// apps/web/src/lib/loadAxis.ts
export type LoadGroupBy = 'day' | 'week' | 'month';
export interface LoadBucket extends SportTss {
  key: string;
  from: string;
  to: string;
}
export const loadBucketKey: ({ day, groupBy }: { day: string; groupBy: LoadGroupBy; }) => string;
export const buildLoadAxis: ({ days, sportTss, groupBy, }: {
  days: readonly { date: string; }[];
  sportTss: ReadonlyMap<string, Partial<Record<string, number>>>;
  groupBy: LoadGroupBy;
}) => {
  rows: LoadDay[];
  buckets: Map<string, LoadBucket>;
};
```

```ts
// apps/web/src/lib/localizedTrainingEffect.ts
export const localizedTELabel: (key: TrainingEffectLabel) => string;
export const localizedTESummary: (key: TrainingEffectSummary) => string;
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
export const nextMapCamera: ({ state, obs, }: { state: MapCameraState; obs: MapCameraObservation; }) => MapCameraState;
export const isMapCameraFitBlocked: ({ fit, obs, }: { fit: MapCameraFit; obs: MapCameraObservation; }) => boolean;
export const settleMapCameraFit: (state: MapCameraState) => MapCameraState;
export const sessionMinZoom: ({ fitZoom, currentZoom, }: { fitZoom: number; currentZoom: number; }) => number;
```

```ts
// apps/web/src/lib/moreStats.ts
export type MoreStatsTopic = 'load' | 'calories' | 'power' | 'stride' | 'zones';
export const PEAK_WINDOW_SECONDS: readonly [5, 60, 300, 1200, 3600];
export interface MoreStats {
  sport: Sport;
  /** No threshold HR at the session date: HR load and training effect use the engine's estimate. */
  thresholdHrEstimated: boolean;
  calories?: EnergyEstimate | EnergyBlocked;
  movingTime?: {
    movingS: number;
    elapsedS: number;
    stoppedS: number;
    coastingS: number | undefined;
  };
  intensity?: { factor: number };
  variability?: { index: number; np: number; avgPower: number };
  peaks?: { slots: PeakSlot[]; highlight: number };
  stepLength?: { metres: number; stepsPerMinute: number };
  hrZones?: {
    zones: ZoneShare[];
    dominant: number;
    totalSeconds: number;
  };
  decoupling?: Decoupling;
}
export const buildMoreStats: ({ session, records, thresholds, }: {
  session: TrainingSession;
  records: SessionRecord[];
  thresholds: ResolvedThresholds | undefined;
}) => MoreStats;
export const moreStatsTopics: (stats: MoreStats) => MoreStatsTopic[];
export const peakScale: ({ watts, heightPx, }: {
  watts: Array<number | undefined>;
  heightPx: number;
}) => Array<number | undefined>;
export const pickPeak: ({ peaks, hovered, }: {
  peaks: NonNullable<MoreStats["peaks"]>;
  hovered: number | null;
}) => PeakPick | undefined;
export const pickZone: ({ zones, hovered, }: {
  zones: NonNullable<MoreStats["hrZones"]>;
  hovered: number | null;
}) => ZonePick | undefined;
```

```ts
// apps/web/src/lib/movingTime.ts
export const movingSeconds: (records: SessionRecord[]) => number[];
export const sessionMovingTime: (records: SessionRecord[]) => { movingS: number; elapsedS: number; } | undefined;
```

```ts
// apps/web/src/lib/prescription.ts
export const estimateWorkoutTss: (workout: PrescribedWorkout) => number;
export const estimateWorkoutDistance: ({ workout, zones, }: { workout: PrescribedWorkout; zones: RunningZone[]; }) => number;
export const generateWeeklyPlan: ({ currentMetrics, zones, today, historyDays, }: {
  currentMetrics: DailyMetrics | undefined;
  zones: RunningZone[];
  today: string;
  historyDays: number;
}) => WeeklyPlan;
export const generateFreshPlan: ({ sessions, zones, today, }: {
  sessions: TrainingSession[];
  zones: RunningZone[];
  today: string;
}) => WeeklyPlan;
```

```ts
// apps/web/src/lib/profileHistory.ts
export const SPARKLINE_PAD: 2;
export const firstSessionDateOf: (sessions: { date: number; }[]) => number | undefined;
export const profileHistorySeries: ({ history, context, }: {
  history: DatedValue<number>[];
  context: ProfileHistoryContext;
}) => ProfileHistorySeries;
export const profileHistoryDomain: ({ histories, context, }: {
  histories: DatedValue<number>[][];
  context: ProfileHistoryContext;
}) => [number, number];
export const sparklinePath: ({ points, domain, box, today, }: {
  points: ProfileHistoryPoint[];
  domain: [number, number];
  box: SparklineBox;
  today: number;
}) => SparklinePath;
export const sparklineDateAt: ({ x, domain, width, today, }: {
  x: number;
  domain: [number, number];
  width: number;
  today: number;
}) => number;
```

```ts
// apps/web/src/lib/queryClient.ts
export const createQueryClient: (config?: QueryClientConfig) => QueryClient;
```

```ts
// apps/web/src/lib/raceTime.ts
export const DISTANCE_OPTIONS: { value: RaceDistance; label: string; }[];
export const isLongFormat: (distance: RaceDistance) => boolean;
export const parseRaceTime: ({ input, distance, }: { input: string; distance: RaceDistance; }) => number | undefined;
```

```ts
// apps/web/src/lib/railFormat.ts
export const MISSING: "--";
export const railInt: (value: number | null | undefined) => string;
export const railFixed1: (value: number | null | undefined) => string;
export const railSigned1: (value: number | null | undefined) => string;
export const railGain: (meters: number | null | undefined) => string;
export const railLoss: (meters: number | null | undefined) => string;
export const railPace: (minPerKm: number | null | undefined) => string;
export const railPaceFromSecPerKm: (secPerKm: number | null | undefined) => string;
export const railVam: (metresPerHour: number) => string;
```

```ts
// apps/web/src/lib/railRange.ts
export interface RangeStats {
  avgHr: number | undefined;
  maxHr: number | undefined;
  avgPower: number | undefined;
  normalizedPower: number | undefined;
  avgSpeed: number | undefined;
  maxSpeed: number | undefined;
  avgCadence: number | undefined;
  maxCadence: number | undefined;
  elevationGain: number | undefined;
  elevationLoss: number | undefined;
  maxGrade: number | undefined;
  minGrade: number | undefined;
  avgGrade: number | undefined;
  avgPaceSecPerKm: number | undefined;
  bestPaceSecPerKm: number | undefined;
  gapSecPerKm: number | undefined;
  vam: number | undefined;
}
export const activeRailRange: ({ zoomRange, selectedLap, }: {
  zoomRange: RailRange | null;
  selectedLap: LapBand | undefined;
}) => RailRange | null;
export const computeRangeStats: ({ records, range, terrain, }: {
  records: SessionRecord[];
  range: RailRange;
  terrain: SessionTerrain;
}) => RangeStats;
```

```ts
// apps/web/src/lib/recordCodec.ts
export type EncodedRecords = { format: 'gzip-json'; data: ArrayBuffer };
export const encodeRecords: (records: SessionRecord[]) => Promise<EncodedRecords>;
export const decodeRecords: (value: unknown) => Promise<SessionRecord[]>;
```

```ts
// apps/web/src/lib/recordExtremes.ts
export const computeRecordExtremes: ({ records, gradients, }: {
  records: SessionRecord[];
  gradients: Array<number | undefined>;
}) => RecordExtremes;
```

```ts
// apps/web/src/lib/records.ts
export const PB_SLOTS: Record<Sport, { category: PBCategory; window: number; }[]>;
export const extractPeakPower: (records: SessionRecord[]) => Map<number, number>;
export const groupPBsBySport: (pbs: PersonalBest[]) => Partial<Record<Sport, PersonalBest[]>>;
export const computePBsForSessions: ({ sessions, existing, }: {
  sessions: PBSessionInput[];
  existing?: PersonalBest[];
}) => PersonalBest[];
```

```ts
// apps/web/src/lib/savedFilters.ts
export const ATTRIBUTE_FILTER_KEYS: ("distance" | "duration" | "elevationGain")[];
export const fuzzyBounds: ({ key, target, }: { key: AttributeFilterKey; target: number; }) => { min: number; max: number; };
export const matchesFuzzy: ({ value, key, target, }: {
  value: number | undefined;
  key: AttributeFilterKey;
  target: number | null;
}) => boolean;
export interface FilterCriteria {
  sport: Sport | null;
  time: FilterTime | null;
  distance: number | null;
  duration: number | null;
  elevationGain: number | null;
  name: string | null;
}
export interface SavedFilter {
  id: string;
  criteria: FilterCriteria;
}
export type FilterPartKind = 'sport' | 'time' | 'distance' | 'duration' | 'elevationGain' | 'name';
export const emptyCriteria: () => FilterCriteria;
export const isEmptyCriteria: (criteria: FilterCriteria) => boolean;
export const createDefaultSavedFilters: () => SavedFilter[];
export const filterKey: (criteria: FilterCriteria) => string;
export const matchesFilters: ({ session, criteria, now, }: {
  session: FilterSession;
  criteria: FilterCriteria | null;
  now: number;
}) => boolean;
export const filterParts: (criteria: FilterCriteria) => FilterPart[];
export const filterName: (criteria: FilterCriteria) => string;
export const filterTile: (criteria: FilterCriteria) => { kind: FilterPartKind; title: string; description: string; };
export const zoomTile: (criteria: FilterCriteria | null) => { title: string; description: string; } | null;
```

```ts
// apps/web/src/lib/sessionFitness.ts
export const ctlOnDate: ({ history, timestamp, }: { history: DailyMetrics[]; timestamp: number; }) => number;
```

```ts
// apps/web/src/lib/sessionStress.ts
export type StoredSessionStress = Pick<TrainingSession, 'tss' | 'stressMethod' | 'normalizedPower'>;
export const sessionStressAt: ({ session, profile, }: { session: StressInputs; profile: UserProfile; }) => StoredSessionStress;
export const sessionStressFromRecordsAt: ({ session, records, profile, }: {
  session: StressInputs;
  records: SessionRecord[];
  profile: UserProfile;
}) => StoredSessionStress;
export const trainingLoadHrSignature: (profile: UserProfile | null) => string;
export const trainingLoadFtpSignature: (profile: UserProfile | null) => string;
```

```ts
// apps/web/src/lib/sessionTerrain.ts
export interface SessionTerrain {
  gradients: Array<number | undefined>;
  climbs: Climb[];
  inClimb: boolean[];
}
export interface ClimbSpan {
  from: number;
  to: number;
  vam: number;
}
export const buildSessionTerrain: ({ sport, records, }: { sport: Sport; records: SessionRecord[]; }) => SessionTerrain;
export const climbSpansInMinutes: ({ records, climbs, }: { records: SessionRecord[]; climbs: Climb[]; }) => ClimbSpan[];
export const climbSpanAt: ({ spans, minute, }: { spans: ClimbSpan[]; minute: number; }) => ClimbSpan | undefined;
```

```ts
// apps/web/src/lib/sessionTitleFormatter.ts
export const formatSessionName: (input: SessionNameInput) => string;
export const formatSessionZoneLabel: ({ avgHr, maxHr, restHr, }: {
  avgHr: number | undefined;
  maxHr: number | undefined;
  restHr: number | undefined;
}) => string | undefined;
```

```ts
// apps/web/src/lib/snackbar.ts
export type SnackbarVariant = NonNullable<ToastItem['variant']>;
export interface SnackbarEntry {
  key: string;
  message: () => string;
  description?: () => string;
  variant: SnackbarVariant;
  persistent?: boolean;
}
export interface CountedSnackbarEntry extends Omit<SnackbarEntry, 'message'> {
  message: (inputs: { count: string }) => string;
}
export type SnackbarMap = Record<string, SnackbarEntry | CountedSnackbarEntry>;
```

```ts
// apps/web/src/lib/speedScale.ts
export const SPEED_PALETTE: any;
export interface SpeedScale extends ColorScale {
  slowKmh: number;
  fastKmh: number;
}
export const percentile: (sorted: number[], fraction: number) => number | undefined;
export const hasMovingSpeed: (records: SessionRecord[]) => boolean;
export const speedScale: (records: SessionRecord[]) => SpeedScale | undefined;
```

```ts
// apps/web/src/lib/statusColors.ts
export type AcwrColor = 'green' | 'yellow' | 'red';
export const statusTextClass: Record<FormStatus, string>;
export const statusFill: Record<FormStatus, string>;
export const acwrColorMap: {
  green: { bg: string; text: string; ring: string; };
  yellow: { bg: string; text: string; ring: string; };
  red: { bg: string; text: string; ring: string; };
};
export const acwrColor: (acwr: number) => AcwrColor;
export const acwrFill: { green: any; yellow: any; red: any; };
export const ACWR_ZONES: { from: number; to: number; color: any; }[];
export const sportColorClass: Record<Sport, string>;
```

```ts
// apps/web/src/lib/storageBreakdown.ts
export type StorageCategory = 'heatmap' | 'fitFiles' | 'weather' | 'appData';
export const breakdownStorage: ({ storeBytes, totalBytes, }: {
  storeBytes: Partial<Record<IdbStoreName, number>>;
  totalBytes: number | undefined;
}) => Record<StorageCategory, number>;
```

```ts
// apps/web/src/lib/thresholdsAt.ts
export interface ResolvedThresholds {
  restHr: number;
  maxHr: number;
  /** Raw threshold HR; `undefined` means the engine's estimate applies. */
  thresholdHr?: number;
  ftp?: number;
  thresholdPace?: number;
  weightKg?: number;
  age?: number;
  gender: Gender;
}
export type ThresholdsProfile = Pick<UserProfile, 'thresholds' | 'weight' | 'birthYear' | 'gender'>;
export const thresholdsAt: ({ profile, date, }: { profile: ThresholdsProfile; date: number; }) => ResolvedThresholds;
```

```ts
// apps/web/src/lib/timeRange.ts
export type FilterTimeUnit = 'day' | 'week' | 'month' | 'year';
export type FilterCalendarUnit = 'day' | 'week' | 'month';
export type FilterTime =
  | { kind: 'relative'; amount: number; unit: FilterTimeUnit }
  | { kind: 'calendarYear'; yearsAgo: number }
  | { kind: 'calendar'; unit: FilterCalendarUnit; ago: number }
  | { kind: 'since'; from: string }
  | { kind: 'range'; from: string; to: string; source: FilterRangeSource };
export const toDayKey: ({ year, monthIndex, day, }: { year: number; monthIndex: number; day: number; }) => string;
export const parseDayKey: (key: string) => Date;
export const resolveFilterRange: ({ time, now, }: { time: FilterTime | null; now: number; }) => ResolvedRange | null;
export const isZoomTime: (time: FilterTime | null) => boolean;
```

```ts
// apps/web/src/lib/trackSmoothing.ts
export const TRACK_SMOOTHING_SEC: { readonly hr: 5; readonly power: 30; readonly pace: 10; readonly speed: 10; readonly wind: 10; };
export const rollingMean: ({ times, values, windowSec, }: {
  times: number[];
  values: Array<number | undefined>;
  windowSec: number;
}) => Array<number | undefined>;
```

```ts
// apps/web/src/lib/validation.ts
export type SensorWarning =
  | { code: 'hr_above_max'; limit: number; count: number }
  | { code: 'hr_all_zero' }
  | { code: 'power_above_max'; limit: number; count: number }
  | { code: 'speed_above_max'; limit: number; count: number };
export const validateRecords: ({ records, sport, }: { records: SessionRecord[]; sport: Sport; }) => SensorWarning[];
```

```ts
// apps/web/src/lib/weather.ts
export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm';
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
export const wmoToCondition: (code: number) => WeatherCondition;
export type WeatherDescription =
  | WeatherCondition
  | 'drizzle-light'
  | 'drizzle-moderate'
  | 'drizzle-dense'
  | 'freezing-drizzle-light'
  | 'freezing-drizzle-dense'
  | 'rain-light'
  | 'rain-moderate'
  | 'rain-heavy'
  | 'freezing-rain-light'
  | 'freezing-rain-heavy'
  | 'snow-light'
  | 'snow-moderate'
  | 'snow-heavy'
  | 'snow-grains'
  | 'rain-showers-light'
  | 'rain-showers-moderate'
  | 'rain-showers-heavy'
  | 'snow-showers-light'
  | 'snow-showers-heavy'
  | 'thunderstorm-hail'
  | 'thunderstorm-heavy'
  | 'thunderstorm-hail-heavy';
export const wmoToDescription: (code: number) => WeatherDescription;
export const wmoToPrecipitation: (code: number) => PrecipitationIntensity | undefined;
export type PrecipitationType = 'rain' | 'freezing' | 'snow' | 'thunderstorm';
export type PrecipitationDots = 0 | 1 | 2 | 3;
export interface PrecipitationMark {
  dots: PrecipitationDots | undefined;
  type: PrecipitationType | undefined;
}
export const wmoToPrecipitationMark: (code: number) => PrecipitationMark;
export const computeHourlyWaypoints: ({ sessionDateMs, durationSec, records, }: {
  sessionDateMs: number;
  durationSec: number;
  records: SessionRecord[];
}) => Waypoint[];
export const deduplicateWaypoints: ({ waypoints, thresholdKm, }: { waypoints: Waypoint[]; thresholdKm: number; }) => WaypointCluster[];
export const buildWeatherUrl: ({ lat, lng, startDate, endDate, }: {
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
}) => string;
export const fetchSessionWeather: ({ sessionId, sessionDateMs, durationSec, records, }: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
  records: SessionRecord[];
}) => Promise<SessionWeather | undefined>;
export const toWindSamples: (weather: SessionWeather) => WindSample[];
export interface ValueRange {
  min: number;
  max: number;
}
export interface WeatherSummary {
  weatherCode: number;
  temperature: ValueRange;
  feelsLike: ValueRange;
  windSpeed: ValueRange;
  firstChange: ConditionChange | undefined;
}
export const summarizeWeather: (snapshots: WeatherSnapshot[]) => WeatherSummary | undefined;
```

```ts
// apps/web/src/lib/weekKey.ts
export const getMondayOfWeek: (dateStr: string) => string;
export const getMonthKey: (dateStr: string) => string;
export const loadBucketDayRange: ({ key, groupBy, }: {
  key: string;
  groupBy: "day" | "week" | "month";
}) => {
  from: string;
  to: string;
};
export const buildPlanCacheKey: ({ weekOf, loads, thresholdPace, }: {
  weekOf: string;
  loads: number[];
  thresholdPace: number;
}) => string;
```

```ts
// apps/web/src/lib/windRose.ts
export const WIND_ROSE_SECTOR_DEG: number;
export const windRoseSectorAngle: (sector: number) => number;
export const windRoseShares: (relative: Array<RelativeWind | undefined>) => number[] | null;
```

```ts
// apps/web/src/lib/zoneColors.ts
export type ZoneMetric = 'hr' | 'power' | 'pace';
export interface ZoneThresholds {
  maxHr?: number;
  restHr?: number;
  ftp?: number;
  thresholdPace?: number;
}
export interface ZoneBand {
  zone: string;
  name: string;
  min: number;
  max: number;
  mid: number;
  color: string;
}
export interface ColorScale {
  domain: number[];
  colorAt: (value: number) => string;
}
export interface ZoneScale extends ColorScale {
  bands: ZoneBand[];
  bandAt: (value: number) => ZoneBand;
}
export const WIND_COLORS: { readonly tail: any; readonly cross: any; readonly head: any; };
export const windColorAt: (angle: number) => string;
export const COLOR_BY_RUNNING_ZONE: Record<RunningZoneName, TokenColor>;
export const COLOR_BY_HEART_RATE_ZONE: Record<HeartRateZoneName, TokenColor>;
export const COLOR_BY_POWER_ZONE: Record<PowerZoneName, TokenColor>;
export const ZONE_PALETTES: Record<ZoneMetric, string[]>;
export const zoneScale: ({ metric, thresholds, }: {
  metric: ZoneMetric;
  thresholds: ZoneThresholds;
}) => ZoneScale | undefined;
export const zoneLineStroke: ({ scale, values, reversed, gradientId, }: {
  scale: ColorScale | undefined;
  values: Array<number | null | undefined>;
  reversed: boolean;
  gradientId: string;
}) => ZoneLineStroke | undefined;
```

```ts
// apps/web/src/main.tsx
// no exports
```

```ts
// apps/web/src/microcopy/colorModes.ts
export const LABEL_BY_COLOR_MODE: Record<ColorMode, () => string>;
export const DESCRIPTION_BY_COLOR_MODE: Record<any, () => string>;
export const PILL_LABEL_BY_COLOR_MODE: Record<ColorMode, () => string>;
export const COMPACT_LABEL_BY_COLOR_MODE: Record<ColorMode, () => string>;
export const REASON_BY_UNAVAILABLE_COLOR_MODE: Record<ColorModeUnavailableReason, () => string>;
```

```ts
// apps/web/src/microcopy/importProgress.ts
export const LABEL_BY_IMPORT_PHASE: Record<ImportPhase, () => string>;
```

```ts
// apps/web/src/microcopy/intervals.ts
export const MESSAGE_BY_INTERVALS_ERROR: Record<IntervalsErrorCode, () => string>;
```

```ts
// apps/web/src/microcopy/laps.ts
export const NUDGE_BY_EFFORT_LIMITER: Record<EffortLimiter, { precise: () => string; detect: () => string; }>;
```

```ts
// apps/web/src/microcopy/moreStats.ts
export const LABEL_BY_MORE_STATS_TOPIC: Record<MoreStatsTopic, () => string>;
export const LABEL_BY_STRESS_METHOD: Record<TrainingSession, () => string>;
export const LABEL_BY_ENERGY_BLOCKER: Record<EnergyBlocker, () => string>;
```

```ts
// apps/web/src/microcopy/sports.ts
export const LABEL_BY_SPORT: Record<Sport, () => string>;
export const RECORDS_SUBTITLE_BY_SPORT: Record<Sport, () => string>;
```

```ts
// apps/web/src/microcopy/studioMarkers.ts
export const ADD_LABEL_BY_STUDIO_MARKER_TYPE: Record<StudioMarkerType, () => string>;
```

```ts
// apps/web/src/microcopy/thresholds.ts
export const ADD_CAPTION_BY_THRESHOLD: Record<ThresholdKey, () => string>;
export const TITLE_BY_THRESHOLD_FIELD: Record<ThresholdKey, () => string>;
```

```ts
// apps/web/src/microcopy/trackIntensity.ts
export const LABEL_BY_TRACK_INTENSITY: Record<TrackIntensity, () => string>;
export const DESCRIPTION_BY_TRACK_INTENSITY: Record<TrackIntensity, () => string>;
```

```ts
// apps/web/src/microcopy/trainingLoad.ts
export const LABEL_BY_FORM_STATUS: Record<FormStatus, () => string>;
export const LABEL_BY_INJURY_RISK: Record<InjuryRisk, () => string>;
```

```ts
// apps/web/src/microcopy/volume.ts
export const LABEL_BY_VOLUME_METRIC: Record<VolumeMetric, () => string>;
```

```ts
// apps/web/src/microcopy/zones.ts
export const LABEL_BY_RUNNING_ZONE: Record<RunningZoneName, () => string>;
```

```ts
// apps/web/src/mutations/intervals/useConnectIntervalsMutation.ts
export const useConnectIntervalsMutation: () => UseMutationResult<IntervalsSyncSummary, Error, { apiKey: string; }>;
```

```ts
// apps/web/src/mutations/sessions/useDeleteSessionMutation.ts
export const useDeleteSessionMutation: () => UseMutationResult<void, Error, { sessionId: string; }>;
```

```ts
// apps/web/src/mutations/settings/useClearAllDataMutation.ts
export const useClearAllDataMutation: () => UseMutationResult<void, Error, void>;
```

```ts
// apps/web/src/mutations/studio/useDeleteStudioRouteMutation.ts
export const useDeleteStudioRouteMutation: () => UseMutationResult<void, Error, { routeId: string; }>;
```

```ts
// apps/web/src/pages/DashboardPage.tsx
export const DashboardPage: FC;
```

```ts
// apps/web/src/pages/LabsPage.tsx
export const LabsPage: FC;
```

```ts
// apps/web/src/pages/OnboardingPage.tsx
export const OnboardingPage: FC;
```

```ts
// apps/web/src/pages/SessionDetailPage.tsx
export const SessionDetailPage: FC;
```

```ts
// apps/web/src/pages/SessionsPage.tsx
export const SessionsPage: FC;
```

```ts
// apps/web/src/pages/SettingsPage.tsx
export const SettingsPage: FC;
```

```ts
// apps/web/src/pages/StudioDetailPage.tsx
export const StudioDetailPage: FC;
```

```ts
// apps/web/src/pages/TripDetailPage.tsx
export const TripDetailPage: FC;
```

```ts
// apps/web/src/parsers/fit.ts
export interface ParsedFitResult {
  session: SessionFields;
  records: SessionRecord[];
  laps: SessionLap[];
  fingerprint: string;
}
export type ParsedFitResultWithMeta = ParsedFitResult & {
  fileName: string;
  rawData: ArrayBuffer;
  source: SessionSource;
};
export const mapFitLaps: (fitLaps: FitLapInput[]) => SessionLap[];
export interface FitParseProfile {
  restHr: number;
  maxHr: number;
  gender: Gender;
  ftp?: number;
  thresholdHr?: number;
}
export const parseFitFile: ({ arrayBuffer, fileName, profileAt, meta, }: {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  profileAt: (date: number) => FitParseProfile;
  meta?: { name?: string; };
}) => Promise<ParsedFitResult>;
```

```ts
// apps/web/src/parsers/fitSchemas.ts
export const enumStrSchema: z.ZodPipe<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>, z.ZodTransform<string, string | number>>;
export const fitFileIdSchema: z.ZodObject<{
  serial_number: z.ZodOptional<z.ZodNumber>;
  time_created: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
}, z.core.$strip>;
export type FitFileId = z.infer<typeof fitFileIdSchema>;
export const fitRecordInputSchema: z.ZodObject<{
  elapsed_time: z.ZodNumber;
  heart_rate: z.ZodOptional<z.ZodNumber>;
  power: z.ZodOptional<z.ZodNumber>;
  cadence: z.ZodOptional<z.ZodNumber>;
  speed: z.ZodOptional<z.ZodNumber>;
  enhanced_speed: z.ZodOptional<z.ZodNumber>;
  position_lat: z.ZodOptional<z.ZodNumber>;
  position_long: z.ZodOptional<z.ZodNumber>;
  altitude: z.ZodOptional<z.ZodNumber>;
  enhanced_altitude: z.ZodOptional<z.ZodNumber>;
  distance: z.ZodOptional<z.ZodNumber>;
  timer_time: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export const fitRecordsSchema: z.ZodArray<z.ZodObject<{
  elapsed_time: z.ZodNumber;
  heart_rate: z.ZodOptional<z.ZodNumber>;
  power: z.ZodOptional<z.ZodNumber>;
  cadence: z.ZodOptional<z.ZodNumber>;
  speed: z.ZodOptional<z.ZodNumber>;
  enhanced_speed: z.ZodOptional<z.ZodNumber>;
  position_lat: z.ZodOptional<z.ZodNumber>;
  position_long: z.ZodOptional<z.ZodNumber>;
  altitude: z.ZodOptional<z.ZodNumber>;
  enhanced_altitude: z.ZodOptional<z.ZodNumber>;
  distance: z.ZodOptional<z.ZodNumber>;
  timer_time: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>>;
export type FitRecordInput = z.infer<typeof fitRecordInputSchema>;
export const fitLapInputSchema: z.ZodObject<{
  start_time: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
  timestamp: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
  message_index: z.ZodOptional<z.ZodObject<{ value: z.ZodNumber; }, z.core.$strip>>;
  total_elapsed_time: z.ZodNumber;
  total_timer_time: z.ZodNumber;
  total_moving_time: z.ZodOptional<z.ZodNumber>;
  total_distance: z.ZodOptional<z.ZodNumber>;
  min_heart_rate: z.ZodOptional<z.ZodNumber>;
  max_heart_rate: z.ZodOptional<z.ZodNumber>;
  intensity: z.ZodPipe<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>, z.ZodTransform<string, string | number>>;
}, z.core.$strip>;
export const fitLapsSchema: z.ZodArray<z.ZodObject<{
  start_time: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
  timestamp: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
  message_index: z.ZodOptional<z.ZodObject<{ value: z.ZodNumber; }, z.core.$strip>>;
  total_elapsed_time: z.ZodNumber;
  total_timer_time: z.ZodNumber;
  total_moving_time: z.ZodOptional<z.ZodNumber>;
  total_distance: z.ZodOptional<z.ZodNumber>;
  min_heart_rate: z.ZodOptional<z.ZodNumber>;
  max_heart_rate: z.ZodOptional<z.ZodNumber>;
  intensity: z.ZodPipe<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>, z.ZodTransform<string, string | number>>;
}, z.core.$strip>>;
export type FitLapInput = z.infer<typeof fitLapInputSchema>;
```

```ts
// apps/web/src/queries/intervals/useIntervalsKeyCheck.ts
export const intervalsKeyCheckQueryKey: (options: { apiKey: string; }) => string[];
export const checkIntervalsKey: (options: { apiKey: string; }) => Promise<QueryResults["intervalsKeyCheck"]>;
export const useIntervalsKeyCheck: (options: {
  apiKey: string;
  savedKey: string | null;
}) => UseQueryResult<QueryResults["intervalsKeyCheck"]>;
```

```ts
// apps/web/src/queries/intervals/useIntervalsSync.ts
export const intervalsSyncQueryKey: () => string[];
export const useIntervalsSync: () => UseQueryResult<QueryResults["intervalsSync"]>;
```

```ts
// apps/web/src/queries/onboarding/useOnboardingPreviewRoutes.ts
export const loadOnboardingPreviewRoutes: () => Promise<QueryResults["onboardingPreviewRoutes"]>;
export const onboardingPreviewRoutesQueryKey: () => string[];
export const useOnboardingPreviewRoutes: () => UseQueryResult<QueryResults["onboardingPreviewRoutes"]>;
```

```ts
// apps/web/src/queries/records/usePersonalBests.ts
export const personalBestsQueryKey: () => string[];
export const computePersonalBests: (options: {
  sessions: PBSessionMeta[];
  signal: AbortSignal;
}) => Promise<QueryResults["personalBests"]>;
export const usePersonalBests: () => UseQueryResult<QueryResults["personalBests"]>;
export const invalidatePersonalBests: (queryClient: QueryClient) => Promise<void>;
export const invalidatePersonalBestsOfSession: (sessionId: string, queryClient: QueryClient) => Promise<void> | undefined;
export const resetPersonalBests: (queryClient: QueryClient) => Promise<void>;
```

```ts
// apps/web/src/queries/sessions/useOutdatedSessionsReprocessing.ts
export const reprocessOutdated: (options: { queryClient: QueryClient; }) => Promise<QueryResults["outdatedSessionsReprocessing"]>;
export const outdatedSessionsReprocessingQueryKey: () => string[];
export const useOutdatedSessionsReprocessing: () => UseQueryResult<QueryResults["outdatedSessionsReprocessing"]>;
```

```ts
// apps/web/src/queries/sessions/useSessionGps.ts
export const loadSessionGps: (options: { sessionId: string; }) => Promise<QueryResults["sessionGps"]>;
export const sessionGpsQueryKey: (options: { sessionId: string; }) => string[];
export const invalidateSessionGps: (queryClient: QueryClient) => Promise<void>;
export const resetSessionGps: (queryClient: QueryClient) => void;
export const useSessionGps: (options: { sessionId: string; enabled: boolean; }) => UseQueryResult<QueryResults["sessionGps"]>;
```

```ts
// apps/web/src/queries/sessions/useSessionGpsTracks.ts
export const loadSessionGpsTracks: (options: {
  detailedSessionIds: string[];
  signal: AbortSignal;
  queryClient: QueryClient;
  onSettled: () => void;
}) => Promise<QueryResults["sessionGpsTracks"]>;
export const sessionGpsTracksQueryKey: (options: { detailedSessionIds: string[]; }) => string[];
export const useSessionGpsTracks: () => UseQueryResult<QueryResults["sessionGpsTracks"]>;
```

```ts
// apps/web/src/queries/sessions/useSessionLaps.ts
export const loadSessionLaps: (options: { sessionId: string; }) => Promise<QueryResults["sessionLaps"]>;
export const sessionLapsQueryKey: (options: { sessionId: string; }) => string[];
export const useSessionLaps: (options: { sessionId: string; enabled: boolean; }) => UseQueryResult<QueryResults["sessionLaps"]>;
```

```ts
// apps/web/src/queries/sessions/useSessionRecords.ts
export const loadSessionRecords: (options: { sessionId: string; }) => Promise<QueryResults["sessionRecords"]>;
export const sessionRecordsQueryKey: (options: { sessionId: string; }) => string[];
export const useSessionRecords: (options: {
  sessionId: string;
  enabled: boolean;
}) => UseQueryResult<QueryResults["sessionRecords"]>;
```

```ts
// apps/web/src/queries/sessions/useTrainingLoadRecompute.ts
export const recomputeTrainingLoadOnce: () => Promise<QueryResults["trainingLoadRecompute"]>;
export const trainingLoadRecomputeQueryKey: (options: { hrSignature: string; ftpSignature: string; }) => string[];
export const useTrainingLoadRecompute: () => UseQueryResult<QueryResults["trainingLoadRecompute"]>;
```

```ts
// apps/web/src/queries/settings/useStorageBreakdown.ts
export interface StorageBreakdown {
  total: number | null;
  categories: Record<StorageCategory, number> | null;
}
export const measureStorageBreakdown: () => Promise<QueryResults["storageBreakdown"]>;
export const storageBreakdownQueryKey: (options: { sessionCount: number; }) => (string | number)[];
export const useStorageBreakdown: (options: { sessionCount: number; }) => UseQueryResult<QueryResults["storageBreakdown"]>;
```

```ts
// apps/web/src/queries/studio/useStudioRoutePoints.ts
export const loadStudioRoutePoints: (options: { routeId: string; }) => Promise<QueryResults["studioRoutePoints"]>;
export const studioRoutePointsQueryKey: (options: { routeId: string; }) => string[];
export const invalidateStudioRoutePoints: (options: { routeId: string; }, queryClient: QueryClient) => Promise<void>;
export const resetStudioRoutePoints: (queryClient: QueryClient) => void;
export const useStudioRoutePoints: (options: { routeId: string; }) => UseQueryResult<QueryResults["studioRoutePoints"]>;
```

```ts
// apps/web/src/queries/weather/useSessionWeather.ts
export const loadSessionWeather: (options: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}) => Promise<QueryResults["sessionWeather"]>;
export const sessionWeatherQueryKey: (options: { sessionId: string; }) => string[];
export const useSessionWeather: (options: {
  sessionId: string;
  sessionDateMs: number;
  durationSec: number;
}) => UseQueryResult<QueryResults["sessionWeather"]>;
```

```ts
// apps/web/src/routing/AppRouter.tsx
export const AppRouter: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/routing/AppRoutes.tsx
export const AppRoutes: FC;
```

```ts
// apps/web/src/routing/PageLink.tsx
export const PageLink: FC<PageLinkProps>;
```

```ts
// apps/web/src/routing/PageOutlet.tsx
export const PageOutlet: FC;
```

```ts
// apps/web/src/routing/pageRegistry.ts
export const SUPPORTED_PAGES: {
  readonly dashboard: "dashboard";
  readonly sessions: "sessions";
  readonly sessionDetail: "sessionDetail";
  readonly tripDetail: "tripDetail";
  readonly studioDetail: "studioDetail";
  readonly labs: "labs";
  readonly settings: "settings";
};
export type SupportedPage = (typeof SUPPORTED_PAGES)[keyof typeof SUPPORTED_PAGES];
export type SessionsTab = 'log' | 'trips' | 'records';
export type StudioDetailTab = 'overview' | 'tools';
export type SettingsTab = 'general' | 'data';
export const PAGE_PATTERNS: {
  dashboard: string;
  sessions: string;
  sessionDetail: string;
  tripDetail: string;
  studioDetail: string;
  labs: string;
  settings: string;
};
export const PAGE_TO_URL: {
  dashboard: (_params: NoParams) => string;
  sessions: (params: { tab?: SessionsTab; }) => string;
  sessionDetail: (params: { sessionId: string; }) => string;
  tripDetail: (params: { tripId: string; }) => string;
  studioDetail: (params: { routeId: string; tab?: StudioDetailTab; }) => string;
  labs: (params: { tab?: LabsTab; }) => string;
  settings: (params: { tab?: SettingsTab; }) => string;
};
export type ResolvePageParams<P extends SupportedPage> = Parameters<(typeof PAGE_TO_URL)[P]>[0];
export type PageTarget = {
  [P in SupportedPage]: { page: P; params: ResolvePageParams<P> };
}[SupportedPage];
export const pageUrl: (target: PageTarget) => string;
```

```ts
// apps/web/src/routing/urlQuery.ts
export const SUPPORTED_QUERY: { readonly id: "id"; readonly tab: "tab"; };
export type SupportedQuery = (typeof SUPPORTED_QUERY)[keyof typeof SUPPORTED_QUERY];
```

```ts
// apps/web/src/routing/useCurrentPage.ts
export const useCurrentPage: () => SupportedPage | null;
```

```ts
// apps/web/src/routing/useCurrentPath.ts
export const useCurrentPath: () => string;
```

```ts
// apps/web/src/routing/usePageRouting.ts
export interface PageRouting {
  open: (target: PageTarget) => void;
}
export const usePageRouting: () => PageRouting;
```

```ts
// apps/web/src/routing/useRouteMatch.ts
export interface RouteMatch {
  id: string | undefined;
}
export const useRouteMatch: (page: SupportedPage) => RouteMatch | null;
```

```ts
// apps/web/src/routing/useRouterParam.ts
export const useRouterParam: (key: SupportedQuery) => string | undefined;
```

```ts
// apps/web/src/routing/useRouterQuery.ts
export interface RouterQuery {
  push: ({ key, value }: { key: SupportedQuery; value: string }) => void;
}
export const useRouterQuery: () => RouterQuery;
```

```ts
// apps/web/src/store/chartHover.ts
export type ChartHoverX = number | string;
export const useChartHoverStore: UseBoundStore<WithImmer<StoreApi<ChartHoverState>>>;
export const useChartHoverX: (group: string) => ChartHoverX | null;
```

```ts
// apps/web/src/store/coachPlan.ts
export const INITIAL_COACH_PLAN_STORE_STATE: Pick<CoachPlanState, "cachedPlan" | "cacheKey">;
export const useCoachPlanStore: UseBoundStore<WithPersist<WithImmer<StoreApi<CoachPlanState>>, unknown>>;
```

```ts
// apps/web/src/store/filters.ts
export const migrateFilters: (persistedState: unknown, fromVersion: number) => PersistedFilters;
export const useFiltersStore: UseBoundStore<WithPersist<WithImmer<StoreApi<FiltersState>>, unknown>>;
```

```ts
// apps/web/src/store/geolocation.ts
export const INITIAL_GEOLOCATION_STORE_STATE: Pick<GeolocationState, "error" | "tracking" | "position" | "accuracy">;
export const useGeolocationStore: UseBoundStore<WithImmer<StoreApi<GeolocationState>>>;
```

```ts
// apps/web/src/store/hooks/useStoresHydrated.ts
export const useStoresHydrated: () => boolean;
```

```ts
// apps/web/src/store/importProgress.ts
export type ImportPhase = 'preparing' | 'importing' | 'saving';
export type ForegroundTask = 'import' | 'reprocess';
export type ImportSummary =
  | { kind: 'imported'; imported: number; duplicated: number; failed: number }
  | { kind: 'nothing-new' }
  | { kind: 'no-activities' }
  | { kind: 'failed'; message: string };
export interface ForegroundImport {
  task: ForegroundTask;
  phase: ImportPhase;
  processed: number;
  total: number;
  openedAt: number;
  summary: ImportSummary | null;
}
export const INITIAL_IMPORT_PROGRESS_STORE_STATE: Pick<ImportProgressState, "runningImports" | "foreground" | "awaitingTrackBuild" | "mapCrashed">;
export const useImportProgressStore: UseBoundStore<WithImmer<StoreApi<ImportProgressState>>>;
```

```ts
// apps/web/src/store/intervals.ts
export const INITIAL_INTERVALS_STORE_STATE: Pick<IntervalsState, "apiKey" | "importedActivityIds" | "keyInvalid" | "backlogPending">;
export const useIntervalsStore: UseBoundStore<WithPersist<WithImmer<StoreApi<IntervalsState>>, unknown>>;
```

```ts
// apps/web/src/store/layout.ts
export const INITIAL_LAYOUT_STORE_STATE: Pick<LayoutState, "onboardingComplete" | "demoMode" | "mobileSheetPosition">;
export const useLayoutStore: UseBoundStore<WithPersist<WithImmer<StoreApi<LayoutState>>, unknown>>;
```

```ts
// apps/web/src/store/mapControls.ts
export const MAP_VIEWS: readonly ["2d", "3d"];
export type MapView = (typeof MAP_VIEWS)[number];
export const INITIAL_MAP_CONTROLS_STORE_STATE: Pick<MapControlsState, "sessionLaps" | "trackColorMode" | "selectedLapIndex" | "lapCloseCount" | "hoveredLapIndex" | "overviewMapControlsShown" | "sessionMapView" | "terrainTrackHovered">;
export const useMapControlsStore: UseBoundStore<WithImmer<StoreApi<MapControlsState>>>;
```

```ts
// apps/web/src/store/mapFocus.ts
export const INITIAL_MAP_FOCUS_STORE_STATE: Pick<MapFocusState, "hoveredSessionId" | "openedSessionId" | "focusedTripSessionIds" | "hoveredStudioRouteId" | "hoveredPoint" | "pickCircle" | "mapRefitRequest">;
export const useMapFocusStore: UseBoundStore<WithImmer<StoreApi<MapFocusState>>>;
```

```ts
// apps/web/src/store/mapPreferences.ts
export const TRACK_INTENSITIES: readonly ["faint", "warm", "hot"];
export type TrackIntensity = (typeof TRACK_INTENSITIES)[number];
export const INITIAL_MAP_PREFERENCES_STORE_STATE: Pick<MapPreferencesState, "trackIntensity" | "bySport">;
export const useMapPreferencesStore: UseBoundStore<WithPersist<WithImmer<StoreApi<MapPreferencesState>>, unknown>>;
```

```ts
// apps/web/src/store/sessionReprocessing.ts
export type SessionReprocessingPhase = 'pending' | 'waiting' | 'running' | 'done';
export const INITIAL_SESSION_REPROCESSING_STORE_STATE: Pick<SessionReprocessingState, "phase" | "newerVersionInOtherTab">;
export const useSessionReprocessingStore: UseBoundStore<WithImmer<StoreApi<SessionReprocessingState>>>;
```

```ts
// apps/web/src/store/sessions.ts
export type RecomputedTrainingLoad = Pick<
  TrainingSession,
  'id' | 'tss' | 'stressMethod' | 'normalizedPower'
>;
export const guardedSessionsStorage: any;
export const INITIAL_SESSIONS_STORE_STATE: Pick<SessionsState, "sessions" | "appliedHrSignature">;
export const useSessionsStore: UseBoundStore<WithPersist<WithImmer<StoreApi<SessionsState>>, unknown>>;
```

```ts
// apps/web/src/store/studio.ts
export type StudioRouteColor = 'amber' | 'orange' | 'rose' | 'fuchsia' | 'violet' | 'emerald';
export type StudioMarkerType = 'track_modifier' | 'point_of_interest';
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
export const INITIAL_STUDIO_STORE_STATE: Pick<StudioState, "routes">;
export const useStudioStore: UseBoundStore<WithPersist<WithImmer<StoreApi<StudioState>>, unknown>>;
```

```ts
// apps/web/src/store/studioMarkerEditor.ts
export const useStudioMarkerEditorStore: UseBoundStore<StoreApi<StudioMarkerEditorState>>;
```

```ts
// apps/web/src/store/toast.ts
export const INITIAL_TOAST_STORE_STATE: Pick<ToastState, "toasts">;
export const useToastStore: UseBoundStore<WithImmer<StoreApi<ToastState>>>;
```

```ts
// apps/web/src/store/trips.ts
export interface Trip {
  id: string;
  name: string;
  description?: string;
  sessionIds: string[];
  createdAt: number;
}
export const INITIAL_TRIPS_STORE_STATE: Pick<TripsState, "trips">;
export const useTripsStore: UseBoundStore<WithPersist<WithImmer<StoreApi<TripsState>>, unknown>>;
```

```ts
// apps/web/src/store/user.ts
export type ThresholdKey = 'restHr' | 'maxHr' | 'thresholdHr' | 'ftp' | 'thresholdPace' | 'weight';
export const INITIAL_USER_STORE_STATE: Pick<UserState, "profile">;
export const useUserStore: UseBoundStore<WithPersist<WithImmer<StoreApi<UserState>>, unknown>>;
```

```ts
// apps/web/src/types.ts
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
export interface QueryResults {
  onboardingPreviewRoutes: PreviewPasses;
  sessionWeather: SessionWeather | null;
  personalBests: PersonalBest[];
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
```

```ts
// apps/web/tests/factories/coaching.ts
export const createMockCoachingRecommendation: (overrides?: Partial<CoachingRecommendation>) => CoachingRecommendation;
export const createMockWorkoutStep: (overrides?: Partial<WorkoutStep>) => WorkoutStep;
export const createMockWeeklyPlan: (overrides?: Partial<WeeklyPlan>) => WeeklyPlan;
```

```ts
// apps/web/tests/factories/profiles.ts
export const createMockUserProfile: (overrides?: Partial<UserProfile>) => UserProfile;
```

```ts
// apps/web/tests/features/dashboard/dashboardDate.spec.ts
// no exports
```

```ts
// apps/web/tests/features/dashboard/hooks/useFilteredMetrics.spec.ts
// no exports
```

```ts
// apps/web/tests/features/demo/buildDemoDataset.spec.ts
// no exports
```

```ts
// apps/web/tests/features/intervals/runIntervalsImport.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/features/intervals/runIntervalsSync.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/fitPadding.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/hooks/useMapHover.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/hooks/useMapRendererHandOver.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/hooks/useMapTracks.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/lapPath.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/previewDrawIn.spec.ts
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
// apps/web/tests/features/map/trackPicking.spec.ts
// no exports
```

```ts
// apps/web/tests/features/map/zoneColoredPath.spec.ts
// no exports
```

```ts
// apps/web/tests/features/sessions/createIngestBatcher.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/features/sessions/recomputeTrainingLoad.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/features/sessions/reprocessSessions.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/features/sessions/session/lapLabels.spec.ts
// no exports
```

```ts
// apps/web/tests/features/sessions/session/sensorWarningText.spec.ts
// no exports
```

```ts
// apps/web/tests/features/settings/hooks/useThresholdsForm.spec.ts
// no exports
```

```ts
// apps/web/tests/features/studio/markers/routeSegments.spec.ts
// no exports
```

```ts
// apps/web/tests/features/studio/routeColors.spec.ts
// no exports
```

```ts
// apps/web/tests/features/trips/tripStats.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/archive.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/attributeFilters.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/chartBuckets.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/chartData.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/chartData.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/chartTheme.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/coachingMessages.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/coachingMessages.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/colorModes.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/crashReport.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/dashboardVolume.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/db.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/debug/outdatedSessions.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/dynamicLaps.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/effortLaps.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filename.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filterGrammar.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/fingerprint.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/formatters.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/gpsTrack.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/gpxExport.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/groupSteps.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/hooks/useChartZoom.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/hooks/useSnackbar.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/indexeddb.deleteAllData.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/indexeddb.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/indexeddb.studioPoints.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/intervals.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/intervalsSyncWindow.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/labsTab.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/lapRanges.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/lapSet.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/lapSummary.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/laps.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/loadAxis.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/mapCamera.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/moreStats.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/movingTime.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/prescription.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/profileHistory.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/railRange.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/recordExtremes.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/records.computePbsForSessions.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/records.groupPbsBySport.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/savedFilters.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/seriesSummary.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/sessionFitness.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/sessionTitleFormatter.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/speedScale.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/statusColors.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/thresholdsAt.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/timeRange.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/trackSmoothing.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/validation.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/validation.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/weather.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/weatherSummary.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/weekKey.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/windRose.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/zoneColors.spec.ts
// no exports
```

```ts
// apps/web/tests/parsers/fit.laps.spec.ts
// no exports
```

```ts
// apps/web/tests/parsers/fit.requiredFields.spec.ts
// no exports
```

```ts
// apps/web/tests/parsers/fit.spec.ts
// no exports
```

```ts
// apps/web/tests/parsers/fit.thresholds.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/parsers/fitSchemas.spec.ts
// no exports
```

```ts
// apps/web/tests/queries/records/usePersonalBests.spec.ts
// no exports
```

```ts
// apps/web/tests/queries/sessions/useSessionGpsTracks.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/queries/sessions/useTrainingLoadRecompute.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/queries/studio/useStudioRoutePoints.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/routing/pageRegistry.spec.ts
// no exports
```

```ts
// apps/web/tests/setup.ts
// no exports
```

```ts
// apps/web/tests/store/coachPlan.spec.ts
// no exports
```

```ts
// apps/web/tests/store/filters.spec.ts
// no exports
```

```ts
// apps/web/tests/store/geolocation.spec.ts
// no exports
```

```ts
// apps/web/tests/store/layout.spec.ts
// no exports
```

```ts
// apps/web/tests/store/mapControls.spec.ts
// no exports
```

```ts
// apps/web/tests/store/mapFocus.spec.ts
// no exports
```

```ts
// apps/web/tests/store/mapPreferences.spec.ts
// no exports
```

```ts
// apps/web/tests/store/sessions.engine.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/store/sessions.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/store/studio.spec.ts
// no exports
```

```ts
// apps/web/tests/store/toast.spec.ts
// no exports
```

```ts
// apps/web/tests/store/trips.spec.ts
// no exports
```

```ts
// apps/web/tests/store/user.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/testUtils/defined.ts
export const definedOrThrow: <T>(value: T | undefined) => T;
export const recordOrThrow: (value: unknown) => Record<string, unknown>;
export const listOrThrow: (value: unknown) => unknown[];
```

```ts
// apps/web/tests/testUtils/fixtures.ts
export const readE2eFixture: (name: string) => ArrayBuffer;
```

```ts
// apps/web/tests/testUtils/locale.ts
export const importInLocale: <T>(locale: Locale, load: () => Promise<T>) => Promise<T>;
```

```ts
// apps/web/tests/testUtils/matchMedia.ts
export const DESKTOP_MIN_WIDTH: number;
export const createMatchMedia: (width: number, options?: { pointerFine?: boolean; }) => Window["matchMedia"];
```

```ts
// apps/web/tests/testUtils/queryClient.ts
export const createTestQueryClient: () => QueryClient;
```

```ts
// apps/web/tests/testUtils/render.ts
export const renderWithProviders: (ui: ReactElement, options?: ProviderOptions) => RenderResult;
export const renderHookWithProviders: <Result, Props>(hook: (initialProps: Props) => Result, options?: ProviderOptions & {
  initialProps?: Props;
}) => RenderHookResult<Result, Props>;
```

```ts
// apps/web/tests/testUtils/testProviders.tsx
export interface ProviderOptions {
  queryClient?: QueryClient;
  initialPath?: string;
  strict?: boolean;
}
export const createTestProviders: (options?: ProviderOptions) => FC<PropsWithChildren>;
```

```ts
// packages/engine/src/bounds.ts
export const boundsFromPoints: (points: GPSPoint[]) => GPSBounds;
export const hasBoundsOverlap: ({ first, second, }: { first: GPSBounds; second: GPSBounds; }) => boolean;
export const unionBounds: (boundsArray: GPSBounds[]) => GPSBounds | null;
export const isSegmentIntersectingBounds: ({ from, to, bounds, }: {
  from: [number, number];
  to: [number, number];
  bounds: GPSBounds;
}) => boolean;
export const densestClusterBounds: (boundsArray: GPSBounds[]) => GPSBounds | null;
```

```ts
// packages/engine/src/cadence.ts
export const stepsPerMinute: (strideCadence: number) => number;
export const coastingSeconds: (records: SessionRecord[]) => number | undefined;
export const stepLength: (records: SessionRecord[]) => StepLength | undefined | null;
```

```ts
// packages/engine/src/changePoints.ts
export const peltChangePoints: ({ values, beta, minBins, }: { values: number[]; beta: number; minBins: number; }) => number[];
```

```ts
// packages/engine/src/climbs.ts
export interface Climb {
  startIndex: number;
  endIndex: number;
  gain: number;
  movingSec: number;
  vam: number;
}
export const detectClimbs: ({ sport, records, gradients, }: {
  sport: Sport;
  records: SessionRecord[];
  gradients: Array<number | undefined>;
}) => Climb[];
export const climbingRate: ({ records, climbs, startIndex, endIndex, }: {
  records: SessionRecord[];
  climbs: Climb[];
  startIndex: number;
  endIndex: number;
}) => number | undefined;
```

```ts
// packages/engine/src/coaching.ts
export const ACWR_UNDERTRAINING_THRESHOLD: 0.8;
export const ACWR_MODERATE_THRESHOLD: 1.3;
export const ACWR_HIGH_THRESHOLD: 1.5;
export const formStatusFromTsb: (tsb: number) => FormStatus;
export const loadStateFromAcwr: ({ acwr, dataMaturityDays, }: { acwr: number; dataMaturityDays: number; }) => LoadState;
export const injuryRiskFromAcwr: (acwr: number) => InjuryRisk;
```

```ts
// packages/engine/src/datedValue.ts
export const valueAt: <T>({ history, date, }: { history: DatedValue<T>[]; date: number; }) => T | undefined;
export const upsertDatedValue: <T>({ history, entry, }: { history: DatedValue<T>[]; entry: DatedValue<T>; }) => DatedValue<T>[];
```

```ts
// packages/engine/src/decoupling.ts
export interface Decoupling {
  ratio: DecouplingRatio;
  firstHalf: number;
  secondHalf: number;
  pct: number;
}
export const DECOUPLING_WELL_PACED_PCT: 5;
export const DECOUPLING_SCALE_PCT: 10;
export const aerobicDecoupling: ({ records, sport, gradients, }: {
  records: SessionRecord[];
  sport: Sport;
  gradients: Array<number | undefined>;
}) => Decoupling | undefined | null;
```

```ts
// packages/engine/src/effortDetection.ts
export type EffortSignal = 'power' | 'pace' | 'hr';
export type EffortLimiter = 'ftp' | 'thresholdPace';
export type EffortKind = 'work' | 'rest' | 'steady' | 'warmup' | 'cooldown';
export interface EffortThresholds {
  restHr: number;
  maxHr: number;
  ftp?: number;
  thresholdPaceSecPerKm?: number;
}
export interface EffortBlock {
  kind: EffortKind;
  startSec: number;
  endSec: number;
  startIndex: number;
  endIndex: number;
  movingSec: number;
  /**
   * Mean of the detection signal over the block's moving time: power W, pace grade-adjusted
   * speed m/s, HR bpm (read 30 s ahead). `undefined` when the block has no samples.
   */
  signalMean: number | undefined;
}
export const detectEfforts: ({ records, sport, thresholds, }: {
  records: SessionRecord[];
  sport: Sport;
  thresholds: EffortThresholds;
}) => EffortDetection;
```

```ts
// packages/engine/src/energy.ts
export type EnergyBlocker = 'weight' | 'age' | 'weightAndAge';
export interface EnergyBody {
  weightKg?: number;
  age?: number;
  gender?: Gender;
}
export interface EnergyEstimate {
  method: EnergyMethod;
  kcal: number;
  uncertainty: number;
}
export interface EnergyBlocked {
  blockedBy: EnergyBlocker;
}
export const estimateSessionEnergy: ({ records, sport, body, gradients, }: {
  records: SessionRecord[];
  sport: Sport;
  body: EnergyBody;
  gradients: Array<number | undefined>;
}) => EnergyEstimate | EnergyBlocked | undefined;
```

```ts
// packages/engine/src/geodesy.ts
export const EARTH_RADIUS_METERS: 6371000;
export const isValidCoordinate: (point: { lat?: number | null; lng?: number | null; }) => point is { lat: number; lng: number; };
export const degreesToRadians: (degrees: number) => number;
export const haversineDistanceMeters: ({ from, to }: { from: GPSPoint; to: GPSPoint; }) => number;
export const initialBearingDegrees: ({ from, to }: { from: GPSPoint; to: GPSPoint; }) => number;
```

```ts
// packages/engine/src/gradient.ts
export interface GradientPoint {
  distance?: number;
  elevation?: number | null;
}
export const windowedGradients: (points: GradientPoint[]) => Array<number | undefined>;
export const averageGradient: ({ points, startIndex, endIndex, }: {
  points: GradientPoint[];
  startIndex: number;
  endIndex: number;
}) => number | undefined;
```

```ts
// packages/engine/src/metrics.ts
export const localDayKey: (timestamp: number) => string;
export const dailyMetricsFromSessions: ({ sessions, endDate, includeGhosts, }: {
  sessions: TrainingSession[];
  endDate?: number;
  includeGhosts?: boolean;
}) => DailyMetrics[];
```

```ts
// packages/engine/src/normalizedEffort.ts
export const powerPerSecond: (records: SessionRecord[]) => number[];
export const normalizedPowerFromRecords: (records: SessionRecord[]) => number | undefined;
export const gradeAdjustedPaceFactor: (gradient: number) => number;
export const gradeAdjustedPaceFromRecords: ({ records, gradients, }: {
  records: SessionRecord[];
  gradients?: Array<number | undefined>;
}) => number | undefined;
```

```ts
// packages/engine/src/paceCalculator.ts
export const timeFromPaceAndDistance: ({ paceSecPerKm, distanceMeters, }: { paceSecPerKm: number; distanceMeters: number; }) => number;
export const paceFromDistanceAndTime: ({ distanceMeters, timeSec, }: { distanceMeters: number; timeSec: number; }) => number;
export const distanceFromPaceAndTime: ({ paceSecPerKm, timeSec, }: { paceSecPerKm: number; timeSec: number; }) => number;
```

```ts
// packages/engine/src/recordPairs.ts
export const MAX_MOVING_PAIR_GAP_SEC: 10;
export const activeSeconds: ({ previous, current, }: { previous: SessionRecord; current: SessionRecord; }) => number;
export const isMovingPair: ({ previous, current, }: { previous: SessionRecord; current: SessionRecord; }) => boolean;
```

```ts
// packages/engine/src/sessionDerivation.ts
export const SESSION_DERIVATION_VERSION: 5;
export const isSessionOutdated: (session: { derivationVersion: number; }) => boolean;
export const deriveDistanceFromRecords: (records: SessionRecord[]) => number | undefined;
export const timeWeightedMean: ({ records, field, }: {
  records: SessionRecord[];
  field: "power" | "cadence" | "hr";
}) => number | undefined;
export const deriveAvgFromRecords: ({ records, field, }: {
  records: SessionRecord[];
  field: "power" | "cadence" | "hr";
}) => number | undefined;
export const deriveMaxFromRecords: ({ records, field, }: {
  records: SessionRecord[];
  field: "power" | "speed" | "hr";
}) => number | undefined;
export const deriveSessionFieldsFromRecords: ({ sport, records, }: { sport: Sport; records: SessionRecord[]; }) => RecordDerivedFields;
```

```ts
// packages/engine/src/stress.ts
export const BANISTER_BY_GENDER: Record<Gender, BanisterCoefficients>;
export const DEFAULT_THRESHOLD_HRR: 0.88;
export const intensityFactor: ({ np, ftp }: { np: number; ftp: number; }) => number | undefined;
export const variabilityIndex: ({ np, avgPower, }: { np: number; avgPower: number; }) => number | undefined;
export const thresholdHrRatio: (thresholds: HrThresholds) => number;
export const hrReserveSamples: ({ records, restHr, maxHr, }: {
  records: SessionRecord[];
  restHr: number;
  maxHr: number;
}) => HrReserveSample[];
export const banisterImpulse: ({ samples, gender, }: { samples: HrReserveSample[]; gender: Gender; }) => number;
export const stressFromSummary: ({ sport, summary, thresholds, }: {
  sport: Sport;
  summary: StressSummary;
  thresholds: StressThresholds;
}) => SessionStress;
export const stressFromRecords: ({ sport, records, summary, thresholds, }: {
  sport: Sport;
  records: SessionRecord[];
  summary: StressSummary;
  thresholds: StressThresholds;
}) => SessionStress;
```

```ts
// packages/engine/src/time.ts
export const MS_PER_SECOND: 1000;
export const MS_PER_MINUTE: number;
export const MS_PER_HOUR: number;
export const MS_PER_DAY: number;
```

```ts
// packages/engine/src/trainingEffect.ts
export type TrainingEffectLabel =
  | 'overreaching'
  | 'highly_improving'
  | 'improving'
  | 'maintaining'
  | 'minor'
  | 'no_effect';
export type TrainingEffectSummary =
  | 'too_easy'
  | 'extreme'
  | 'steady_aerobic'
  | 'high_intensity'
  | 'mixed_intensity'
  | 'easy_maintenance'
  | 'moderate'
  | 'light';
export const trainingEffectFromRecords: ({ records, thresholds, ctl, }: {
  records: SessionRecord[];
  thresholds: TrainingEffectThresholds;
  ctl: number;
}) => {
  aerobic: number;
  anaerobic: number;
} | undefined;
export const trainingEffectLabel: (te: number) => TrainingEffectLabel;
export const trainingEffectSummary: ({ aerobic, anaerobic, }: { aerobic: number; anaerobic: number; }) => TrainingEffectSummary;
```

```ts
// packages/engine/src/types.ts
export const SPORTS: readonly ["running", "cycling"];
export type Sport = (typeof SPORTS)[number];
export type Gender = 'male' | 'female';
export type FormStatus = 'detraining' | 'fresh' | 'neutral' | 'optimal' | 'overload';
export type InjuryRisk = 'low' | 'moderate' | 'high';
export type LoadState =
  | 'immature'
  | 'transitioning'
  | 'high-risk'
  | 'moderate-risk'
  | 'undertraining'
  | 'sweet-spot';
export type RunningZoneName = 'recovery' | 'easy' | 'tempo' | 'threshold' | 'vo2max';
export const RACE_DISTANCES: readonly ["5k", "10k", "half-marathon", "marathon"];
export type RaceDistance = (typeof RACE_DISTANCES)[number];
export type PBCategory = 'peak-power' | 'fastest-distance' | 'longest' | 'most-elevation';
export type SessionSource =
  | { kind: 'file' }
  | { kind: 'intervals'; activityId: string }
  | { kind: 'demo' };
export interface TrainingSession {
  id: string;
  name?: string;
  sport: Sport;
  date: number;
  duration: number;
  distance?: number;
  avgHr?: number;
  maxHr?: number;
  avgPower?: number;
  normalizedPower?: number;
  avgCadence?: number;
  avgPace?: number;
  elevationGain?: number;
  elevationLoss?: number;
  subSport?: string;
  avgSpeed?: number;
  maxSpeed?: number;
  gap?: number;
  tss: number;
  stressMethod: 'tss' | 'trimp' | 'duration';
  isPlanned: boolean;
  hasDetailedRecords: boolean;
  fingerprint?: string;
  derivationVersion: number;
  createdAt: number;
  isNew?: boolean;
  source: SessionSource;
}
export type SessionFields = Omit<TrainingSession, 'id' | 'createdAt' | 'isNew' | 'source'>;
export interface SessionRecord {
  timestamp: number;
  hr?: number;
  power?: number;
  cadence?: number;
  speed?: number;
  lat?: number;
  lng?: number;
  elevation?: number;
  distance?: number;
  timerTime?: number;
}
export interface SessionLap {
  lapIndex: number;
  startTime: number;
  endTime: number;
  totalTimerTime: number;
  totalMovingTime?: number;
  distance?: number;
  minHr?: number;
  maxHr?: number;
  intensity?: string;
}
export interface DailyMetrics {
  date: string;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
  acwr: number;
}
export interface RunningZone {
  name: RunningZoneName;
  slowestPaceSecPerKm: number;
  fastestPaceSecPerKm: number;
}
export interface PersonalBest {
  sport: Sport;
  category: PBCategory;
  window: number;
  value: number;
  sessionId: string;
  date: number;
}
export interface GPSPoint {
  lat: number;
  lng: number;
}
export interface GPSBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
export interface SessionGPS {
  sessionId: string;
  encodedPolyline: string;
  pointCount: number;
  bounds: GPSBounds;
}
export interface DatedValue<T> {
  date: number;
  value: T;
}
export interface StressThresholds {
  restHr: number;
  maxHr: number;
  gender: Gender;
  ftp?: number;
  thresholdHr?: number;
}
```

```ts
// packages/engine/src/vdot.ts
export const METERS_BY_RACE_DISTANCE: Record<"5k" | "10k" | "half-marathon" | "marathon", number>;
export const vdotFromRace: ({ distanceMeters, timeMin, }: { distanceMeters: number; timeMin: number; }) => number;
export const thresholdPaceFromRace: ({ distanceMeters, timeMin, }: { distanceMeters: number; timeMin: number; }) => number;
export const predictRaceTime: ({ vdot, targetDistanceMeters, }: {
  vdot: number;
  targetDistanceMeters: number;
}) => number | undefined;
export const predictRaceTimes: ({ distanceMeters, timeSec, }: {
  distanceMeters: number;
  timeSec: number;
}) => Record<RaceDistance, RacePrediction> | undefined;
```

```ts
// packages/engine/src/wattsPerKg.ts
export const wattsPerKgHistory: ({ ftp, weight, }: {
  ftp: DatedValue<number>[];
  weight: DatedValue<number>[];
}) => DatedValue<number>[];
```

```ts
// packages/engine/src/windExposure.ts
export interface WindSample {
  timeMs: number;
  directionDegrees: number;
}
export interface WindExposure {
  headwindPct: number;
  crosswindPct: number;
  tailwindPct: number;
  movingSec: number;
}
export interface RelativeWind {
  angle: number;
  durationSec: number;
}
export const windAngles: ({ records, wind, sessionStartMs, }: {
  records: SessionRecord[];
  wind: WindSample[];
  sessionStartMs: number;
}) => Array<number | undefined>;
export const relativeWindAngles: ({ records, wind, sessionStartMs, }: {
  records: SessionRecord[];
  wind: WindSample[];
  sessionStartMs: number;
}) => Array<RelativeWind | undefined>;
export const windExposureFromRecords: ({ records, wind, sessionStartMs, }: {
  records: SessionRecord[];
  wind: WindSample[];
  sessionStartMs: number;
}) => WindExposure | null;
```

```ts
// packages/engine/src/zones.ts
export const HEART_RATE_ZONES: readonly [{
  readonly zone: "Z1";
  readonly name: "recovery";
  readonly minPct: 0.5;
  readonly maxPct: 0.6;
}, {
  readonly zone: "Z2";
  readonly name: "aerobic";
  readonly minPct: 0.6;
  readonly maxPct: 0.7;
}, {
  readonly zone: "Z3";
  readonly name: "tempo";
  readonly minPct: 0.7;
  readonly maxPct: 0.8;
}, {
  readonly zone: "Z4";
  readonly name: "threshold";
  readonly minPct: 0.8;
  readonly maxPct: 0.9;
}, {
  readonly zone: "Z5";
  readonly name: "vo2max";
  readonly minPct: 0.9;
  readonly maxPct: 1;
}];
export type HeartRateZoneName = (typeof HEART_RATE_ZONES)[number]['name'];
export const POWER_ZONES: readonly [{
  readonly zone: "Z1";
  readonly name: "active_recovery";
  readonly minPct: 0;
  readonly maxPct: 0.55;
}, {
  readonly zone: "Z2";
  readonly name: "endurance";
  readonly minPct: 0.55;
  readonly maxPct: 0.75;
}, {
  readonly zone: "Z3";
  readonly name: "tempo";
  readonly minPct: 0.75;
  readonly maxPct: 0.9;
}, {
  readonly zone: "Z4";
  readonly name: "threshold";
  readonly minPct: 0.9;
  readonly maxPct: 1.05;
}, {
  readonly zone: "Z5";
  readonly name: "vo2max";
  readonly minPct: 1.05;
  readonly maxPct: 1.2;
}, {
  readonly zone: "Z6";
  readonly name: "anaerobic";
  readonly minPct: 1.2;
  readonly maxPct: 1.5;
}, {
  readonly zone: "Z7";
  readonly name: "neuromuscular";
  readonly minPct: 1.5;
  readonly maxPct: number;
}];
export type PowerZoneName = (typeof POWER_ZONES)[number]['name'];
export const runningZonesFromThresholdPace: (thresholdPaceSecPerKm: number) => RunningZone[];
export const zoneForPace: ({ paceSecPerKm, zones, }: {
  paceSecPerKm: number;
  zones: RunningZone[];
}) => RunningZone | undefined;
export const zoneMidPace: (zone: RunningZone) => number;
export const secondsInZones: ({ records, zoneIndexAt, zoneCount, }: {
  records: SessionRecord[];
  zoneIndexAt: (hr: number) => number;
  zoneCount: number;
}) => number[];
```

```ts
// packages/engine/tests/bounds.spec.ts
// no exports
```

```ts
// packages/engine/tests/cadence.spec.ts
// no exports
```

```ts
// packages/engine/tests/climbs.spec.ts
// no exports
```

```ts
// packages/engine/tests/coaching.spec.ts
// no exports
```

```ts
// packages/engine/tests/datedValue.spec.ts
// no exports
```

```ts
// packages/engine/tests/decoupling.spec.ts
// no exports
```

```ts
// packages/engine/tests/effortDetection.spec.ts
// no exports
```

```ts
// packages/engine/tests/energy.spec.ts
// no exports
```

```ts
// packages/engine/tests/geodesy.spec.ts
// no exports
```

```ts
// packages/engine/tests/gradient.spec.ts
// no exports
```

```ts
// packages/engine/tests/metrics.ewmaAlpha.spec.ts
// no exports
```

```ts
// packages/engine/tests/metrics.spec.ts
// no exports
```

```ts
// packages/engine/tests/normalizedEffort.spec.ts
// no exports
```

```ts
// packages/engine/tests/paceCalculator.spec.ts
// no exports
```

```ts
// packages/engine/tests/stress.spec.ts
// no exports
```

```ts
// packages/engine/tests/trainingEffect.spec.ts
// no exports
```

```ts
// packages/engine/tests/vdot.spec.ts
// no exports
```

```ts
// packages/engine/tests/wattsPerKg.spec.ts
// no exports
```

```ts
// packages/engine/tests/windExposure.spec.ts
// no exports
```

```ts
// packages/engine/tests/zones.spec.ts
// no exports
```

```ts
// packages/engine/vitest.config.ts
export default UserConfig;
```

```ts
// packages/gpx/src/buildGpx.ts
export interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
  seg?: number;
}
export interface GpxWaypoint {
  lat: number;
  lon: number;
  ele?: number;
  name: string;
  desc?: string;
}
export interface GpxMetadata {
  name?: string;
  time: Date;
}
export const buildGpxString: ({ points, metadata, waypoints, }: {
  points: GpxPoint[];
  metadata: GpxMetadata;
  waypoints?: GpxWaypoint[];
}) => string | null;
```

```ts
// packages/gpx/src/parseGpx.ts
export type ParsedGpxPoint = z.infer<typeof parsedGpxPointSchema>;
export const parseGpx: (gpxText: string) => ParsedGpx | null;
```

```ts
// packages/gpx/src/routeCut.ts
export const pointAtRouteDistance: ({ points, distanceMeters, }: {
  points: RoutePoint[];
  distanceMeters: number;
}) => RoutePoint | null;
export const sliceRoute: ({ points, startMeters, endMeters, }: {
  points: RoutePoint[];
  startMeters: number;
  endMeters: number;
}) => RoutePoint[];
export const routeDistanceAtPosition: ({ points, position, }: { points: RoutePoint[]; position: RoutePosition; }) => number | null;
```

```ts
// packages/gpx/src/routeGeometry.ts
export interface RouteElevationStats {
  gain: number;
  loss: number;
  min: number;
  max: number;
  maxGrade: number;
}
export const groupBySegment: <T extends { seg: number; }>(points: T[]) => T[][];
export const segmentGradients: (segment: RoutePoint[]) => Array<number | undefined>;
export const buildRouteGeometry: (parsedPoints: ParsedGpxPoint[]) => RouteGeometry | null;
```

```ts
// packages/gpx/src/routeProfile.ts
export interface RouteProfile {
  elevation: RouteElevationPoint[];
  grade: RouteGradePoint[];
}
export const buildRouteProfile: (points: RoutePoint[]) => RouteProfile;
```

```ts
// packages/gpx/src/types.ts
export interface RoutePoint extends ParsedGpxPoint {
  dist: number;
}
```

```ts
// packages/gpx/tests/buildGpx.spec.ts
// no exports
```

```ts
// packages/gpx/tests/parseGpx.spec.ts
// no exports
```

```ts
// packages/gpx/tests/routeCut.spec.ts
// no exports
```

```ts
// packages/gpx/tests/routeGeometry.spec.ts
// no exports
```

```ts
// packages/gpx/tests/routeProfile.spec.ts
// no exports
```

```ts
// packages/gpx/vitest.config.ts
export default UserConfig;
```

```ts
// packages/i18n/paraglide.config.ts
export const paraglideConfig: {
  project: string;
  outdir: string;
  strategy: ("baseLocale" | "preferredLanguage" | "localStorage")[];
};
```

```ts
// packages/i18n/vite.ts
export const i18nPlugin: () => Plugin<any> | Plugin<any>[];
```

```ts
// packages/testing/src/dailyMetrics.ts
export const createMockDailyMetrics: (overrides?: Partial<DailyMetrics>) => DailyMetrics;
```

```ts
// packages/testing/src/gps.ts
export const createMockSessionGPS: (overrides?: Partial<SessionGPS>) => SessionGPS;
```

```ts
// packages/testing/src/personalBests.ts
export const createMockPersonalBest: (overrides?: Partial<PersonalBest>) => PersonalBest;
```

```ts
// packages/testing/src/records.ts
export const createMockSessionRecord: (overrides?: Partial<SessionRecord>) => SessionRecord;
export const createMockSessionLap: (overrides?: Partial<SessionLap>) => SessionLap;
```

```ts
// packages/testing/src/route.ts
export const createMockParsedGpxPoint: (overrides?: Partial<ParsedGpxPoint>) => ParsedGpxPoint;
export const createMockRoutePoint: (overrides?: Partial<RoutePoint>) => RoutePoint;
export const createMockGpxPoint: (overrides?: Partial<GpxPoint>) => GpxPoint;
export const createMockGpxWaypoint: (overrides?: Partial<GpxWaypoint>) => GpxWaypoint;
export const createMockGpxMetadata: (overrides?: Partial<GpxMetadata>) => GpxMetadata;
```

```ts
// packages/testing/src/series.ts
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
```

```ts
// packages/testing/src/sessions.ts
export const createMockTrainingSession: (overrides?: Partial<TrainingSession>) => TrainingSession;
```

```ts
// packages/ui/src/components/pvActionPromptCard/PvActionPromptCard.tsx
export const PvActionPromptCard: FC<PvActionPromptCardProps>;
```

```ts
// packages/ui/src/components/pvActionTile/PvActionTile.tsx
export const PvActionTile: FC<PvActionTileProps>;
```

```ts
// packages/ui/src/components/pvActionTile/PvActionTileContent.tsx
export const PvActionTileContent: FC<PvActionTileContentProps>;
```

```ts
// packages/ui/src/components/pvActionTile/types.ts
export type ActionTileLook = 'solid' | 'dashed' | 'accent' | 'hint';
```

```ts
// packages/ui/src/components/pvActionsMenu/PvActionsMenu.tsx
export const PvActionsMenu: FC<PvActionsMenuProps>;
```

```ts
// packages/ui/src/components/pvActionsMenu/PvActionsMenuSheetRow.tsx
export const PvActionsMenuSheetRow: FC<PvActionsMenuSheetRowProps>;
```

```ts
// packages/ui/src/components/pvActionsMenu/types.ts
export interface ActionsMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}
```

```ts
// packages/ui/src/components/pvBanner/PvBanner.tsx
export const PvBanner: FC<PvBannerProps>;
```

```ts
// packages/ui/src/components/pvBottomSheet/PvBottomSheet.tsx
export const PvBottomSheet: FC<PvBottomSheetProps>;
```

```ts
// packages/ui/src/components/pvBottomSheet/PvBottomSheetProvider.tsx
export interface SheetAboveMotion {
  y: MotionValue<number>;
  height: number;
}
export const useSheetScrollContext: () => SheetScrollContextValue;
export const useUnstableSheetScrollContext: () => SheetScrollContextValue | undefined;
export const useSheetAboveContext: () => SheetAboveContextValue;
export const useUnstableSheetAboveContext: () => SheetAboveContextValue | undefined;
export const useSheetPeekContext: () => SheetPeekContextValue;
export const useUnstableSheetPeekContext: () => SheetPeekContextValue | undefined;
export const PvBottomSheetProvider: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// packages/ui/src/components/pvBottomSheet/PvSheetAbove.tsx
export const PvSheetAbove: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// packages/ui/src/components/pvBottomSheet/PvSheetPeek.tsx
export const PvSheetPeek: FC<PvSheetPeekProps>;
```

```ts
// packages/ui/src/components/pvButton/PvButton.tsx
export const PvButton: FC<PvButtonProps>;
```

```ts
// packages/ui/src/components/pvCard/PvCard.tsx
export const PvCard: FC<PvCardProps>;
```

```ts
// packages/ui/src/components/pvCardGrid/PvCardGrid.tsx
export const PvCardGrid: FC<PvCardGridProps>;
```

```ts
// packages/ui/src/components/pvCardHeader/PvCardHeader.tsx
export const PvCardHeader: FC<PvCardHeaderProps>;
```

```ts
// packages/ui/src/components/pvChartsCard/PvChartRow.tsx
export const PvChartRow: FC<PvChartRowProps>;
```

```ts
// packages/ui/src/components/pvChartsCard/PvChartsCard.tsx
export const PvChartsCard: FC<PvChartsCardProps>;
```

```ts
// packages/ui/src/components/pvChartsCard/PvZoomResetPill.tsx
export const PvZoomResetPill: FC<PvZoomResetPillProps>;
```

```ts
// packages/ui/src/components/pvCheckbox/PvCheckbox.tsx
export const PvCheckbox: FC<PvCheckboxProps>;
```

```ts
// packages/ui/src/components/pvChip/PvChip.tsx
export const PvChip: FC<PvChipProps>;
```

```ts
// packages/ui/src/components/pvCollapsibleHeader/PvCollapsibleHeader.tsx
export const PvCollapsibleHeader: FC<PvCollapsibleHeaderProps>;
```

```ts
// packages/ui/src/components/pvCollapsibleListItem/PvCollapsibleContent.tsx
export const PvCollapsibleContent: FC<PvCollapsibleContentProps>;
```

```ts
// packages/ui/src/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx
export const PvCollapsibleListItem: FC<PvCollapsibleListItemProps>;
```

```ts
// packages/ui/src/components/pvCrumbs/PvCrumbs.tsx
export const PvCrumbs: FC<PvCrumbsProps>;
```

```ts
// packages/ui/src/components/pvCrumbs/PvWrappingCrumbs.tsx
export const PvWrappingCrumbs: FC<PvWrappingCrumbsProps>;
```

```ts
// packages/ui/src/components/pvDataTable/PvDataTable.tsx
export const PvDataTable: <T>(props: PvDataTableProps<T>) => JSX.Element;
```

```ts
// packages/ui/src/components/pvDialog/PvDialog.tsx
export const PvDialog: FC<DialogPrimitive.DialogProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogBody.tsx
export const PvDialogBody: FC<PvDialogBodyProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogCard.tsx
export const PvDialogCard: FC<PvDialogCardProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogContent.tsx
export const PvDialogContent: FC<PvDialogContentProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogDescription.tsx
export const PvDialogDescription: FC<DialogPrimitive.DialogDescriptionProps & RefAttributes<HTMLParagraphElement>>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogFooter.tsx
export const PvDialogFooter: FC<PvDialogFooterProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogHeader.tsx
export const PvDialogHeader: FC<PvDialogHeaderProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogOverlay.tsx
export const PvDialogOverlay: FC<DialogPrimitive.DialogOverlayProps & RefAttributes<HTMLDivElement>>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogTitle.tsx
export const PvDialogTitle: FC<DialogPrimitive.DialogTitleProps & RefAttributes<HTMLHeadingElement>>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogTrigger.tsx
export const PvDialogTrigger: ForwardRefExoticComponent<DialogPrimitive.DialogTriggerProps & RefAttributes<HTMLButtonElement>>;
```

```ts
// packages/ui/src/components/pvDropdownMenu/PvDropdownMenu.tsx
export const PvDropdownMenu: FC<DropdownMenuPrimitive.DropdownMenuProps>;
```

```ts
// packages/ui/src/components/pvDropdownMenu/PvDropdownMenuContent.tsx
export const PvDropdownMenuContent: FC<DropdownMenuPrimitive.DropdownMenuContentProps & RefAttributes<HTMLDivElement>>;
```

```ts
// packages/ui/src/components/pvDropdownMenu/PvDropdownMenuItem.tsx
export const PvDropdownMenuItem: FC<PvDropdownMenuItemProps>;
```

```ts
// packages/ui/src/components/pvDropdownMenu/PvDropdownMenuTrigger.tsx
export const PvDropdownMenuTrigger: ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuTriggerProps & RefAttributes<HTMLButtonElement>>;
```

```ts
// packages/ui/src/components/pvExternalLink/PvExternalLink.tsx
export const PvExternalLink: FC<PvExternalLinkProps>;
```

```ts
// packages/ui/src/components/pvFloatingPill/PvFloatingPill.tsx
export const PvFloatingPill: FC<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>>;
```

```ts
// packages/ui/src/components/pvGaugeDial/PvGaugeArcs.tsx
export const PvGaugeArcs: FC<PvGaugeArcsProps>;
```

```ts
// packages/ui/src/components/pvGaugeDial/PvGaugeDial.tsx
export const PvGaugeDial: FC<PvGaugeDialProps>;
```

```ts
// packages/ui/src/components/pvGaugeDial/types.ts
export type GaugeZone = { from: number; to: number; color: TokenColor };
```

```ts
// packages/ui/src/components/pvHelperText/PvHelperText.tsx
export const PvHelperText: FC<PvHelperTextProps>;
```

```ts
// packages/ui/src/components/pvIconBadge/PvIconBadge.tsx
export const PvIconBadge: FC<PvIconBadgeProps>;
```

```ts
// packages/ui/src/components/pvIconFact/PvIconFact.tsx
export const PvIconFact: FC<PvIconFactProps>;
```

```ts
// packages/ui/src/components/pvIconTile/PvIconTile.tsx
export const PvIconTile: FC<PvIconTileProps>;
```

```ts
// packages/ui/src/components/pvInlineSkeleton/PvInlineSkeleton.tsx
export const PvInlineSkeleton: FC<PvInlineSkeletonProps>;
```

```ts
// packages/ui/src/components/pvInput/PvInput.tsx
export const PvInput: FC<PvInputProps>;
```

```ts
// packages/ui/src/components/pvLabel/PvLabel.tsx
export const PvLabel: FC<PvLabelProps>;
```

```ts
// packages/ui/src/components/pvList/PvList.tsx
export const PvList: FC<PvListProps>;
```

```ts
// packages/ui/src/components/pvList/PvListItem.tsx
export const PvListItem: FC<PvListItemProps>;
```

```ts
// packages/ui/src/components/pvListItemHeader/PvListItemHeader.tsx
export const PvListItemHeader: FC<PvListItemHeaderProps>;
```

```ts
// packages/ui/src/components/pvPageGrid/PvPageGrid.tsx
export const PvPageGrid: FC<PvPageGridProps>;
```

```ts
// packages/ui/src/components/pvPopover/PvPopover.tsx
export const PvPopover: FC<PopoverPrimitive.PopoverProps>;
```

```ts
// packages/ui/src/components/pvPopover/PvPopoverAnchor.tsx
export const PvPopoverAnchor: ForwardRefExoticComponent<PopoverPrimitive.PopoverAnchorProps & RefAttributes<HTMLDivElement>>;
```

```ts
// packages/ui/src/components/pvPopover/PvPopoverContent.tsx
export const PvPopoverContent: FC<PopoverPrimitive.PopoverContentProps & RefAttributes<HTMLDivElement>>;
```

```ts
// packages/ui/src/components/pvPopover/PvPopoverTrigger.tsx
export const PvPopoverTrigger: ForwardRefExoticComponent<PopoverPrimitive.PopoverTriggerProps & RefAttributes<HTMLButtonElement>>;
```

```ts
// packages/ui/src/components/pvRadioGroup/PvRadioGroup.tsx
export const PvRadioGroup: FC<PvRadioGroupProps>;
```

```ts
// packages/ui/src/components/pvRadioGroup/PvRadioGroupItem.tsx
export const PvRadioGroupItem: FC<PvRadioGroupItemProps>;
```

```ts
// packages/ui/src/components/pvResponsivePopover/PvResponsivePopover.tsx
export const PvResponsivePopover: FC<PvResponsivePopoverProps>;
```

```ts
// packages/ui/src/components/pvResponsivePopover/PvResponsivePopoverHeading.tsx
export const PvResponsivePopoverHeading: FC<PvResponsivePopoverHeadingProps>;
```

```ts
// packages/ui/src/components/pvResponsivePopover/PvResponsivePopoverPointAnchor.tsx
export const PvResponsivePopoverPointAnchor: FC<PvResponsivePopoverPointAnchorProps>;
```

```ts
// packages/ui/src/components/pvSegmentBar/PvSegmentBar.tsx
export const PvSegmentBar: FC<PvSegmentBarProps>;
```

```ts
// packages/ui/src/components/pvSegmentedControl/PvSegmentedControl.tsx
export const PvSegmentedControl: FC<PvSegmentedControlProps>;
```

```ts
// packages/ui/src/components/pvSelect/PvSelect.tsx
export const PvSelect: FC<SelectPrimitive.SelectProps>;
```

```ts
// packages/ui/src/components/pvSelect/PvSelectContent.tsx
export const PvSelectContent: FC<SelectPrimitive.SelectContentProps & RefAttributes<HTMLDivElement>>;
```

```ts
// packages/ui/src/components/pvSelect/PvSelectItem.tsx
export const PvSelectItem: FC<SelectPrimitive.SelectItemProps & RefAttributes<HTMLDivElement>>;
```

```ts
// packages/ui/src/components/pvSelect/PvSelectTrigger.tsx
export const PvSelectTrigger: FC<SelectPrimitive.SelectTriggerProps & RefAttributes<HTMLButtonElement>>;
```

```ts
// packages/ui/src/components/pvSelect/PvSelectValue.tsx
export const PvSelectValue: ForwardRefExoticComponent<SelectPrimitive.SelectValueProps & RefAttributes<HTMLSpanElement>>;
```

```ts
// packages/ui/src/components/pvSheetGrabber/PvSheetGrabber.tsx
export const PvSheetGrabber: FC;
```

```ts
// packages/ui/src/components/pvSlider/PvSlider.tsx
export const PvSlider: FC<PvSliderProps>;
```

```ts
// packages/ui/src/components/pvSlidingHighlight/PvSlidingHighlight.tsx
export const PvSlidingHighlight: FC<PvSlidingHighlightProps>;
```

```ts
// packages/ui/src/components/pvSplitBar/PvSplitBar.tsx
export const PvSplitBar: FC<PvSplitBarProps>;
```

```ts
// packages/ui/src/components/pvSplitBar/types.ts
export interface SplitBarSegment {
  key: string;
  label: string;
  value: number;
  display: string | null;
  colorClass: string;
}
```

```ts
// packages/ui/src/components/pvStatRail/PvStatRail.tsx
export const PvStatRail: FC<PvStatRailProps>;
```

```ts
// packages/ui/src/components/pvStatRail/PvStatRailContent.tsx
export const PvStatRailContent: FC<PvStatRailContentProps>;
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
}
```

```ts
// packages/ui/src/components/pvStatTile/PvStatTile.tsx
export const PvStatTile: FC<PvStatTileProps>;
```

```ts
// packages/ui/src/components/pvStatTile/PvStatTileReading.tsx
export const PvStatTileReading: FC<StatTileReading>;
```

```ts
// packages/ui/src/components/pvStatTile/types.ts
export interface StatTileReading {
  value: string;
  unit?: string;
}
```

```ts
// packages/ui/src/components/pvSwitch/PvSwitch.tsx
export const PvSwitch: FC<PvSwitchProps>;
```

```ts
// packages/ui/src/components/pvTabs/PvTabs.tsx
export const PvTabs: FC<TabsPrimitive.TabsProps & RefAttributes<HTMLDivElement>>;
```

```ts
// packages/ui/src/components/pvTabs/PvTabsContent.tsx
export const PvTabsContent: FC<TabsPrimitive.TabsContentProps & RefAttributes<HTMLDivElement>>;
```

```ts
// packages/ui/src/components/pvTabs/PvTabsList.tsx
export const PvTabsList: FC<PvTabsListProps>;
```

```ts
// packages/ui/src/components/pvTabs/PvTabsTrigger.tsx
export const PvTabsTrigger: FC<TabsPrimitive.TabsTriggerProps & RefAttributes<HTMLButtonElement>>;
```

```ts
// packages/ui/src/components/pvTextarea/PvTextarea.tsx
export const PvTextarea: FC<PvTextareaProps>;
```

```ts
// packages/ui/src/components/pvToastViewport/PvToastViewport.tsx
export const PvToastViewport: FC<PvToastViewportProps>;
```

```ts
// packages/ui/src/components/pvToastViewport/types.ts
export type ToastVariant = 'default' | 'success' | 'error' | 'warning';
export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  persistent?: boolean;
}
```

```ts
// packages/ui/src/components/pvTypography/PvTypography.tsx
export const PvTypography: FC<PvTypographyProps>;
```

```ts
// packages/ui/src/components/pvTypography/types.ts
export type TypographyVariants =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body1'
  | 'subtitle1'
  | 'subtitle2'
  | 'caption'
  | 'overline';
```

```ts
// packages/ui/src/components/pvValueSkeleton/PvValueSkeleton.tsx
export const PvValueSkeleton: FC;
```

```ts
// packages/ui/src/hooks/useDevice.ts
export const DESKTOP_MEDIA_QUERY: "(min-width: 1024px)";
export const FINE_POINTER_QUERY: "(hover: hover) and (pointer: fine)";
export const useDevice: () => Device;
```

```ts
// packages/ui/src/hooks/useGrabberDrag.ts
export const useGrabberDrag: () => GrabberDrag;
```

```ts
// packages/ui/src/hooks/useMediaQuery.ts
export const useMediaQuery: (query: string) => boolean;
```

```ts
// packages/ui/src/hooks/useScrollFadeEffect.ts
export const useScrollFadeEffect: (ref: RefObject<HTMLElement | null>) => void;
```

```ts
// packages/ui/src/hooks/useSheetAboveMotionEffect.ts
export const useSheetAboveMotionEffect: ({ registerMotion, y, height, }: {
  registerMotion: (motion: SheetAboveMotion | null) => void;
  y: MotionValue<number>;
  height: number;
}) => void;
```

```ts
// packages/ui/src/hooks/useSheetLayout.ts
export const useSheetLayout: () => SheetLayout;
```

```ts
// packages/ui/src/hooks/useSheetPeekActiveEffect.ts
export const useSheetPeekActiveEffect: (setActive: ((active: boolean) => void) | undefined) => void;
```

```ts
// packages/ui/src/hooks/useSheetPeekFade.ts
export const useSheetPeekFade: ({ y, layout, }: { y: MotionValue<number>; layout: SheetLayout; }) => SheetPeekFade;
```

```ts
// packages/ui/src/hooks/useSheetSpringEffect.ts
export const useSheetSpringEffect: ({ y, layout, position, }: {
  y: MotionValue<number>;
  layout: SheetLayout;
  position: number;
}) => void;
```

```ts
// packages/ui/src/lib/cn.ts
export const cn: (...inputs: ClassValue[]) => string;
```

```ts
// packages/ui/src/lib/dockGeometry.ts
export const DOCK_ROW_HEIGHT: 52;
export const DOCK_ROW_BOTTOM_CSS: "max(12px, calc(env(safe-area-inset-bottom) - 6px))";
export const dockFootprint: (safeBottom: number) => number;
```

```ts
// packages/ui/src/lib/sheetDrag.ts
export const SHEET_SPRING: { readonly type: "spring"; readonly stiffness: 400; readonly damping: 40; };
export const SHEET_MOMENTUM: { power: number; timeConstant: number; bounceStiffness: number; bounceDamping: number; };
export const SHEET_DRAG_ELASTIC: 0.08;
export const shouldDismiss: (metrics: DragMetrics) => boolean;
```

```ts
// packages/ui/src/lib/sheetPosition.ts
export interface SheetLayout {
  sheetHeight: number;
  bottomInset: number;
  peekOffset: number;
  handleHeight: number;
  peekContentHeight: number;
}
export const SHEET_ABOVE_GAP: 12;
export const SHEET_TOP_GAP_CSS: "max(calc(env(safe-area-inset-top) + 12px), 8dvh)";
export const computeSheetLayout: (metrics: SheetMetrics) => SheetLayout;
export const positionToOffset: (layout: SheetLayout, position: number) => number;
export const offsetToPosition: (layout: SheetLayout, offset: number) => number;
export const peekFadeOffsets: (layout: SheetLayout) => [number, number];
export const settlePosition: (position: number) => number;
export const sheetTapTarget: (position: number) => number;
export const sheetFitHeight: (layout: SheetLayout, position: number, options?: { cap?: number; }) => number;
export const readSafeAreaInset: (side: "top" | "bottom") => number;
export const readSheetLayout: () => SheetLayout;
```

```ts
// packages/ui/src/lib/surfaces.ts
export const GLASS_CLASS: "bg-surface/55 backdrop-blur-xl border border-white/10";
export const TILE_CLASS: "rounded-xl border border-white/10 bg-white/5";
export const FLOATING_CLASS: "bg-surface/85 backdrop-blur-xl border border-white/10 shadow-floating";
export const FLOATING_LG_CLASS: "bg-surface/85 backdrop-blur-xl border border-white/10 lg:shadow-floating";
export const SCRIM_CLASS: "bg-black/40 backdrop-blur-sm";
export const OVERLAY_CLASS: "bg-surface-base/85 backdrop-blur-sm";
export const FLOATING_PILL_CLASS: "bg-surface/85 backdrop-blur-xl border border-white/10 shadow-floating pointer-events-auto inline-flex shrink-0 items-center rounded-full text-sm whitespace-nowrap text-text-primary";
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
// packages/ui/tests/components/pvBottomSheet/PvBottomSheetProvider.spec.ts
// no exports
```

```ts
// packages/ui/tests/components/pvBottomSheet/PvSheetAbove.spec.ts
// no exports
```

```ts
// packages/ui/tests/components/pvBottomSheet/PvSheetPeek.spec.ts
// no exports
```

```ts
// packages/ui/tests/hooks/useMediaQuery.spec.ts
// no exports
```

```ts
// packages/ui/tests/lib/scrollFade.spec.ts
// no exports
```

```ts
// packages/ui/tests/lib/sheetDrag.spec.ts
// no exports
```

```ts
// packages/ui/tests/lib/sheetPosition.spec.ts
// no exports
```

```ts
// packages/ui/tests/lib/slidingHighlight.spec.ts
// no exports
```

```ts
// packages/ui/tests/lib/tokens.spec.ts
// no exports
```

```ts
// packages/ui/vitest.config.ts
export default UserConfig;
```

```ts
// tools/docs/banner/appPage.ts
export const UI_READY_TIMEOUT_MS: 15000;
export const prepareContext: (page: Page) => Promise<void>;
export const loadDemoData: (page: Page) => Promise<void>;
export const hideOverlays: (page: Page) => Promise<void>;
export const parkMouse: (page: Page) => Promise<void>;
export const openSession: (name: string, page: Page) => Promise<void>;
export const isOverTrack: (point: { x: number; y: number; }, page: Page) => Promise<boolean>;
export const nextTrackPoint: ({ points, from }: {
  points: { x: number; y: number; }[];
  from: number;
}, page: Page) => Promise<number>;
export const popover: (page: Page) => Locator;
export const locate: (page: Page) => Promise<{ x: number; y: number; }>;
export const sheet: (page: Page) => Locator;
export const sheetHandle: (page: Page) => Locator;
export const sheetScroller: (page: Page) => Locator;
export const pinSheetPosition: (position: number, page: Page) => Promise<void>;
```

```ts
// tools/docs/banner/bannerContent.ts
export const FLOW_KEYS: readonly ["heatmap", "laps"];
export type FlowKey = (typeof FLOW_KEYS)[number];
export const TILE_KEYS: readonly ["summary", "weatherDetails", "studio", "splits", "filter"];
export type TileKey = (typeof TILE_KEYS)[number];
export const FILTER_READING_COUNT: 4;
export const BANNER_TEXT_BY_LOCALE: Record<"de" | "en", BannerText>;
export interface BannerFrame {
  file: string;
  below?: string;
}
export const BACKDROP_FILE: "1b-heatmap-pick.png";
export const FRAMES_BY_FLOW: Record<"heatmap" | "laps", BannerFrame[]>;
export const SHOT_FILE_BY_TILE: Record<"summary" | "weatherDetails" | "studio" | "splits" | "filter", string>;
```

```ts
// tools/docs/banner/capture.ts
// no exports
```

```ts
// tools/docs/banner/clip.ts
export type Clip = { x: number; y: number; width: number; height: number };
export const boxOf: (locator: Locator) => Promise<{ x: number; y: number; width: number; height: number; }>;
export const padded: (box: Clip, padding: number) => Clip;
export const clamp: (value: number, min: number, max: number) => number;
export const isWithin: (outer: Clip, inner: Clip) => boolean;
export const spiral: ({ centre, step, maxRadius, }: {
  centre: { x: number; y: number; };
  step: number;
  maxRadius: number;
}) => {
  x: number;
  y: number;
}[];
```

```ts
// tools/docs/banner/env.ts
export const BANNER_LOCALE_ENV: "BANNER_LOCALE";
export const bannerLocale: () => BannerLocale;
export const WEB_APP_PORT: 5175;
export const WEB_APP_ORIGIN: "http://localhost:5175";
export const BANNER_PORT: 5177;
export const BANNER_ORIGIN: "http://localhost:5177";
export const REPO_ROOT: string;
```

```ts
// tools/docs/banner/locales.ts
export const BANNER_LOCALES: readonly ["de", "en"];
export type BannerLocale = (typeof BANNER_LOCALES)[number];
export const DEFAULT_BANNER_LOCALE: "de" | "en";
export const isBannerLocale: (value: string | undefined | null) => value is BannerLocale;
```

```ts
// tools/docs/banner/messages.ts
export const messageText: (key: string) => string;
export const escapeRegExp: (text: string) => string;
```

```ts
// tools/docs/banner/page/Banner.tsx
export const Banner: FC;
```

```ts
// tools/docs/banner/page/FitText.tsx
export const FitText: FC<FitTextProps>;
```

```ts
// tools/docs/banner/page/FlowCard.tsx
export const FlowCard: FC<FlowCardProps>;
```

```ts
// tools/docs/banner/page/FrameShots.tsx
export const FrameShots: FC<FrameShotsProps>;
```

```ts
// tools/docs/banner/page/Shot.tsx
export const Shot: FC<ShotProps>;
```

```ts
// tools/docs/banner/page/StepCaption.tsx
export const StepCaption: FC<StepCaptionProps>;
```

```ts
// tools/docs/banner/page/TileCard.tsx
export const TileCard: FC<TileCardProps>;
```

```ts
// tools/docs/banner/page/bannerLocale.ts
export const BANNER_LOCALE: "de" | "en";
export const BANNER_COPY: BannerText;
export const shotUrl: (file: string) => string;
```

```ts
// tools/docs/banner/page/frameSize.ts
export const FRAME_HEIGHT_CLASS: "h-556px";
```

```ts
// tools/docs/banner/page/main.tsx
// no exports
```

```ts
// tools/docs/banner/png.ts
export const cropPng: ({ png, cssClip }: { png: Buffer; cssClip: Clip; }, page: Page) => Promise<Buffer<ArrayBuffer>>;
export const findPositionDot: (page: Page) => Promise<{ x: number; y: number; }>;
```

```ts
// tools/docs/banner/run.ts
// no exports
```

```ts
// tools/docs/banner/shots.ts
export const BANNER_PATH: string;
export const shoot: ({ file, clip }: { file: string; clip?: Clip; }, page: Page) => Promise<void>;
```

```ts
// tools/docs/banner/stillness.ts
export const waitForStill: (page: Page) => Promise<void>;
```

```ts
// tools/docs/playwright.config.ts
export default PlaywrightTestConfig<{}, {}>;
```

```ts
// tools/docs/vite.config.ts
export default UserConfig;
```

```ts
// tools/workbench/scripts/boundaries.ts
// no exports
```

```ts
// tools/workbench/scripts/changedFiles.ts
export const compareFiles: ({ changes, plannedPaths, }: { changes: FileChange[]; plannedPaths: string[]; }) => FilesComparison;
export const parseChanges: ({ diff, untracked, }: { diff: string; untracked: string; }) => FileChange[];
export const gitChanges: ({ root, override, }: { root: string; override: string | undefined; }) => GitChanges | undefined;
```

```ts
// tools/workbench/scripts/check.ts
export const itemFolders: (root: string) => string[];
export const checkWorkbench: (root: string) => string[];
```

```ts
// tools/workbench/scripts/checkRules.ts
export const parsedFrontmatter: ({ path, plan, }: {
  path: string;
  plan: string;
}) => {
  errors: string[];
  frontmatter: PlanFrontmatter | undefined;
};
export const checkPlan: ({ folder, plan, techPresent, }: {
  folder: string;
  plan: string;
  techPresent: boolean;
}) => string[];
export const checkMockupDecisions: ({ folder, plan, mockupHtml, }: { folder: string; plan: string; mockupHtml: string; }) => string[];
export const addedCheckErrors: ({ folder, before, after, techPresent, }: {
  folder: string;
  before: string;
  after: string;
  techPresent: boolean;
}) => string[];
export const checkDecisions: ({ folder, text }: { folder: string; text: string; }) => string[];
```

```ts
// tools/workbench/scripts/cleanup.ts
export const selectDeletions: ({ items, changes, }: {
  items: CleanupItem[];
  changes: ReadonlyMap<string, FolderChanges>;
}) => Deletions;
```

```ts
// tools/workbench/scripts/componentGraph.ts
export type ComponentGraph = {
  mermaid: string;
  nodes: number;
  edges: number;
};
export const toComponentGraph: ({ cruise, added, changed, }: {
  cruise: DepsInput;
  added: string[];
  changed: string[];
}) => ComponentGraph;
```

```ts
// tools/workbench/scripts/deps.ts
export type DepsInput = { modules: z.infer<typeof moduleSchema>[] };
export const layerOf: (path: string) => Layer;
export const toDepsGraph: ({ cruise, planned, }: { cruise: DepsInput; planned: string[]; }) => DepsGraph;
export const cruiseRoots: ({ areas, planned }: { areas: Area[]; planned: string[]; }) => string[];
export const boundaryOf: (cruise: Cruise) => Boundary;
export const boundaryLine: (boundary: Boundary) => string;
export const cruiseRepo: (args?: string[]) => Cruise | undefined;
```

```ts
// tools/workbench/scripts/frontmatter.ts
export const STATUSES: readonly ["idea", "exploring", "planned", "ready", "in-dev", "in-review", "done"];
export type Status = (typeof STATUSES)[number];
export const PLAN_CHECKS: "Real-data checks";
export const DECISIONS: "Agent decisions";
export type CheckHeading = typeof PLAN_CHECKS | typeof DECISIONS;
export type ItemType = (typeof ITEM_TYPES)[number];
export const AREAS: readonly ["app", "engine", "gpx", "ui", "i18n", "testing", "workbench", "docs", "repo", "skills"];
export type Area = (typeof AREAS)[number];
export const planFrontmatterSchema: z.ZodObject<{
  title: z.ZodString;
  status: z.ZodEnum<{ planned: "planned"; idea: "idea"; exploring: "exploring"; ready: "ready"; "in-dev": "in-dev"; "in-review": "in-review"; done: "done"; }>;
  created: z.ZodUnion<readonly [z.ZodString, z.ZodPipe<z.ZodDate, z.ZodTransform<string, Date>>]>;
  'depends-on': z.ZodOptional<z.ZodArray<z.ZodString>>;
  type: z.ZodOptional<z.ZodEnum<{ feature: "feature"; bug: "bug"; chore: "chore"; }>>;
  areas: z.ZodOptional<z.ZodArray<z.ZodEnum<{ app: "app"; engine: "engine"; gpx: "gpx"; ui: "ui"; i18n: "i18n"; testing: "testing"; workbench: "workbench"; docs: "docs"; repo: "repo"; skills: "skills"; }>>>;
  next: z.ZodString;
  size: z.ZodOptional<z.ZodEnum<{ small: "small"; }>>;
}, z.core.$strip>;
export type PlanFrontmatter = z.infer<typeof planFrontmatterSchema>;
export const planBody: (text: string) => string;
export const parseFrontmatter: (text: string) => unknown;
export const readStatus: (text: string) => string | undefined;
export const readSize: (text: string) => string | undefined;
export const sectionTokens: ({ text, heading }: { text: string; heading: string; }) => Token[];
export const listItems: (tokens: Token[]) => Tokens.ListItem[];
export type CheckItem = { text: string; checked: boolean; superseded: boolean; raw: string };
export const SUPERSEDED_BY: RegExp;
export const readChecks: ({ text, heading, }: { text: string; heading: CheckHeading; }) => CheckItem[];
export const isOpenCheck: (item: CheckItem) => boolean;
export const decisionsWithoutKind: ({ before, after, }: { before: string | undefined; after: string; }) => string[];
export const readQuestions: (text: string) => Question[];
```

```ts
// tools/workbench/scripts/indexHook.ts
// no exports
```

```ts
// tools/workbench/scripts/interfaces.ts
export const changedInterfaceFiles: (comparison: FilesComparison) => ChangedInterfaceFiles;
export const interfaceFiles: ({ root, paths, }: { root: string; paths: string[]; }) => InterfaceFiles;
export const extractInterfaces: ({ root, files, }: { root: string; files: string[]; }) => Map<string, string[]>;
export const renderInterfaces: ({ item, generated, found, exports, }: {
  item: string;
  generated: string;
  found: ChangedInterfaceFiles;
  exports: Map<string, string[]>;
}) => string;
export const writeInterfaces: ({ item, comparison, }: { item: string; comparison: FilesComparison; }) => string;
```

```ts
// tools/workbench/scripts/itemCli.ts
export const itemTechPaths: (command: "deps" | "interfaces") => { item: string; paths: TechPaths; };
```

```ts
// tools/workbench/scripts/paths.ts
export const REPO_ROOT: string;
export const BACKLOG_DIR: "tools/workbench/backlog";
export const BACKLOG_PATH: string;
export const WORKBENCH_DIR: string;
export const GUIDE_FILE: string;
export const backlogRoot: () => string;
export const baseRevisionOverride: () => string | undefined;
export const dirOf: (path: string) => string;
export const baseName: (path: string) => string;
export const repoPath: (path: string) => string;
export const comparePaths: (a: string, b: string) => 1 | 0 | -1;
```

```ts
// tools/workbench/scripts/reviewArtifactsContract.ts
export type FileChange = z.infer<typeof fileChangeSchema>;
export type FilesComparison = z.infer<typeof filesComparisonSchema>;
export const filesJsonSchema: z.ZodObject<{
  planned: z.ZodArray<z.ZodObject<{ path: z.ZodString; status: z.ZodEnum<{ added: "added"; modified: "modified"; deleted: "deleted"; }>; }, z.core.$strip>>;
  notPlanned: z.ZodArray<z.ZodObject<{ path: z.ZodString; status: z.ZodEnum<{ added: "added"; modified: "modified"; deleted: "deleted"; }>; }, z.core.$strip>>;
  untouched: z.ZodArray<z.ZodString>;
  item: z.ZodOptional<z.ZodString>;
  generated: z.ZodString;
  base: z.ZodString;
  ref: z.ZodString;
}, z.core.$strip>;
export type FilesJson = z.infer<typeof filesJsonSchema>;
export type Boundary = z.infer<typeof boundarySchema>;
export const depsJsonSchema: z.ZodObject<{
  item: z.ZodOptional<z.ZodString>;
  generated: z.ZodString;
  command: z.ZodOptional<z.ZodString>;
  roots: z.ZodOptional<z.ZodArray<z.ZodString>>;
  focus: z.ZodOptional<z.ZodArray<z.ZodString>>;
  astro: z.ZodOptional<z.ZodArray<z.ZodString>>;
  nodes: z.ZodNumber;
  edges: z.ZodNumber;
  added: z.ZodArray<z.ZodString>;
  missing: z.ZodArray<z.ZodString>;
  boundary: z.ZodObject<{ rules: z.ZodArray<z.ZodString>; violations: z.ZodArray<z.ZodObject<{ rule: z.ZodString; from: z.ZodString; to: z.ZodString; }, z.core.$strip>>; modules: z.ZodNumber; dependencies: z.ZodNumber; }, z.core.$strip>;
  components: z.ZodOptional<z.ZodObject<{ nodes: z.ZodNumber; edges: z.ZodNumber; }, z.core.$strip>>;
}, z.core.$strip>;
export type DepsJson = z.infer<typeof depsJsonSchema>;
```

```ts
// tools/workbench/scripts/statusGuard.ts
export const decide: ({ input, currentText, }: {
  input: HookInput;
  currentText: string | undefined;
}) => string | undefined;
```

```ts
// tools/workbench/scripts/techFile.ts
export type TechPaths = { added: string[]; changed: string[] };
export const readTechEntries: (tech: string) => { added: TechEntry[]; changed: TechEntry[]; };
export const readTechPaths: (tech: string) => TechPaths;
```

```ts
// tools/workbench/scripts/themeTokens.ts
export interface ThemeLiteral {
  line: number;
  match: string;
  check: 'hex' | 'rgb' | 'px';
}
export const findThemeLiterals: (source: string) => ThemeLiteral[];
```

```ts
// tools/workbench/scripts/workerGitGuard.ts
export const MESSAGE: "item-worker: git commit, reset, checkout, restore, stash, worktree, clean, switch and branch -f/-d/-D are owner-only. Leave all changes in the working tree.";
export const decideWorker: (input: unknown) => string | undefined;
```

```ts
// tools/workbench/site/src/actions/index.ts
export type WriteResult = {
  name: string;
  changes: Change[];
  folder?: FolderChange;
  notes: string[];
};
export const server: {
  board: { read: ((input?: any) => Promise<SafeResult<never, BoardView>>) & { orThrow: (input?: any) => Promise<BoardView>; } & string; };
  plan: { setStatus: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; to: "idea" | "exploring" | "planned" | "ready" | "in-dev" | "in-review" | "done"; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; to: z.ZodEnum<{ idea: "idea"; exploring: "exploring"; planned: "planned"; ready: "ready"; "in-dev": "in-dev"; "in-review": "in-review"; done: "done"; }>; }, z.core.$strip>; } & string; toggleCheck: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; checked: "true" | "false"; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; checked: z.ZodEnum<{ true: "true"; false: "false"; }>; }, z.core.$strip>; } & string; deleteCheck: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; }, z.core.$strip>; } & string; answerQuestion: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; option?: string | null | undefined; words?: string | null | undefined; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; option: z.ZodPipe<z.ZodOptional<z.ZodNullable<z.ZodString>>, z.ZodTransform<string, string | null | undefined>>; words: z.ZodPipe<z.ZodOptional<z.ZodNullable<z.ZodString>>, z.ZodTransform<string, string | null | undefined>>; }, z.core.$strip>; } & string; commentQuestion: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; words: string; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; words: z.ZodString; }, z.core.$strip>; } & string; deleteQuestion: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; }, z.core.$strip>; } & string; };
  review: { deleteFinding: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; heading: string; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; heading: z.ZodString; }, z.core.$strip>; } & string; toggleDecision: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; checked: "true" | "false"; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; checked: z.ZodEnum<{ true: "true"; false: "false"; }>; }, z.core.$strip>; } & string; deleteDecision: ((input: FormData) => Promise<SafeResult<{ item: string; expected: string; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; }, z.core.$strip>; } & string; };
  flaky: { remove: ((input: FormData) => Promise<SafeResult<{ expected: string; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ expected: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>; }, z.core.$strip>; } & string; };
  item: { delete: ((input: FormData) => Promise<SafeResult<{ item: string; }, WriteResult>>) & { queryString: string; orThrow: (input: FormData) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ item: z.ZodString; }, z.core.$strip>; } & string; };
  undo: ((input: { name: string; changes: { path: string; before: string; after: string; }[]; folder?: string | undefined; }) => Promise<SafeResult<{ name: string; changes: { path: string; before: string; after: string; }[]; folder?: string | undefined; }, WriteResult>>) & { queryString: string; orThrow: (input: { name: string; changes: { path: string; before: string; after: string; }[]; folder?: string | undefined; }) => Promise<WriteResult>; } & { __internalInfer: z.ZodObject<{ name: z.ZodString; changes: z.ZodArray<z.ZodObject<{ path: z.ZodString; before: z.ZodString; after: z.ZodString; }, z.core.$strip>>; folder: z.ZodOptional<z.ZodString>; }, z.core.$strip>; } & string;
};
```

```ts
// tools/workbench/site/src/app/AnswerDialog.tsx
export const AnswerDialog: FC<AnswerDialogProps>;
```

```ts
// tools/workbench/site/src/app/AnswerForm.tsx
export const AnswerForm: FC<AnswerFormProps>;
```

```ts
// tools/workbench/site/src/app/Board.tsx
export const Board: FC;
```

```ts
// tools/workbench/site/src/app/BoardPage.tsx
export const BoardPage: FC;
```

```ts
// tools/workbench/site/src/app/CheckRow.tsx
export const CheckRow: FC<CheckRowProps>;
```

```ts
// tools/workbench/site/src/app/Column.tsx
export const Column: FC<ColumnProps>;
```

```ts
// tools/workbench/site/src/app/Columns.tsx
export const Columns: FC<ColumnsProps>;
```

```ts
// tools/workbench/site/src/app/EmptyNote.tsx
export const EmptyNote: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// tools/workbench/site/src/app/FindingRow.tsx
export const FindingRow: FC<FindingRowProps>;
```

```ts
// tools/workbench/site/src/app/FlakyRow.tsx
export const FlakyRow: FC<FlakyRowProps>;
```

```ts
// tools/workbench/site/src/app/Inline.tsx
export const Inline: FC<InlineProps>;
```

```ts
// tools/workbench/site/src/app/ItemCard.tsx
export const ItemCard: FC<ItemCardProps>;
```

```ts
// tools/workbench/site/src/app/ItemPanel.tsx
export const ItemPanel: FC<ItemPanelProps>;
```

```ts
// tools/workbench/site/src/app/MockupPane.tsx
export const MockupPane: FC<MockupPaneProps>;
```

```ts
// tools/workbench/site/src/app/NeedsYou.tsx
export const NeedsYou: FC<NeedsYouProps>;
```

```ts
// tools/workbench/site/src/app/Panel.tsx
export const Panel: FC<PanelProps>;
```

```ts
// tools/workbench/site/src/app/PlanPane.tsx
export const PlanPane: FC<PlanPaneProps>;
```

```ts
// tools/workbench/site/src/app/PlanSection.tsx
export const PlanSection: FC<PlanSectionProps>;
```

```ts
// tools/workbench/site/src/app/Prose.tsx
export const Prose: FC<ProseProps>;
```

```ts
// tools/workbench/site/src/app/QuestionRow.tsx
export const QuestionRow: FC<QuestionRowProps>;
```

```ts
// tools/workbench/site/src/app/ReviewPane.tsx
export const ReviewPane: FC<ReviewPaneProps>;
```

```ts
// tools/workbench/site/src/app/ReviewSection.tsx
export const ReviewSection: FC<ReviewSectionProps>;
```

```ts
// tools/workbench/site/src/app/ReviewSections.tsx
export const ReviewSections: FC<ReviewSectionsProps>;
```

```ts
// tools/workbench/site/src/app/Stage.tsx
export const Stage: FC<StageProps>;
```

```ts
// tools/workbench/site/src/app/StatusFill.tsx
export const StatusFill: FC<StatusFillProps>;
```

```ts
// tools/workbench/site/src/app/StatusIcon.tsx
export const StatusIcon: FC<StatusIconProps>;
```

```ts
// tools/workbench/site/src/app/StatusRing.tsx
export const StatusRing: FC;
```

```ts
// tools/workbench/site/src/app/TechPane.tsx
export const TechPane: FC<TechPaneProps>;
```

```ts
// tools/workbench/site/src/app/TypeIcon.tsx
export const TypeIcon: FC<TypeIconProps>;
```

```ts
// tools/workbench/site/src/app/WriteCard.tsx
export const WriteCard: FC;
```

```ts
// tools/workbench/site/src/app/WrittenChanges.tsx
export const WrittenChanges: FC<WrittenChangesProps>;
```

```ts
// tools/workbench/site/src/app/hooks/boardRefetch.ts
export const refetchBoard: (queryClient: QueryClient) => Promise<void>;
export const refetchBoardOnConflict: (queryClient: QueryClient) => (error: unknown) => void;
```

```ts
// tools/workbench/site/src/app/hooks/useBoard.ts
export const boardQueryKey: () => readonly ["board"];
export const useBoard: () => UseQueryResult<BoardView>;
```

```ts
// tools/workbench/site/src/app/hooks/useBoardChangedEffect.ts
export const useBoardChangedEffect: () => void;
```

```ts
// tools/workbench/site/src/app/hooks/useMockupQuestionsMessageEffect.ts
export const useMockupQuestionsMessageEffect: (options: { frame: RefObject<HTMLIFrameElement | null>; questionStates: string; }) => void;
```

```ts
// tools/workbench/site/src/app/hooks/usePanelState.ts
export type PanelContent =
  | { kind: 'item'; folder: string; tab: Slot }
  | { kind: 'guide' }
  | undefined;
export const tabFor: ({ item, asked }: { item: BoardItem; asked: Slot | undefined; }) => Slot;
export const usePanelState: ({ items }: { items: BoardItem[] | undefined; }) => PanelState;
```

```ts
// tools/workbench/site/src/app/hooks/useTechDiagramsEffect.ts
export const useTechDiagramsEffect: (options: {
  pane: RefObject<HTMLDivElement | null>;
  techHtml: string | undefined;
  actualHtml: string;
  folder: string;
  expand: (frame: HTMLElement) => void;
}) => void;
```

```ts
// tools/workbench/site/src/app/hooks/useTechFullScreen.ts
export const useTechFullScreen: () => TechFullScreen;
```

```ts
// tools/workbench/site/src/app/hooks/useTechRefitEffect.ts
export const useTechRefitEffect: (options: { pane: RefObject<HTMLDivElement | null>; expanded: boolean; active: boolean; }) => void;
```

```ts
// tools/workbench/site/src/app/hooks/useUndoMutation.ts
export const useUndoMutation: () => UseMutationResult<WriteResult, unknown, WriteResult>;
```

```ts
// tools/workbench/site/src/app/hooks/useWriteCardCloseTimer.ts
export const useWriteCardCloseTimer: (options: { latestId: number | undefined; hide: (id: number) => void; }) => WriteCardHoverHandlers;
```

```ts
// tools/workbench/site/src/app/hooks/useWriteMutation.ts
export const useWriteMutation: (options?: { inline?: boolean; }) => UseMutationResult<WriteResult, unknown, WriteInput>;
```

```ts
// tools/workbench/site/src/app/types.ts
export type WriteMeta = { inline: boolean };
```

```ts
// tools/workbench/site/src/app/writeErrors.ts
export const messageOf: (error: unknown) => string;
```

```ts
// tools/workbench/site/src/lib/board.ts
export type QuestionView = {
  id: string;
  open: boolean;
  date: string | undefined;
  body: string;
  question: string;
  options: Option[];
  comments: string[];
  first: string;
  raw: string;
};
export type FindingView = Finding & { raw: string; heading: string };
export const readItem: ({ root, folder, }: { root: string; folder: string; }) => ItemView | undefined;
export type NeedsYouEntry = { folder: string; title: string; reason: Reason; count: number };
export const needsYou: (items: NeedsYouInput[]) => NeedsYouEntry[];
export type BoardItem = ItemView & {
  techHtml: string | undefined;
  actualHtml: string | undefined;
};
export type BoardView = {
  items: BoardItem[];
  needs: NeedsYouEntry[];
  flaky: Item[];
  errors: string[];
  guideHtml: string;
};
export const readBoard: ({ root, guideFile, }: { root: string; guideFile: string; }) => Promise<BoardView>;
```

```ts
// tools/workbench/site/src/lib/checkText.ts
export const checkRowText: ({ text, superseded, agent, }: {
  text: string;
  superseded: boolean;
  agent: boolean;
}) => {
  what: string;
  why: string | undefined;
  pointer: string | undefined;
};
```

```ts
// tools/workbench/site/src/lib/devPlugin.ts
export type ChangedPayload = { path: string };
export const serverModulePath: ({ workbench, path, }: { workbench: string; path: string; }) => string | undefined;
export const workbenchFiles: (options: { root: string; guideFile: string; }) => Plugin;
```

```ts
// tools/workbench/site/src/lib/html.ts
export const escapeHtml: (text: string) => string;
```

```ts
// tools/workbench/site/src/lib/markdown.ts
export const syncHtml: (html: string | Promise<string>) => string;
export const renderMarkdown: (markdown: string) => string;
export const renderTech: (markdown: string) => Promise<string>;
```

```ts
// tools/workbench/site/src/lib/techActual.ts
export type Deps = { mmd: string; json: DepsJson | undefined };
export const readDeps: (folder: string) => Deps | undefined;
export const modulesActualHtml: ({ folder, graph, }: { folder: string; graph: Deps | undefined; }) => string;
export const componentsActualHtml: ({ folder, mmd, graph, }: {
  folder: string;
  mmd: string | undefined;
  graph: Deps | undefined;
}) => string;
export const filesPlannedHtml: (tech: string) => string | undefined;
export const filesActualHtml: ({ folder, text, }: { folder: string; text: string | undefined; }) => string;
export const interfacesActualHtml: ({ folder, text, }: { folder: string; text: string | undefined; }) => Promise<string>;
```

```ts
// tools/workbench/site/src/lib/vocabulary.ts
export type Bucket = Status | 'needs-you';
export const LABEL_BY_BUCKET: Record<Bucket, string>;
export const COLOR_BY_ITEM_TYPE: Record<"feature" | "bug" | "chore", string>;
export const SLOTS: readonly ["mockup", "plan", "tech", "review"];
export type Slot = (typeof SLOTS)[number];
export const LABEL_BY_SLOT: Record<"mockup" | "plan" | "tech" | "review", string>;
export const REASONS: readonly ["questions", "decisions", "findings"];
export type Reason = (typeof REASONS)[number];
export const LABEL_BY_REASON: Record<"questions" | "decisions" | "findings", string>;
export const SLOT_BY_REASON: Record<"questions" | "decisions" | "findings", "mockup" | "plan" | "tech" | "review">;
```

```ts
// tools/workbench/site/src/lib/writeBack.ts
export type Place =
  | { kind: 'file' }
  | { kind: 'frontmatter'; key: string }
  | { kind: 'section'; heading: string };
export type EditResult =
  | { ok: true; text: string; diff: string }
  | { ok: false; reason: 'missing' | 'duplicate' | 'unchanged' };
export type Item = { raw: string; first: string; heading: string | undefined };
export const fileItems: (text: string) => Item[];
export const editLine: ({ text, place, expected, next, }: {
  text: string;
  place: Place;
  expected: string;
  next: string;
}) => EditResult;
export const deleteLine: ({ text, place, expected, }: { text: string; place: Place; expected: string; }) => EditResult;
export const insertLine: ({ text, place, after, line, }: {
  text: string;
  place: Place;
  after: string;
  line: string;
}) => EditResult;
export const unifiedDiff: ({ before, after, }: { before: string | null; after: string | null; }) => string;
export const tickLine: ({ first, checked }: { first: string; checked: boolean; }) => string;
export type Option = { id: string; text: string };
export const parseOptions: (body: string) => { question: string; options: Option[]; };
export const questionParts: (first: string) => {
  id: string;
  state: string;
  date: string | undefined;
  body: string;
} | undefined;
export const answerLine: ({ first, date, option, words, }: {
  first: string;
  date: string;
  option: string;
  words: string;
}) => string | undefined;
export const commentLine: ({ date, words }: { date: string; words: string; }) => string;
export type Finding = { id: string; state: string; on: string | undefined; text: string };
export const findingParts: (first: string) => Finding | undefined;
```

```ts
// tools/workbench/site/src/scripts/tech.ts
export const refitTech: (root: Element, options?: { force?: boolean; }) => void;
export const graphIn: (frame: HTMLElement) => HTMLElement | undefined;
export const showFull: ({ body, frame }: { body: HTMLElement; frame: HTMLElement; }) => void;
export const hideFull: ({ body, frame }: { body: HTMLElement; frame: HTMLElement; }) => void;
export const resetFull: (body: HTMLElement) => void;
export const controlOf: (frame: HTMLElement) => SectionControl | undefined;
export const initTech: ({ pane, expand }: { pane: Element; expand: Expand; }) => void;
```

```ts
// tools/workbench/tests/scripts/themeTokens.spec.ts
// no exports
```

```ts
// vite.config.ts
export default UserConfig;
```

```ts
// apps/web/pwa-assets.config.ts · not planned
export default UserConfig;
```

```ts
// apps/web/vite.config.ts · not planned
export default UserConfig;
```

```ts
// apps/web/vitest.config.ts · not planned
export default UserConfig;
```

```ts
// tools/workbench/playwright.review.config.ts · not planned
export default PlaywrightTestConfig<{}, {}>;
```

```ts
// tools/workbench/shared/capture.ts · not planned
export { expect, test, type Locator, type Page } from '../../../apps/web/e2e/helpers/test.ts';
export type Locale = 'en' | 'de';
export type Device = 'd' | 'p';
export type Shot = { device: Device; locale: Locale };
export const prepare: (page: Page, locale: Locale) => Promise<void>;
export const seedSessions: (page: Page, sessions: SeedSession[]) => Promise<string[]>;
export const loadDemoData: (page: Page) => Promise<void>;
export const shootAll: (page: Page, name: string, scene: (page: Page, shot: Shot) => Promise<void>) => Promise<void>;
```

```ts
// tools/workbench/tests/scripts/changedFiles.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/check.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/checkRules.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/cleanup.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/componentGraph.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/deps.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/frontmatter.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/interfaces.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/statusGuard.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/techFile.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/workerGitGuard.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/site/src/actions/index.done.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/site/src/actions/index.read.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/site/src/actions/index.writes.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/site/src/lib/devPlugin.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/site/src/lib/writeBack.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/vitest.config.ts · not planned
export default UserConfig;
```

## Missing

- `packages/ui/src/components/ResponsivePopoverHeading.tsx`: planned, not changed
