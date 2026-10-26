# Interfaces · conventions-migration

Generated 2026-10-26 by `vp run workbench:deps -- conventions-migration` from the TypeScript files changed since the base (as `files.json`): 609 planned, 2 not planned. The checker's types; compare with tech.md `## Interfaces`, the planned record.

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
// apps/web/e2e/helpers/upload.ts
export const closeImportSummary: (page: Page) => Promise<string>;
export const uploadFiles: (page: Page, filePaths: string[]) => Promise<string>;
export const uploadFilesWithButton: (page: Page, button: Locator, filePaths: string[]) => Promise<string>;
export const uploadFitFiles: (page: Page, filePaths: string[]) => Promise<string>;
export const dropFiles: (page: Page, filePaths: string[]) => Promise<string>;
```

```ts
// apps/web/e2e/mobile/map.spec.ts
// no exports
```

```ts
// apps/web/e2e/studio.spec.ts
// no exports
```

```ts
// apps/web/scripts/generateDemoRoutes.ts
// no exports
```

```ts
// apps/web/src/commonSnackbars.ts
export const COMMON_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/components/PaceRange.tsx
export const PaceRange: FC<PaceRangeProps>;
```

```ts
// apps/web/src/components/charts/ElevationChart.tsx
export const ElevationChart: <K extends string, T extends {
  elevation: number | null;
  climbElevation?: number | null;
} & Record<K, number>>(props: ElevationChartProps<K, T>) => JSX.Element;
```

```ts
// apps/web/src/components/charts/GradeChart.tsx
export const GradeChart: <K extends string, T extends {
  grade: number | null;
} & Record<K, number>>(props: GradeChartProps<K, T>) => JSX.Element;
```

```ts
// apps/web/src/components/charts/LapBands.tsx
export const LapBands: <K extends string, T extends Record<K, number>>(props: LapBandsProps<K, T>) => any;
```

```ts
// apps/web/src/components/charts/MultiSeriesRail.tsx
export const MultiSeriesRail: FC<MultiSeriesRailProps>;
```

```ts
// apps/web/src/components/charts/chartData.ts
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
export const buildSessionChartRows: (records: SessionRecord[], options: SessionChartRowOptions) => BucketRow<SessionRecord, "time", "hr" | "power" | "speed" | "cadence" | "elevation" | "climbElevation" | "grade" | "pace" | "gap">[];
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
// apps/web/src/components/charts/chartHover.ts
export const hoverOnlyTooltip: { readonly content: () => any; readonly isAnimationActive: false; };
export const chartHoverHandlers: (onChange: ((x: number | null) => void) | undefined) => {};
export const categoryHoverHandlers: (onChange: (x: string | null) => void) => {
  onMouseLeave: () => void;
  onTouchMove: (e: MouseHandlerDataParam) => void;
  onTouchEnd: () => void;
};
export const indexByX: <K extends string, T extends Record<K, number | string>>(data: T[], key: K) => Map<number | string, T>;
```

```ts
// apps/web/src/components/charts/chartZoom.ts
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
// apps/web/src/components/charts/hooks/useChartZoom.ts
export const useChartZoom: <T>({ data, xKey, onZoomComplete, onClick, }: UseChartZoomOptions<T>) => UseChartZoomReturn<T>;
```

```ts
// apps/web/src/components/charts/hooks/useSyncedChartZoom.ts
export const useSyncedChartZoom: () => SyncedChartZoom;
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
// apps/web/src/components/charts/hooks/useZoomSelectionState.ts
export const useZoomSelectionState: <T>(data: T[]) => ZoomSelectionState;
```

```ts
// apps/web/src/components/charts/railFormat.ts
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
// apps/web/src/components/charts/seriesSummary.ts
export const summarizeValues: (values: ReadonlyArray<number | null | undefined>) => SeriesSummary;
```

```ts
// apps/web/src/components/charts/sessionTerrain.ts
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
// apps/web/src/components/charts/types.ts
export const LAP_STRIP_TICK_MARGIN: 12;
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
// apps/web/src/components/dashboard/ACWRGauge.tsx
export const ACWRGauge: FC;
```

```ts
// apps/web/src/components/dashboard/DashboardPeek.tsx
export const DashboardPeek: FC;
```

```ts
// apps/web/src/components/dashboard/DashboardZoomReset.tsx
export const DashboardZoomReset: FC;
```

```ts
// apps/web/src/components/dashboard/FormStatusCard.tsx
export const FormStatusCard: FC;
```

```ts
// apps/web/src/components/dashboard/LegendLine.tsx
export const LegendLine: FC<LegendLineProps>;
```

```ts
// apps/web/src/components/dashboard/LoadBucketBand.tsx
export const LoadBucketBand: FC<LoadBucketBandProps>;
```

```ts
// apps/web/src/components/dashboard/LoadChart.tsx
export const LoadChart: FC;
```

```ts
// apps/web/src/components/dashboard/PerformanceChart.tsx
export const PerformanceChart: FC;
```

```ts
// apps/web/src/components/dashboard/ReadinessGauge.tsx
export const ReadinessGauge: FC;
```

```ts
// apps/web/src/components/dashboard/VolumeChart.tsx
export const VolumeChart: FC;
```

```ts
// apps/web/src/components/dashboard/coachingMessages.ts
export const getFormMessage: (status: FormStatus) => string;
export const getFormMessageDetailed: (rec: CoachingRecommendation) => string;
export const getCoachingRecommendation: ({ metrics, historyDays, }: {
  metrics: DailyMetrics | undefined;
  historyDays: number;
}) => CoachingRecommendation;
```

```ts
// apps/web/src/components/dashboard/dashboardDate.ts
export const formatDashboardDate: (x: ChartHoverX) => string;
```

```ts
// apps/web/src/components/dashboard/hooks/useDashboardAxis.ts
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
// apps/web/src/components/dashboard/hooks/useDashboardChartEvents.ts
export const useDashboardChartEvents: (zoom: DashboardChartZoom) => DashboardChartEvents;
```

```ts
// apps/web/src/components/dashboard/hooks/useDashboardChartZoom.ts
export interface DashboardZoomRange {
  days: { from: string; to: string; count: number } | null;
  onZoomComplete: (from: string | number, to: string | number) => void;
}
export const useDashboardChartZoom: () => DashboardZoomRange;
```

```ts
// apps/web/src/components/dashboard/hooks/useDashboardSports.ts
export const useDashboardSports: () => Sport[];
```

```ts
// apps/web/src/components/dashboard/hooks/useFilteredMetrics.ts
export interface FilteredMetrics {
  history: DailyMetrics[];
  sportTss: Map<string, Record<string, number>>;
  sessions: TrainingSession[];
}
export const useFilteredMetrics: () => FilteredMetrics;
```

```ts
// apps/web/src/components/dashboard/hooks/useLoadChartData.ts
export const useLoadChartData: (axis: DashboardAxis) => LoadChartData;
```

```ts
// apps/web/src/components/dashboard/hooks/useMetrics.ts
export const useMetrics: () => TrainingMetrics;
```

```ts
// apps/web/src/components/dashboard/hooks/useVolumeChartRails.ts
export const useVolumeChartRails: ({ series, metric, }: { series: VolumeSeries; metric: VolumeMetric; }) => VolumeChartRails;
```

```ts
// apps/web/src/components/dashboard/hooks/useVolumeSeries.ts
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
// apps/web/src/components/dashboard/index.tsx
export const Dashboard: FC;
```

```ts
// apps/web/src/components/dashboard/statusColors.ts
export type AcwrColor = 'green' | 'yellow' | 'red';
export const TEXT_CLASS_BY_FORM_STATUS: Record<FormStatus, string>;
export const FILL_BY_FORM_STATUS: Record<FormStatus, string>;
export const CLASSES_BY_ACWR_COLOR: {
  green: { bg: string; text: string; ring: string; };
  yellow: { bg: string; text: string; ring: string; };
  red: { bg: string; text: string; ring: string; };
};
export const acwrColor: (acwr: number) => AcwrColor;
export const FILL_BY_ACWR_COLOR: { green: any; yellow: any; red: any; };
export const ACWR_ZONES: { from: number; to: number; color: any; }[];
export const TEXT_CLASS_BY_SPORT: Record<Sport, string>;
```

```ts
// apps/web/src/components/dashboard/types.ts
export const DASHBOARD_HOVER_GROUP: "dashboard";
export const CHART_COLOR_BY_SPORT: Record<Sport, TokenColor>;
```

```ts
// apps/web/src/components/demo/buildDemoDataset.ts
export const DEMO_SEED: 20260518;
export const DEMO_PERSONA: any;
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
export const buildDemoDataset: ({ seed, today, routes, }: { seed: number; today: Date; routes: DemoRoutesJson; }) => DemoDataset;
```

```ts
// apps/web/src/components/demo/loadDemoData.ts
export const loadDemoData: (queryClient: QueryClient) => Promise<number>;
```

```ts
// apps/web/src/components/errors/FallbackActions.tsx
export const FallbackActions: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/components/errors/ReportBugButton.tsx
export const ReportBugButton: FC<ReportBugButtonProps>;
```

```ts
// apps/web/src/components/errors/RootErrorFallback.tsx
export const RootErrorFallback: FC<RootErrorFallbackProps>;
```

```ts
// apps/web/src/components/errors/RouteErrorFallback.tsx
export const RouteErrorFallback: FC<FallbackProps>;
```

```ts
// apps/web/src/components/filters/FilterEmptyState.tsx
export const FilterEmptyState: FC;
```

```ts
// apps/web/src/components/filters/filterIcon.ts
export const filterIcon: (criteria: FilterCriteria) => LucideIcon;
```

```ts
// apps/web/src/components/filters/hooks/useFilterBuilder.ts
export const useFilterBuilder: ({ open, onClose, }: { open: boolean; onClose: () => void; }) => FilterBuilder;
```

```ts
// apps/web/src/components/filters/hooks/useNotUnderstoodHint.ts
export const useNotUnderstoodHint: ({ text, interpretations, }: { text: string; interpretations: FilterCriteria[]; }) => boolean;
```

```ts
// apps/web/src/components/filters/index.tsx
export const Filters: FC<FiltersProps>;
```

```ts
// apps/web/src/components/importProgress/OverlayContent.tsx
export const OverlayContent: FC<OverlayContentProps>;
```

```ts
// apps/web/src/components/importProgress/ProgressRing.tsx
export const ProgressRing: FC<ProgressRingProps>;
```

```ts
// apps/web/src/components/importProgress/importOverlayTiming.ts
export const MIN_OPEN_MS: number;
```

```ts
// apps/web/src/components/importProgress/importProgressCopy.ts
export const foregroundLabel: (foreground: ForegroundImport) => string;
export const summaryTitle: (summary: ImportSummary) => string;
export const summaryDescription: (summary: ImportSummary) => string;
```

```ts
// apps/web/src/components/importProgress/index.tsx
export const ImportProgress: FC;
```

```ts
// apps/web/src/components/importProgress/useHeldReprocess.ts
export const useHeldReprocess: (foreground: ForegroundImport | null) => ForegroundImport | null;
```

```ts
// apps/web/src/components/importProgress/useMinOpenTimeReached.ts
export const useMinOpenTimeReached: (openedAt: number) => boolean;
```

```ts
// apps/web/src/components/intervals/ErrorLine.tsx
export const ErrorLine: FC<ErrorLineProps>;
```

```ts
// apps/web/src/components/intervals/IntervalsStatusLine.tsx
export const IntervalsStatusLine: FC<IntervalsStatusLineProps>;
```

```ts
// apps/web/src/components/intervals/LoadingLine.tsx
export const LoadingLine: FC<LoadingLineProps>;
```

```ts
// apps/web/src/components/intervals/hooks/useIntervalsImport.ts
export const useIntervalsImport: ({ keyInput, onSynced, profileGate, }: {
  keyInput: string;
  onSynced: (() => void) | undefined;
  profileGate: ProfileGate | undefined;
}) => IntervalsImport;
```

```ts
// apps/web/src/components/intervals/hooks/useIntervalsKeyInput.ts
export const useIntervalsKeyInput: (storedKey: string | null) => IntervalsKeyInput;
```

```ts
// apps/web/src/components/intervals/index.tsx
export const Intervals: FC<IntervalsProps>;
```

```ts
// apps/web/src/components/intervals/types.ts
export type IntervalsKeyCheck =
  | { kind: 'checking' }
  | { kind: 'valid' }
  | { kind: 'rejected' }
  | { kind: 'failed'; message: string };
```

```ts
// apps/web/src/components/labs/LabsPeek.tsx
export const LabsPeek: FC;
```

```ts
// apps/web/src/components/labs/PaceCalculator.tsx
export const PaceCalculator: FC;
```

```ts
// apps/web/src/components/labs/RacePredictor.tsx
export const RacePredictor: FC;
```

```ts
// apps/web/src/components/labs/StepRow.tsx
export const StepRow: FC<StepRowProps>;
```

```ts
// apps/web/src/components/labs/WeeklyPlanTimeline.tsx
export const WeeklyPlanTimeline: FC<WeeklyPlanTimelineProps>;
```

```ts
// apps/web/src/components/labs/WorkoutCard.tsx
export const WorkoutCard: FC<WorkoutCardProps>;
```

```ts
// apps/web/src/components/labs/WorkoutExpansionPanel.tsx
export const WorkoutExpansionPanel: FC<WorkoutExpansionPanelProps>;
```

```ts
// apps/web/src/components/labs/groupSteps.ts
export const groupSteps: (steps: WorkoutStep[]) => GroupedStep[];
```

```ts
// apps/web/src/components/labs/hooks/useCoachPlan.ts
export const useCoachPlan: () => CoachPlan;
```

```ts
// apps/web/src/components/labs/hooks/usePaceCalculator.ts
export const usePaceCalculator: () => PaceCalculatorForm;
```

```ts
// apps/web/src/components/labs/hooks/useRacePredictor.ts
export const useRacePredictor: () => RacePredictorForm;
```

```ts
// apps/web/src/components/labs/index.tsx
export const Labs: FC;
```

```ts
// apps/web/src/components/labs/prescription.ts
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
// apps/web/src/components/labs/raceTime.ts
export const DISTANCE_OPTIONS: { value: RaceDistance; label: string; }[];
export const isLongFormat: (distance: RaceDistance) => boolean;
export const parseRaceTime: ({ input, distance, }: { input: string; distance: RaceDistance; }) => number | undefined;
```

```ts
// apps/web/src/components/labs/workoutDisplay.ts
export const ICON_BY_WORKOUT_TYPE: Record<WorkoutType, LucideIcon>;
export const STEP_LABELS: Record<string, () => string>;
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
// apps/web/src/components/layout/DockTabs.tsx
export const DockTabs: FC<DockTabsProps>;
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
export const CLASSES_BY_DOCK_ITEM_SHAPE: Record<"rail" | "pill" | "circle", string>;
export const itemClass: "relative shrink-0 rounded-full text-text-tertiary";
export const activeItemClass: "bg-accent-muted text-accent-hover hover:bg-accent-muted hover:text-accent-hover";
export const segmentClass: any;
```

```ts
// apps/web/src/components/layout/useOverscrollLockEffect.ts
export const useOverscrollLockEffect: () => void;
```

```ts
// apps/web/src/components/mapBackground/DeckGLOverlay.tsx
export const DeckGLOverlay: FC<DeckGLOverlayProps>;
```

```ts
// apps/web/src/components/mapBackground/DeckOverlayControl.tsx
export const DeckOverlayControl: FC<DeckOverlayControlProps>;
```

```ts
// apps/web/src/components/mapBackground/MapControlsBar.tsx
export const MapControlsBar: FC<MapControlsBarProps>;
```

```ts
// apps/web/src/components/mapBackground/MapPickPopup.tsx
export const MapPickPopup: FC<MapPickPopupProps>;
```

```ts
// apps/web/src/components/mapBackground/OverviewMapControls.tsx
export const OverviewMapControls: FC;
```

```ts
// apps/web/src/components/mapBackground/RampSwatch.tsx
export const RampSwatch: FC<RampSwatchProps>;
```

```ts
// apps/web/src/components/mapBackground/SessionTerrain.tsx
export const SessionTerrain: FC<SessionTerrainProps>;
```

```ts
// apps/web/src/components/mapBackground/TrackIntensityControl.tsx
export const TrackIntensityControl: FC;
```

```ts
// apps/web/src/components/mapBackground/fitPadding.ts
export interface MapPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
export const MIN_FIT_BOX: 120;
export const PHONE_FIT_MARGIN: 24;
export const fitPadding: (input: FitPaddingInput) => MapPadding;
```

```ts
// apps/web/src/components/mapBackground/hooks/cameraRuns.ts
export interface CameraRuns {
  token: number;
  cancelEase: (() => void) | null;
  limit: { sessionId: string; off: () => void } | null;
}
export const cancelRunning: (runs: CameraRuns) => void;
export const clearZoomLimit: ({ map, runs }: { map: MapLibreMap; runs: CameraRuns; }) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/types.ts
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
// apps/web/src/components/mapBackground/hooks/useCameraRuns.ts
export const useCameraRuns: (map: MapLibreMap | undefined) => RefObject<CameraRuns>;
```

```ts
// apps/web/src/components/mapBackground/hooks/useDeckEventHandlers.ts
export const useDeckEventHandlers: ({ onClick, onHover, }: {
  onClick: PickHandler | undefined;
  onHover: PickHandler | undefined;
}) => DeckEventHandlers;
```

```ts
// apps/web/src/components/mapBackground/hooks/useDetailLayers.ts
export const useDetailLayers: ({ terrain, eventHandlers, }: {
  terrain: boolean;
  eventHandlers: DeckEventHandlers;
}) => DetailLayers;
```

```ts
// apps/web/src/components/mapBackground/hooks/useGeoLayers.ts
export const useGeoLayers: (terrain: boolean) => LayersList | null;
```

```ts
// apps/web/src/components/mapBackground/hooks/useGeolocationCameraEffect.ts
export const useGeolocationCameraEffect: (mapRef: React.RefObject<MapRef | null>) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useLapLayers.ts
export const useLapLayers: ({ terrain, detailPath, }: { terrain: boolean; detailPath: DetailPath | null; }) => LapLayers;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapBackgroundEffects.ts
export const useMapBackgroundEffects: ({ mapRef, mapLoaded, }: { mapRef: React.RefObject<MapRef | null>; mapLoaded: boolean; }) => void;
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
// apps/web/src/components/mapBackground/hooks/useMapCameraInputs.ts
export const useMapCameraInputs: ({ gpsData, tracks, }: { gpsData: SessionGPS[] | null; tracks: MapTrack[]; }) => MapCameraInputs;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapCameraTarget.ts
export const useMapCameraTarget: () => MapCameraTarget;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapHover.ts
export const useMapHover: ({ kind, id }: { kind: MapHoverKind; id: string; }) => MapHoverHandlers;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapInteraction.ts
export const useMapInteraction: ({ mapRef, tracks, }: {
  mapRef: React.RefObject<MapRef | null>;
  tracks: MapTrack[];
}) => MapInteraction;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapPopupState.ts
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
// apps/web/src/components/mapBackground/hooks/useMapRendererHandOver.ts
export const useMapRendererHandOver: ({ terrain, mapLoaded, }: { terrain: boolean; mapLoaded: boolean; }) => MapRendererHandOver;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapTerrainEffect.ts
export const useMapTerrainEffect: () => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapTracks.ts
export const useMapTracks: (gpsData: SessionGPS[] | null) => MapTrack[];
```

```ts
// apps/web/src/components/mapBackground/hooks/useOnboardingPreviewCameraEffect.ts
export const useOnboardingPreviewCameraEffect: () => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useOnboardingPreviewLayer.ts
export const useOnboardingPreviewLayer: () => PathLayer<PreviewSlice> | null;
```

```ts
// apps/web/src/components/mapBackground/hooks/useOpenedSessionEffect.ts
export const useOpenedSessionEffect: (sessionId: string | null) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useOverviewMapControlsEffect.ts
export const useOverviewMapControlsEffect: (tracks: MapTrack[]) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/usePickLayers.ts
export const usePickLayers: (terrain: boolean) => PickLayers;
```

```ts
// apps/web/src/components/mapBackground/hooks/useSessionDetailPath.ts
export const useSessionDetailPath: ({ hoveredSessionId, openedSessionId, sessions, }: {
  hoveredSessionId: string | null;
  openedSessionId: string | null;
  sessions: TrainingSession[];
}) => DetailPath | null;
```

```ts
// apps/web/src/components/mapBackground/hooks/useSessionFitBounds.ts
export const useSessionFitBounds: ({ gpsData, sessionId, }: {
  gpsData: SessionGPS[] | null;
  sessionId: string | null;
}) => GPSBounds | null;
```

```ts
// apps/web/src/components/mapBackground/hooks/useStudioMapTracks.ts
export const useStudioMapTracks: () => StudioMapTracks;
```

```ts
// apps/web/src/components/mapBackground/hooks/useStudioRouteLayer.ts
export const useStudioRouteLayer: (eventHandlers: DeckEventHandlers) => Layer | null;
```

```ts
// apps/web/src/components/mapBackground/hooks/useSuppressTapMouseEffect.ts
export const useSuppressTapMouseEffect: ({ mapRef, mapLoaded, }: { mapRef: React.RefObject<MapRef | null>; mapLoaded: boolean; }) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useTerrainHoverPointEffect.ts
export const useTerrainHoverPointEffect: () => void;
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
// apps/web/src/components/mapBackground/hooks/useTerrainLineEffect.ts
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
// apps/web/src/components/mapBackground/hooks/useTerrainOrbitEffect.ts
export const useTerrainOrbitEffect: () => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useTerrainTrackPickingEffect.ts
export const useTerrainTrackPickingEffect: ({ layerId, detailPath, }: { layerId: string; detailPath: DetailPath | null; }) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/useTrackLayers.ts
export const useTrackLayers: ({ tracks, eventHandlers, }: {
  tracks: MapTrack[];
  eventHandlers: DeckEventHandlers;
}) => LayersList | null;
```

```ts
// apps/web/src/components/mapBackground/hooks/useWatchPositionEffect.ts
export const useWatchPositionEffect: () => void;
```

```ts
// apps/web/src/components/mapBackground/index.tsx
export const MapBackground: FC;
```

```ts
// apps/web/src/components/mapBackground/lapPath.ts
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
// apps/web/src/components/mapBackground/mapCamera.ts
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
// apps/web/src/components/mapBackground/mapPadding.ts
export const MAP_FIT_MARGIN: 80;
export const MAP_CONTROLS_HEIGHT: 44;
export const MAP_CONTROLS_BOTTOM: 40;
export const mapPadding: (margin: number, options?: MapPaddingOptions) => MapPadding;
```

```ts
// apps/web/src/components/mapBackground/mapStyle.ts
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
export const STYLE_BY_MAP_STYLE: Record<"dark", StyleSpecification>;
```

```ts
// apps/web/src/components/mapBackground/mapZ.ts
export const MAP_MARKER_Z: "z-10";
```

```ts
// apps/web/src/components/mapBackground/popupSafeZone.ts
export const popupCollisionPadding: (desktop: boolean) => { left: number; top: number; right: number; bottom: number; };
```

```ts
// apps/web/src/components/mapBackground/terrainCamera.ts
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
// apps/web/src/components/mapBackground/terrainLine.ts
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
// apps/web/src/components/mapBackground/trackColors.ts
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
export const geoAccuracyFill: [number, number, number, number];
export const geoAccuracyLine: [number, number, number, number];
export const geoDotFill: [number, number, number, number];
export const geoDotLine: [number, number, number, number];
export const HIGHLIGHT_TRANSITIONS: { getWidth: number; getColor: number; };
```

```ts
// apps/web/src/components/mapBackground/trackPicking.ts
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
// apps/web/src/components/mapBackground/trackSmoothing.ts
export const TRACK_SMOOTHING_SEC: { readonly hr: 5; readonly power: 30; readonly pace: 10; readonly speed: 10; readonly wind: 10; };
export const rollingMean: ({ times, values, windowSec, }: {
  times: number[];
  values: Array<number | undefined>;
  windowSec: number;
}) => Array<number | undefined>;
```

```ts
// apps/web/src/components/mapBackground/zoneColoredPath.ts
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
// apps/web/src/components/metricLabel/ExplanationBody.tsx
export const ExplanationBody: FC<ExplanationBodyProps>;
```

```ts
// apps/web/src/components/metricLabel/explanations.ts
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
export const EXPLANATION_BY_METRIC: Record<MetricId, MetricExplanation>;
```

```ts
// apps/web/src/components/metricLabel/index.tsx
export const MetricLabel: FC<MetricLabelProps>;
```

```ts
// apps/web/src/components/onboarding/BackButton.tsx
export const BackButton: FC;
```

```ts
// apps/web/src/components/onboarding/CardBody.tsx
export const CardBody: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/components/onboarding/ContinueButton.tsx
export const ContinueButton: FC<ContinueButtonProps>;
```

```ts
// apps/web/src/components/onboarding/DesktopOnboarding.tsx
export const DesktopOnboarding: FC<ShellProps>;
```

```ts
// apps/web/src/components/onboarding/FieldInput.tsx
export const FieldInput: FC<FieldInputProps>;
```

```ts
// apps/web/src/components/onboarding/GenderPick.tsx
export const GenderPick: FC<GenderPickProps>;
```

```ts
// apps/web/src/components/onboarding/OnboardingCrumbs.tsx
export const OnboardingCrumbs: FC;
```

```ts
// apps/web/src/components/onboarding/OnboardingHeading.tsx
export const OnboardingHeading: FC<OnboardingHeadingProps>;
```

```ts
// apps/web/src/components/onboarding/OnboardingIntro.tsx
export const OnboardingIntro: FC<OnboardingIntroProps>;
```

```ts
// apps/web/src/components/onboarding/OnboardingIntroActions.tsx
export const OnboardingIntroActions: FC<OnboardingIntroActionsProps>;
```

```ts
// apps/web/src/components/onboarding/OnboardingProgress.tsx
export const OnboardingProgress: FC;
```

```ts
// apps/web/src/components/onboarding/OnboardingStep.tsx
export const OnboardingStep: FC<StepProps>;
```

```ts
// apps/web/src/components/onboarding/PhoneCard.tsx
export const PhoneCard: FC<ShellProps>;
```

```ts
// apps/web/src/components/onboarding/PhoneOnboarding.tsx
export const PhoneOnboarding: FC<ShellProps>;
```

```ts
// apps/web/src/components/onboarding/ReopenPill.tsx
export const ReopenPill: FC;
```

```ts
// apps/web/src/components/onboarding/SourcePicker.tsx
export const SourcePicker: FC<SourcePickerProps>;
```

```ts
// apps/web/src/components/onboarding/ThresholdFields.tsx
export const ThresholdFields: FC<ThresholdFieldsProps>;
```

```ts
// apps/web/src/components/onboarding/YouFields.tsx
export const YouFields: FC<YouFieldsProps>;
```

```ts
// apps/web/src/components/onboarding/hooks/useRevealOnboardingPreviewEffect.ts
export const useRevealOnboardingPreviewEffect: () => void;
```

```ts
// apps/web/src/components/onboarding/hooks/useStepFocusEffect.ts
export const useStepFocusEffect: ({ step, headingRef, }: {
  step: OnboardingStep;
  headingRef: RefObject<HTMLElement | null>;
}) => void;
```

```ts
// apps/web/src/components/onboarding/index.tsx
export const Onboarding: FC;
```

```ts
// apps/web/src/components/onboarding/onboardingFields.ts
export const fieldId: (field: FormField) => string;
```

```ts
// apps/web/src/components/onboarding/onboardingScreens.tsx
export const screenOf: ({ step, source, props, profileGate, }: {
  step: Step;
  source: OnboardingSource | null;
  props: StepProps;
  profileGate: ProfileGate;
}) => Screen;
```

```ts
// apps/web/src/components/onboarding/types.ts
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
// apps/web/src/components/records/SportRecordsCard.tsx
export const SportRecordsCard: FC<SportRecordsCardProps>;
```

```ts
// apps/web/src/components/records/index.tsx
export const Records: FC;
```

```ts
// apps/web/src/components/sessions/FitUploadButton.tsx
export const FitUploadButton: FC<FitUploadButtonProps>;
```

```ts
// apps/web/src/components/sessions/SessionHeader.tsx
export const SessionHeader: FC<SessionHeaderProps>;
```

```ts
// apps/web/src/components/sessions/SessionItem.tsx
export const SessionItem: FC<SessionItemProps>;
```

```ts
// apps/web/src/components/sessions/SessionList.tsx
export const SessionList: FC;
```

```ts
// apps/web/src/components/sessions/SessionPeek.tsx
export const SessionPeek: FC<SessionPeekProps>;
```

```ts
// apps/web/src/components/sessions/SessionsPeek.tsx
export const SessionsPeek: FC;
```

```ts
// apps/web/src/components/sessions/SessionsPickPopup.tsx
export const SessionsPickPopup: FC<SessionsPickPopupProps>;
```

```ts
// apps/web/src/components/sessions/SportBadge.tsx
export const SportBadge: FC<SportBadgeProps>;
```

```ts
// apps/web/src/components/sessions/ZoneLegend.tsx
export const ZoneLegend: FC<ZoneLegendProps>;
```

```ts
// apps/web/src/components/sessions/archive.ts
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
// apps/web/src/components/sessions/charts/CadenceChart.tsx
export const CadenceChart: FC<CadenceChartProps>;
```

```ts
// apps/web/src/components/sessions/charts/GradeAdjustedPaceChart.tsx
export const GradeAdjustedPaceChart: FC<GradeAdjustedPaceChartProps>;
```

```ts
// apps/web/src/components/sessions/charts/HrChart.tsx
export const HrChart: FC<HrChartProps>;
```

```ts
// apps/web/src/components/sessions/charts/PaceChart.tsx
export const PaceChart: FC<PaceChartProps>;
```

```ts
// apps/web/src/components/sessions/charts/PowerChart.tsx
export const PowerChart: FC<PowerChartProps>;
```

```ts
// apps/web/src/components/sessions/charts/SessionChartsExplorer.tsx
export const SessionChartsExplorer: FC<SessionChartsExplorerProps>;
```

```ts
// apps/web/src/components/sessions/charts/SpeedChart.tsx
export const SpeedChart: FC<SpeedChartProps>;
```

```ts
// apps/web/src/components/sessions/charts/hooks/useSessionChartHover.ts
export const useSessionChartHover: (gpsLookup: Map<number, [number, number]>) => SessionChartHover;
```

```ts
// apps/web/src/components/sessions/charts/hooks/useSessionChartNodes.tsx
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
// apps/web/src/components/sessions/charts/hooks/useSessionChartRows.ts
export const useSessionChartRows: ({ sport, records, zoomRange, }: {
  sport: Sport;
  records: SessionRecord[];
  zoomRange: { from: number; to: number; } | null;
}) => SessionChartRows;
```

```ts
// apps/web/src/components/sessions/charts/hooks/useSessionChartScales.ts
export const useSessionChartScales: ({ date, records, }: { date: number; records: SessionRecord[]; }) => SessionChartScales;
```

```ts
// apps/web/src/components/sessions/charts/hooks/useSessionRailStats.ts
export const useSessionRailStats: ({ session, records, terrain, extremes, zoomRange, }: {
  session: TrainingSession;
  records: SessionRecord[];
  terrain: SessionTerrain;
  extremes: ReturnType<typeof computeRecordExtremes>;
  zoomRange: { from: number; to: number; } | null;
}) => SessionRailStats;
```

```ts
// apps/web/src/components/sessions/charts/railRange.ts
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
// apps/web/src/components/sessions/charts/recordExtremes.ts
export const computeRecordExtremes: ({ records, gradients, }: {
  records: SessionRecord[];
  gradients: Array<number | undefined>;
}) => RecordExtremes;
```

```ts
// apps/web/src/components/sessions/charts/types.ts
export const HOVER_GROUP: "session-detail";
```

```ts
// apps/web/src/components/sessions/charts/zoneLabel.ts
export const zoneName: (band: Pick<ZoneBand, "name">) => string | undefined;
export const zoneLabel: (band: Pick<ZoneBand, "zone" | "name">) => string;
```

```ts
// apps/web/src/components/sessions/downloadFile.ts
export const downloadFile: (file: File) => void;
```

```ts
// apps/web/src/components/sessions/gpxExport.ts
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
// apps/web/src/components/sessions/hooks/useClearSessionChartHoverEffect.ts
export const useClearSessionChartHoverEffect: (group: string) => void;
```

```ts
// apps/web/src/components/sessions/hooks/useFileDropEffect.ts
export const useFileDropEffect: ({ onDrop, enabled, }: { onDrop: (files: FileList) => Promise<void>; enabled: boolean; }) => void;
```

```ts
// apps/web/src/components/sessions/hooks/useFileUpload.ts
export const useFileUpload: () => FileUpload;
```

```ts
// apps/web/src/components/sessions/hooks/useSessionTitle.ts
export const useSessionTitle: (session: TrainingSession | undefined) => SessionTitle;
```

```ts
// apps/web/src/components/sessions/index.tsx
export const Sessions: FC;
```

```ts
// apps/web/src/components/sessions/session/AvatarFrame.tsx
export const AvatarFrame: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/components/sessions/session/Bars.tsx
export const Bars: FC<BarsProps>;
```

```ts
// apps/web/src/components/sessions/session/ColorByControl.tsx
export const ColorByControl: FC<ColorByControlProps>;
```

```ts
// apps/web/src/components/sessions/session/DeleteSessionDialog.tsx
export const DeleteSessionDialog: FC<DeleteSessionDialogProps>;
```

```ts
// apps/web/src/components/sessions/session/HrZonesCell.tsx
export const HrZonesCell: FC<HrZonesCellProps>;
```

```ts
// apps/web/src/components/sessions/session/KeyValue.tsx
export const KeyValue: FC<KeyValueProps>;
```

```ts
// apps/web/src/components/sessions/session/LapExtreme.tsx
export const LapExtreme: FC<LapExtremeProps>;
```

```ts
// apps/web/src/components/sessions/session/LapStepper.tsx
export const LapStepper: FC<LapStepperProps>;
```

```ts
// apps/web/src/components/sessions/session/LapStrip.tsx
export const LapStrip: FC<LapStripProps>;
```

```ts
// apps/web/src/components/sessions/session/LapStripAvatar.tsx
export const LapStripAvatar: FC<LapStripAvatarProps>;
```

```ts
// apps/web/src/components/sessions/session/LapStripDetail.tsx
export const LapStripDetail: FC<LapStripDetailProps>;
```

```ts
// apps/web/src/components/sessions/session/LapSwatch.tsx
export const LapSwatch: FC<LapSwatchProps>;
```

```ts
// apps/web/src/components/sessions/session/LapsControl.tsx
export const LapsControl: FC<LapsControlProps>;
```

```ts
// apps/web/src/components/sessions/session/LapsDetails.tsx
export const LapsDetails: FC<LapsDetailsProps>;
```

```ts
// apps/web/src/components/sessions/session/LapsPicker.tsx
export const LapsPicker: FC<LapsPickerProps>;
```

```ts
// apps/web/src/components/sessions/session/LapsRow.tsx
export const LapsRow: FC<LapsRowProps>;
```

```ts
// apps/web/src/components/sessions/session/LegendDot.tsx
export const LegendDot: FC<LegendDotProps>;
```

```ts
// apps/web/src/components/sessions/session/MapViewControl.tsx
export const MapViewControl: FC;
```

```ts
// apps/web/src/components/sessions/session/MeterBar.tsx
export const MeterBar: FC<MeterBarProps>;
```

```ts
// apps/web/src/components/sessions/session/MoreStatsRow.tsx
export const MoreStatsRow: FC<MoreStatsRowProps>;
```

```ts
// apps/web/src/components/sessions/session/NoGpsBanner.tsx
export const NoGpsBanner: FC<NoGpsBannerProps>;
```

```ts
// apps/web/src/components/sessions/session/PeakBars.tsx
export const PeakBars: FC<PeakBarsProps>;
```

```ts
// apps/web/src/components/sessions/session/PeakPowerCell.tsx
export const PeakPowerCell: FC<PeakPowerCellProps>;
```

```ts
// apps/web/src/components/sessions/session/PrecipitationDots.tsx
export const PrecipitationDots: FC<PrecipitationDotsProps>;
```

```ts
// apps/web/src/components/sessions/session/SensorWarningBanner.tsx
export const SensorWarningBanner: FC<SensorWarningBannerProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionActionsMenu.tsx
export const SessionActionsMenu: FC<SessionActionsMenuProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionLapSetSync.tsx
export const SessionLapSetSync: FC<SessionLapSetSyncProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionMapControls.tsx
export const SessionMapControls: FC<SessionMapControlsProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionOverview.tsx
export const SessionOverview: FC<SessionOverviewProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionSummaryCard.tsx
export const SessionSummaryCard: FC<SessionSummaryCardProps>;
```

```ts
// apps/web/src/components/sessions/session/SplitSlider.tsx
export const SplitSlider: FC<SplitSliderProps>;
```

```ts
// apps/web/src/components/sessions/session/StepButton.tsx
export const StepButton: FC<StepButtonProps>;
```

```ts
// apps/web/src/components/sessions/session/Swatch.tsx
export const Swatch: FC<SwatchProps>;
```

```ts
// apps/web/src/components/sessions/session/TrainingEffectCard.tsx
export const TrainingEffectCard: FC<TrainingEffectCardProps>;
```

```ts
// apps/web/src/components/sessions/session/TrainingEffectGauge.tsx
export const TrainingEffectGauge: FC<TrainingEffectGaugeProps>;
```

```ts
// apps/web/src/components/sessions/session/TrainingEffectGlyph.tsx
export const TrainingEffectGlyph: FC<TrainingEffectGlyphProps>;
```

```ts
// apps/web/src/components/sessions/session/WeatherCard.tsx
export const WeatherCard: FC<WeatherCardProps>;
```

```ts
// apps/web/src/components/sessions/session/WeatherDetails.tsx
export const WeatherDetails: FC<WeatherDetailsProps>;
```

```ts
// apps/web/src/components/sessions/session/WeatherHourlyTable.tsx
export const WeatherHourlyTable: FC<WeatherHourlyTableProps>;
```

```ts
// apps/web/src/components/sessions/session/Wedges.tsx
export const Wedges: FC<WedgesProps>;
```

```ts
// apps/web/src/components/sessions/session/WindLegend.tsx
export const WindLegend: FC<WindLegendProps>;
```

```ts
// apps/web/src/components/sessions/session/WindRose.tsx
export const WindRose: FC<WindRoseProps>;
```

```ts
// apps/web/src/components/sessions/session/WindRoseGlyph.tsx
export const WindRoseGlyph: FC<WindRoseGlyphProps>;
```

```ts
// apps/web/src/components/sessions/session/hooks/useEditInStudio.ts
export const useEditInStudio: (session: TrainingSession) => EditInStudio;
```

```ts
// apps/web/src/components/sessions/session/hooks/useLapsControlState.ts
export const useLapsControlState: ({ records, laps, sport, }: {
  records: SessionRecord[];
  laps: SessionLap[];
  sport: Sport;
}) => LapsControlState;
```

```ts
// apps/web/src/components/sessions/session/hooks/useLapsPickerSets.ts
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
// apps/web/src/components/sessions/session/hooks/useMarkSessionSeenEffect.ts
export const useMarkSessionSeenEffect: (sessionId: string | undefined) => void;
```

```ts
// apps/web/src/components/sessions/session/hooks/useMiniRailHover.ts
export const useMiniRailHover: () => MiniRailHover;
```

```ts
// apps/web/src/components/sessions/session/hooks/useMoreStats.ts
export const useMoreStats: ({ session, records, }: { session: TrainingSession; records: SessionRecord[]; }) => MoreStats;
```

```ts
// apps/web/src/components/sessions/session/hooks/useSessionColorModes.ts
export const useSessionColorModes: ({ session, records, }: {
  session: TrainingSession;
  records: SessionRecord[];
}) => SessionColorModes;
```

```ts
// apps/web/src/components/sessions/session/hooks/useSessionExport.ts
export const useSessionExport: (session: TrainingSession) => SessionExport;
```

```ts
// apps/web/src/components/sessions/session/hooks/useSessionLapsEffect.ts
export const useSessionLapsEffect: ({ records, laps, }: { records: SessionRecord[]; laps: SessionLap[]; }) => void;
```

```ts
// apps/web/src/components/sessions/session/hooks/useTrackColorModeEffect.ts
export const useTrackColorModeEffect: (mode: ColorMode) => void;
```

```ts
// apps/web/src/components/sessions/session/hooks/useWindExposure.ts
export const useWindExposure: ({ records, weather, sessionStartMs, }: {
  records: SessionRecord[];
  weather: SessionWeather | null;
  sessionStartMs: number;
}) => WindExposure | null;
```

```ts
// apps/web/src/components/sessions/session/hooks/useWindRose.ts
export const useWindRose: ({ records, weather, sessionStartMs, }: {
  records: SessionRecord[];
  weather: SessionWeather | null;
  sessionStartMs: number;
}) => number[] | null;
```

```ts
// apps/web/src/components/sessions/session/index.tsx
export const Session: FC;
```

```ts
// apps/web/src/components/sessions/session/lapLabels.ts
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
// apps/web/src/components/sessions/session/lapStripLayout.ts
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
// apps/web/src/components/sessions/session/localizedTrainingEffect.ts
export const localizedTELabel: (key: TrainingEffectLabel) => string;
export const localizedTESummary: (key: TrainingEffectSummary) => string;
```

```ts
// apps/web/src/components/sessions/session/sensorWarningText.ts
export const sensorWarningText: (warning: SensorWarning) => string;
```

```ts
// apps/web/src/components/sessions/session/sessionFitness.ts
export const ctlOnDate: ({ history, timestamp, }: { history: DailyMetrics[]; timestamp: number; }) => number;
```

```ts
// apps/web/src/components/sessions/session/statFormat.ts
export const statFormat: {
  watts: (value: number) => string;
  duration: (seconds: number) => string;
  percent: (share: number) => string;
  peakWindow: (seconds: number) => string;
  integer: (value: number) => string;
};
```

```ts
// apps/web/src/components/sessions/session/trainingEffectScale.ts
export const TE_ZONES: { from: number; to: number; color: any; }[];
export const fillOf: (value: number) => string;
```

```ts
// apps/web/src/components/sessions/session/types.ts
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
// apps/web/src/components/sessions/session/validation.ts
export type SensorWarning =
  | { code: 'hr_above_max'; limit: number; count: number }
  | { code: 'hr_all_zero' }
  | { code: 'power_above_max'; limit: number; count: number }
  | { code: 'speed_above_max'; limit: number; count: number };
export const validateRecords: ({ records, sport, }: { records: SessionRecord[]; sport: Sport; }) => SensorWarning[];
```

```ts
// apps/web/src/components/sessions/session/weatherConditions.ts
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
// apps/web/src/components/sessions/session/windRoseSectors.ts
export const WIND_ROSE_SECTOR_DEG: number;
export const windRoseSectorAngle: (sector: number) => number;
export const windRoseShares: (relative: Array<RelativeWind | undefined>) => number[] | null;
```

```ts
// apps/web/src/components/sessions/sessionTitleFormatter.ts
export const formatSessionName: (input: SessionNameInput) => string;
export const formatSessionZoneLabel: ({ avgHr, maxHr, restHr, }: {
  avgHr: number | undefined;
  maxHr: number | undefined;
  restHr: number | undefined;
}) => string | undefined;
```

```ts
// apps/web/src/components/sessions/sessionsSnackbars.ts
export const SESSIONS_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/components/sessions/sportIcons.ts
export const ICON_BY_SPORT: Record<Sport, LucideIcon>;
```

```ts
// apps/web/src/components/sessions/types.ts
export interface PopupInfo {
  x: number;
  y: number;
  sessions: TrainingSession[];
}
```

```ts
// apps/web/src/components/settings/AboutSection.tsx
export const AboutSection: FC;
```

```ts
// apps/web/src/components/settings/DataManagementSection.tsx
export const DataManagementSection: FC;
```

```ts
// apps/web/src/components/settings/DeleteAllDataDialog.tsx
export const DeleteAllDataDialog: FC<DeleteAllDataDialogProps>;
```

```ts
// apps/web/src/components/settings/Divider.tsx
export const Divider: FC;
```

```ts
// apps/web/src/components/settings/FitFilesCard.tsx
export const FitFilesCard: FC;
```

```ts
// apps/web/src/components/settings/IntegrationsCard.tsx
export const IntegrationsCard: FC;
```

```ts
// apps/web/src/components/settings/PaceEstimateButton.tsx
export const PaceEstimateButton: FC<PaceEstimateButtonProps>;
```

```ts
// apps/web/src/components/settings/PaceEstimatorDialog.tsx
export const PaceEstimatorDialog: FC<PaceEstimatorDialogProps>;
```

```ts
// apps/web/src/components/settings/ProfileFields.tsx
export const ProfileFields: FC<ProfileFieldsProps>;
```

```ts
// apps/web/src/components/settings/SettingsPeek.tsx
export const SettingsPeek: FC;
```

```ts
// apps/web/src/components/settings/ThresholdEditDialog.tsx
export const ThresholdEditDialog: FC<ThresholdEditDialogProps>;
```

```ts
// apps/web/src/components/settings/ThresholdEditForm.tsx
export const ThresholdEditForm: FC<ThresholdEditFormProps>;
```

```ts
// apps/web/src/components/settings/ThresholdSparkline.tsx
export const ThresholdSparkline: FC<ThresholdSparklineProps>;
```

```ts
// apps/web/src/components/settings/ThresholdTile.tsx
export const ThresholdTile: FC<ThresholdTileProps>;
```

```ts
// apps/web/src/components/settings/ThresholdTiles.tsx
export const ThresholdTiles: FC<ThresholdTilesProps>;
```

```ts
// apps/web/src/components/settings/ThresholdsSection.tsx
export const ThresholdsSection: FC;
```

```ts
// apps/web/src/components/settings/deleteAllData.ts
export const clearAllAppState: (queryClient: QueryClient) => void;
```

```ts
// apps/web/src/components/settings/hooks/types.ts
export type NumberField = 'restHr' | 'maxHr' | 'thresholdHr' | 'ftp' | 'weight' | 'birthYear';
export type TextField = NumberField | 'thresholdPace';
export type FormField = TextField | 'gender';
export interface ProfileGate {
  ready: boolean;
  save: () => void;
}
export interface FormValues {
  gender: Gender | null;
  birthYear: string;
  restHr: string;
  maxHr: string;
  thresholdHr: string;
  ftp: string;
  thresholdPace: string;
  weight: string;
}
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
```

```ts
// apps/web/src/components/settings/hooks/useThresholdDraft.ts
export const useThresholdDraft: ({ field, thresholds, }: { field: ThresholdKey; thresholds: ThresholdsForm; }) => ThresholdDraft;
```

```ts
// apps/web/src/components/settings/hooks/useThresholdTileReading.ts
export const useThresholdTileReading: ({ tile, histories, context, scrub, fresh, }: {
  tile: TileSpec;
  histories: ThresholdHistories;
  context: ThresholdTileContext;
  scrub: TileScrub | null;
  fresh: boolean;
}) => ThresholdTileReading;
```

```ts
// apps/web/src/components/settings/hooks/useThresholdsAt.ts
export const useThresholdsAt: (date: number) => ResolvedThresholds | undefined;
```

```ts
// apps/web/src/components/settings/hooks/useThresholdsForm.ts
export const useThresholdsForm: (mode: "create" | "update") => ThresholdsForm;
```

```ts
// apps/web/src/components/settings/index.tsx
export const Settings: FC;
```

```ts
// apps/web/src/components/settings/links.ts
export const GITHUB_URL: "https://github.com/fabianhinz/PaceVault";
```

```ts
// apps/web/src/components/settings/profileHistory.ts
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
// apps/web/src/components/settings/settingsSnackbars.ts
export const SETTINGS_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/components/settings/thresholdFieldErrors.ts
export const optionalNumber: (value: string) => number | undefined;
export const fieldError: ({ field, form, stored, }: { field: TextField; form: FormValues; stored: FormValues; }) => string;
export const fieldErrorFor: ({ field, draft, values, }: { field: TextField; draft: string; values: FormValues; }) => string;
```

```ts
// apps/web/src/components/settings/thresholdIcons.ts
export const ICON_BY_THRESHOLD_TILE: Record<any, LucideIcon>;
export const isEditable: (key: ThresholdTileKey) => key is ThresholdKey;
```

```ts
// apps/web/src/components/settings/types.ts
export type ThresholdTileKey = ThresholdKey | 'wkg';
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
// apps/web/src/components/studio/DeleteStudioRouteDialog.tsx
export const DeleteStudioRouteDialog: FC<DeleteStudioRouteDialogProps>;
```

```ts
// apps/web/src/components/studio/MarkerCard.tsx
export const MarkerCard: FC<MarkerCardProps>;
```

```ts
// apps/web/src/components/studio/RouteStatsGrid.tsx
export const RouteStatsGrid: FC<RouteStatsGridProps>;
```

```ts
// apps/web/src/components/studio/StudioActionsMenu.tsx
export const StudioActionsMenu: FC<StudioActionsMenuProps>;
```

```ts
// apps/web/src/components/studio/StudioColorPicker.tsx
export const StudioColorPicker: FC<StudioColorPickerProps>;
```

```ts
// apps/web/src/components/studio/StudioDetail.tsx
export const StudioDetail: FC<StudioDetailProps>;
```

```ts
// apps/web/src/components/studio/StudioRouteFormDialog.tsx
export const StudioRouteFormDialog: FC<StudioRouteFormDialogProps>;
```

```ts
// apps/web/src/components/studio/StudioRouteHeader.tsx
export const StudioRouteHeader: FC<StudioRouteHeaderProps>;
```

```ts
// apps/web/src/components/studio/StudioRouteItem.tsx
export const StudioRouteItem: FC<StudioRouteItemProps>;
```

```ts
// apps/web/src/components/studio/StudioRoutePeek.tsx
export const StudioRoutePeek: FC<StudioRoutePeekProps>;
```

```ts
// apps/web/src/components/studio/StudioTab.tsx
export const StudioTab: FC;
```

```ts
// apps/web/src/components/studio/StudioToolsTab.tsx
export const StudioToolsTab: FC<StudioToolsTabProps>;
```

```ts
// apps/web/src/components/studio/charts/RouteChartsExplorer.tsx
export const RouteChartsExplorer: FC<RouteChartsExplorerProps>;
```

```ts
// apps/web/src/components/studio/createStudioRoute.ts
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
// apps/web/src/components/studio/hooks/useClearRouteChartHoverEffect.ts
export const useClearRouteChartHoverEffect: (group: string) => void;
```

```ts
// apps/web/src/components/studio/hooks/useGpxImport.ts
export const useGpxImport: () => GpxImport;
```

```ts
// apps/web/src/components/studio/hooks/useRouteChartHover.ts
export const useRouteChartHover: (gpsLookup: Map<number, [number, number]>) => ((dist: number | null) => void);
```

```ts
// apps/web/src/components/studio/hooks/useRouteChartRows.ts
export const useRouteChartRows: ({ points, zoomRange, }: {
  points: RoutePoint[];
  zoomRange: { from: number; to: number; } | null;
}) => RouteChartRows;
```

```ts
// apps/web/src/components/studio/hooks/useStudioMapPopup.ts
export interface StudioMapPopup {
  popup: StudioTrackPickInfo | null;
  onClick: (info: PickingInfo) => void;
  close: () => void;
}
export const useStudioMapPopup: () => StudioMapPopup;
```

```ts
// apps/web/src/components/studio/hooks/useStudioMarkerForm.ts
export const useStudioMarkerForm: (route: StudioRoute) => StudioMarkerForm;
```

```ts
// apps/web/src/components/studio/hooks/useStudioRouteExport.ts
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
// apps/web/src/components/studio/hooks/useStudioRoutesPopup.ts
export interface StudioRoutesPopup {
  popup: StudioRoutesPopupInfo | null;
  onClick: (info: PickingInfo) => void;
  close: () => void;
}
export const useStudioRoutesPopup: (mapRef: React.RefObject<MapRef | null>) => StudioRoutesPopup;
```

```ts
// apps/web/src/components/studio/hooks/useStudioTrackPickSegment.ts
export const useStudioTrackPickSegment: (info: StudioTrackPickInfo) => StudioTrackPickSegment;
```

```ts
// apps/web/src/components/studio/index.tsx
export const Studio: FC;
```

```ts
// apps/web/src/components/studio/markers/AddMarkerButton.tsx
export const AddMarkerButton: FC<AddMarkerButtonProps>;
```

```ts
// apps/web/src/components/studio/markers/MarkerRow.tsx
export const MarkerRow: FC<MarkerRowProps>;
```

```ts
// apps/web/src/components/studio/markers/StudioMarkerDialog.tsx
export const StudioMarkerDialog: FC<StudioMarkerDialogProps>;
```

```ts
// apps/web/src/components/studio/markers/StudioMarkerPins.tsx
export const StudioMarkerPins: FC<StudioMarkerPinsProps>;
```

```ts
// apps/web/src/components/studio/markers/StudioRoutesPickPopup.tsx
export const StudioRoutesPickPopup: FC<StudioRoutesPickPopupProps>;
```

```ts
// apps/web/src/components/studio/markers/StudioTrackPickPopup.tsx
export const StudioTrackPickPopup: FC<StudioTrackPickPopupProps>;
```

```ts
// apps/web/src/components/studio/markers/routeSegments.ts
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
// apps/web/src/components/studio/routeColors.ts
export const COLORS_BY_STUDIO_ROUTE_COLOR: Record<StudioRouteColor, RouteColorValue>;
export const routeColorOrder: StudioRouteColor[];
export const nextRouteColor: (used: StudioRouteColor[]) => StudioRouteColor;
```

```ts
// apps/web/src/components/studio/routeStats.ts
export const formatRouteStatsLine: (route: StudioRoute) => string;
```

```ts
// apps/web/src/components/studio/studioSnackbars.ts
export const STUDIO_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/components/studio/types.ts
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
// apps/web/src/components/trips/DeleteTripDialog.tsx
export const DeleteTripDialog: FC<DeleteTripDialogProps>;
```

```ts
// apps/web/src/components/trips/ManageTripDialog.tsx
export const ManageTripDialog: FC<ManageTripDialogProps>;
```

```ts
// apps/web/src/components/trips/TripActionsMenu.tsx
export const TripActionsMenu: FC<TripActionsMenuProps>;
```

```ts
// apps/web/src/components/trips/TripBadge.tsx
export const TripBadge: FC;
```

```ts
// apps/web/src/components/trips/TripDetail.tsx
export const TripDetail: FC<TripDetailProps>;
```

```ts
// apps/web/src/components/trips/TripFormDialog.tsx
export const TripFormDialog: FC<TripFormDialogProps>;
```

```ts
// apps/web/src/components/trips/TripHeader.tsx
export const TripHeader: FC<TripHeaderProps>;
```

```ts
// apps/web/src/components/trips/TripItem.tsx
export const TripItem: FC<TripItemProps>;
```

```ts
// apps/web/src/components/trips/TripPeek.tsx
export const TripPeek: FC<TripPeekProps>;
```

```ts
// apps/web/src/components/trips/TripStatsGrid.tsx
export const TripStatsGrid: FC<TripStatsGridProps>;
```

```ts
// apps/web/src/components/trips/TripsTab.tsx
export const TripsTab: FC;
```

```ts
// apps/web/src/components/trips/hooks/useTripDraft.ts
export const useTripDraft: ({ open, trip, }: { open: boolean; trip: Trip | undefined; }) => TripDraft;
```

```ts
// apps/web/src/components/trips/hooks/useTripMapFocusEffect.ts
export const useTripMapFocusEffect: (sessionIds: string[] | undefined) => void;
```

```ts
// apps/web/src/components/trips/hooks/useTripSessionPicker.ts
export const useTripSessionPicker: (showAll: boolean) => TripSessionPicker;
```

```ts
// apps/web/src/components/trips/hooks/useTripSessions.ts
export const useTripSessions: (trip: Trip) => TrainingSession[];
```

```ts
// apps/web/src/components/trips/index.tsx
export const Trips: FC;
```

```ts
// apps/web/src/components/trips/tripStats.ts
export const computeTripTotals: (sessions: TrainingSession[]) => TripTotals;
export const formatTripStatsLine: (totals: TripTotals) => string;
```

```ts
// apps/web/src/lib/analysis/gpsTrack.ts
export const encodedSegmentPolylines: (points: RoutePoint[]) => string[];
export const buildSessionGPS: ({ sessionId, records, }: { sessionId: string; records: SessionRecord[]; }) => SessionGPS | null;
export const decodeTrackForRendering: (encodedPolyline: string) => [number, number][];
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
// apps/web/src/lib/analysis/moreStats.ts
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
// apps/web/src/lib/analysis/movingTime.ts
export const movingSeconds: (records: SessionRecord[]) => number[];
export const sessionMovingTime: (records: SessionRecord[]) => { movingS: number; elapsedS: number; } | undefined;
```

```ts
// apps/web/src/lib/analysis/recomputeTrainingLoad.ts
export const recomputeTrainingLoad: () => Promise<number>;
```

```ts
// apps/web/src/lib/analysis/records.ts
export const PB_SLOTS_BY_SPORT: Record<Sport, { category: PBCategory; window: number; }[]>;
export const extractPeakPower: (records: SessionRecord[]) => Map<number, number>;
export const groupPBsBySport: (pbs: PersonalBest[]) => Partial<Record<Sport, PersonalBest[]>>;
export const computePBsForSessions: ({ sessions, existing, }: {
  sessions: PBSessionInput[];
  existing?: PersonalBest[];
}) => PersonalBest[];
```

```ts
// apps/web/src/lib/analysis/reprocessSessions.ts
export const SESSION_REPROCESSING_LOCK: "pacevault-session-reprocessing";
export const REPROCESS_BATCH_SIZE: any;
export const reprocessOutdatedSessions: () => Promise<number>;
```

```ts
// apps/web/src/lib/analysis/sessionStress.ts
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
// apps/web/src/lib/analysis/thresholdsAt.ts
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
// apps/web/src/lib/analysis/webLock.ts
export const withExclusiveLock: <T>(name: string, task: () => Promise<T>) => Promise<T>;
```

```ts
// apps/web/src/lib/api/fetchResponse.ts
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
// apps/web/src/lib/api/intervals.ts
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
// apps/web/src/lib/api/intervalsImport.ts
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
// apps/web/src/lib/api/intervalsSync.ts
export const runIntervalsSync: (options: {
  queryClient: QueryClient;
  apiKey: string | null;
  full?: boolean;
  foreground?: boolean;
}) => Promise<IntervalsSyncSummary>;
```

```ts
// apps/web/src/lib/api/weather.ts
export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm';
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
// apps/web/src/lib/colors/chartTheme.ts
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
// apps/web/src/lib/colors/colorModes.ts
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
// apps/web/src/lib/colors/speedScale.ts
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
// apps/web/src/lib/colors/zoneColors.ts
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
export const PALETTE_BY_ZONE_METRIC: Record<ZoneMetric, string[]>;
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
// apps/web/src/lib/debug/crashReport.ts
export const buildIssueUrl: (error: unknown) => string;
```

```ts
// apps/web/src/lib/debug/migrationCommands.ts
export const migrationCommands: { rerunMigration: ({ count }?: { count?: number; }) => Promise<void>; };
```

```ts
// apps/web/src/lib/debug/pvDebug.ts
export const registerPvDebug: () => void;
```

```ts
// apps/web/src/lib/demo/demoRecords.ts
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
// apps/web/src/lib/demo/demoSchedule.ts
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
// apps/web/src/lib/demo/previewDrawIn.ts
export const buildPreviewPasses: (routes: PreviewRoute[]) => PreviewPasses;
export const previewDrawInEnd: (passes: PreviewPass[]) => number;
export const slicePath: ({ pass, elapsedMs, }: { pass: PreviewPass; elapsedMs: number; }) => [number, number][];
```

```ts
// apps/web/src/lib/demo/seededRandom.ts
export interface SeededRandom {
  next: () => number;
  between: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  uuid: () => string;
}
export const createSeededRandom: (seed: number) => SeededRandom;
```

```ts
// apps/web/src/lib/filtering/dashboardVolume.ts
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
export const DASHBOARD_Y_AXIS_WIDTH: any;
```

```ts
// apps/web/src/lib/filtering/filters.ts
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
export const interpretFilterText: ({ text, now, }: { text: string; now: number; }) => FilterCriteria[];
```

```ts
// apps/web/src/lib/filtering/loadAxis.ts
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
// apps/web/src/lib/filtering/timeRange.ts
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
// apps/web/src/lib/filtering/weekKey.ts
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
// apps/web/src/lib/format/formatters.ts
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
// apps/web/src/lib/format/snackbar.ts
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
// apps/web/src/lib/hooks/useSnackbar.ts
export interface Snackbar {
  enqueueSnackbar: (entry: SnackbarEntry) => void;
  closeSnackbar: (key: string) => void;
}
export const useSnackbar: () => Snackbar;
```

```ts
// apps/web/src/lib/storage/createIngestBatcher.ts
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
// apps/web/src/lib/storage/guardedSessionsStorage.ts
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
// apps/web/src/lib/storage/persistentStorage.ts
export const requestPersistentStorage: () => Promise<boolean>;
```

```ts
// apps/web/src/lib/storage/recordCodec.ts
export type EncodedRecords = { format: 'gzip-json'; data: ArrayBuffer };
export const encodeRecords: (records: SessionRecord[]) => Promise<EncodedRecords>;
export const decodeRecords: (value: unknown) => Promise<SessionRecord[]>;
```

```ts
// apps/web/src/lib/storage/storageBreakdown.ts
export const breakdownStorage: ({ storeBytes, totalBytes, }: {
  storeBytes: Partial<Record<IdbStoreName, number>>;
  totalBytes: number | undefined;
}) => Record<StorageCategory, number>;
```

```ts
// apps/web/src/lib/workers/gpsBuild.worker.ts
// no exports
```

```ts
// apps/web/src/lib/workers/gpsBuildContract.ts
export const workerMessageInSchema: z.ZodObject<{ type: z.ZodLiteral<"build">; sessionIds: z.ZodArray<z.ZodString>; }, z.core.$strip>;
export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;
export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
```

```ts
// apps/web/src/lib/workers/personalBests.worker.ts
// no exports
```

```ts
// apps/web/src/lib/workers/personalBestsContract.ts
export type PBSessionMeta = z.infer<typeof pbSessionMetaSchema>;
export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;
export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
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
// apps/web/src/microcopy/intervals.ts
export const MESSAGE_BY_INTERVALS_ERROR: Record<IntervalsErrorCode, () => string>;
```

```ts
// apps/web/src/microcopy/moreStats.ts
export const LABEL_BY_MORE_STATS_TOPIC: Record<MoreStatsTopic, () => string>;
export const LABEL_BY_STRESS_METHOD: Record<TrainingSession, () => string>;
export const LABEL_BY_ENERGY_BLOCKER: Record<EnergyBlocker, () => string>;
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
// apps/web/src/microcopy/volume.ts
export const LABEL_BY_VOLUME_METRIC: Record<VolumeMetric, () => string>;
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
// apps/web/src/parsers/filename.ts
export const extractSessionName: (filename: string) => string | undefined;
```

```ts
// apps/web/src/parsers/fingerprint.ts
export const generateFingerprint: ({ fileId, fallback, }: { fileId: FitFileId | undefined; fallback: FallbackFields; }) => string;
export const findDuplicates: ({ fingerprints, existingSessions, }: {
  fingerprints: string[];
  existingSessions: TrainingSession[];
}) => Set<string>;
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
// apps/web/src/parsers/fitParseProfile.ts
export const toFitParseProfile: (profile: UserProfile) => (date: number) => FitParseProfile;
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
// apps/web/src/queries/queryClient.ts
export const createQueryClient: (config?: QueryClientConfig) => QueryClient;
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
export const sessionGpsQueryKey: (options?: { sessionId?: string; }) => string[];
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
export const sessionGpsTracksQueryKey: (options?: { detailedSessionIds?: string[]; }) => string[];
export const useSessionGpsTracks: () => UseQueryResult<QueryResults["sessionGpsTracks"]>;
```

```ts
// apps/web/src/queries/sessions/useSessionLaps.ts
export const loadSessionLaps: (options: { sessionId: string; }) => Promise<QueryResults["sessionLaps"]>;
export const sessionLapsQueryKey: (options?: { sessionId?: string; }) => string[];
export const useSessionLaps: (options: { sessionId: string; enabled: boolean; }) => UseQueryResult<QueryResults["sessionLaps"]>;
```

```ts
// apps/web/src/queries/sessions/useSessionRecords.ts
export const loadSessionRecords: (options: { sessionId: string; }) => Promise<QueryResults["sessionRecords"]>;
export const sessionRecordsQueryKey: (options?: { sessionId?: string; }) => string[];
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
export const measureStorageBreakdown: () => Promise<QueryResults["storageBreakdown"]>;
export const storageBreakdownQueryKey: (options: { sessionCount: number; }) => (string | number)[];
export const useStorageBreakdown: (options: { sessionCount: number; }) => UseQueryResult<QueryResults["storageBreakdown"]>;
```

```ts
// apps/web/src/queries/studio/useStudioRoutePoints.ts
export const loadStudioRoutePoints: (options: { routeId: string; }) => Promise<QueryResults["studioRoutePoints"]>;
export const studioRoutePointsQueryKey: (options?: { routeId?: string; }) => string[];
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
// apps/web/src/routing/AppRoutes.tsx
export const AppRoutes: FC;
```

```ts
// apps/web/src/routing/labsTab.ts
export type LabsTab = (typeof LABS_TABS)[number];
export const resolveLabsTab: (rawTab: string | null) => LabsTab;
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
export const PATTERN_BY_PAGE: {
  dashboard: string;
  sessions: string;
  sessionDetail: string;
  tripDetail: string;
  studioDetail: string;
  labs: string;
  settings: string;
};
export const URL_BY_PAGE: {
  dashboard: (_params: NoParams) => string;
  sessions: (params: { tab?: SessionsTab; }) => string;
  sessionDetail: (params: { sessionId: string; }) => string;
  tripDetail: (params: { tripId: string; }) => string;
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
// apps/web/src/routing/useCurrentPage.ts
export const useCurrentPage: () => SupportedPage | null;
```

```ts
// apps/web/src/routing/useRouteMatch.ts
export interface RouteMatch {
  id: string | undefined;
}
export const useRouteMatch: (page: SupportedPage) => RouteMatch | null;
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
// apps/web/src/store/hooks/useSessionReprocessingActive.ts
export const useSessionReprocessingActive: () => boolean;
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
// apps/web/src/store/mapPreferences.ts
export const TRACK_INTENSITIES: readonly ["faint", "warm", "hot"];
export type TrackIntensity = (typeof TRACK_INTENSITIES)[number];
export const INITIAL_MAP_PREFERENCES_STORE_STATE: Pick<MapPreferencesState, "trackIntensity" | "bySport">;
export const useMapPreferencesStore: UseBoundStore<WithPersist<WithImmer<StoreApi<MapPreferencesState>>, unknown>>;
```

```ts
// apps/web/src/store/onboarding.ts
export type OnboardingStep = 'intro' | 'source' | 'you' | 'thresholds' | 'import';
export type OnboardingSource = 'intervals' | 'fit';
export const ONBOARDING_FLOW_STEPS: OnboardingStep[];
export const useOnboardingStore: UseBoundStore<WithImmer<StoreApi<OnboardingState>>>;
export const onboardingProgressOf: (step: OnboardingStep) => number;
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
export const INITIAL_STUDIO_STORE_STATE: Pick<StudioState, "routes">;
export const useStudioStore: UseBoundStore<WithPersist<WithImmer<StoreApi<StudioState>>, unknown>>;
```

```ts
// apps/web/src/store/studioMarkerEditor.ts
export const useStudioMarkerEditorStore: UseBoundStore<StoreApi<StudioMarkerEditorState>>;
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
export const INITIAL_USER_STORE_STATE: Pick<UserState, "profile">;
export const useUserStore: UseBoundStore<WithPersist<WithImmer<StoreApi<UserState>>, unknown>>;
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
// apps/web/tests/components/charts/chartData.buckets.spec.ts
// no exports
```

```ts
// apps/web/tests/components/charts/chartData.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/charts/chartData.spec.ts
// no exports
```

```ts
// apps/web/tests/components/charts/hooks/useChartZoom.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/charts/seriesSummary.spec.ts
// no exports
```

```ts
// apps/web/tests/components/dashboard/coachingMessages.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/dashboard/coachingMessages.spec.ts
// no exports
```

```ts
// apps/web/tests/components/dashboard/dashboardDate.spec.ts
// no exports
```

```ts
// apps/web/tests/components/dashboard/hooks/useFilteredMetrics.spec.ts
// no exports
```

```ts
// apps/web/tests/components/dashboard/statusColors.spec.ts
// no exports
```

```ts
// apps/web/tests/components/demo/buildDemoDataset.spec.ts
// no exports
```

```ts
// apps/web/tests/components/labs/groupSteps.spec.ts
// no exports
```

```ts
// apps/web/tests/components/labs/prescription.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/fitPadding.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/hooks/useMapHover.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/hooks/useMapRendererHandOver.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/hooks/useMapTracks.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/lapPath.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/mapCamera.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/terrainCamera.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/terrainLine.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/trackPicking.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/trackSmoothing.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/zoneColoredPath.spec.ts
// no exports
```

```ts
// apps/web/tests/components/metricLabel/explanations.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/archive.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/charts/railRange.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/charts/recordExtremes.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/gpxExport.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/session/lapLabels.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/session/sensorWarningText.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/session/sessionFitness.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/session/validation.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/session/validation.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/session/windRoseSectors.spec.ts
// no exports
```

```ts
// apps/web/tests/components/sessions/sessionTitleFormatter.spec.ts
// no exports
```

```ts
// apps/web/tests/components/settings/profileHistory.spec.ts
// no exports
```

```ts
// apps/web/tests/components/settings/thresholdFieldErrors.spec.ts
// no exports
```

```ts
// apps/web/tests/components/studio/markers/routeSegments.spec.ts
// no exports
```

```ts
// apps/web/tests/components/studio/routeColors.spec.ts
// no exports
```

```ts
// apps/web/tests/components/trips/tripStats.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/gpsTrack.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/laps.dynamic.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/laps.effort.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/laps.lapSet.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/laps.ranges.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/laps.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/laps.summary.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/moreStats.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/movingTime.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/recomputeTrainingLoad.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/records.computePbsForSessions.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/records.groupPbsBySport.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/reprocessSessions.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/thresholdsAt.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/api/intervals.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/api/intervals.syncWindow.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/api/intervalsImport.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/api/intervalsSync.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/api/weather.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/api/weather.summary.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/colors/chartTheme.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/colors/colorModes.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/colors/speedScale.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/colors/zoneColors.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/debug/crashReport.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/demo/previewDrawIn.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filtering/dashboardVolume.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filtering/filters.attributes.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filtering/filters.grammar.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filtering/filters.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filtering/loadAxis.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filtering/timeRange.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/filtering/weekKey.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/format/formatters.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/hooks/useSnackbar.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/storage/createIngestBatcher.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/storage/db.deleteAllData.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/storage/db.indexeddb.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/storage/db.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/storage/db.studioPoints.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/storage/recordCodec.spec.ts
// no exports
```

```ts
// apps/web/tests/parsers/filename.spec.ts
// no exports
```

```ts
// apps/web/tests/parsers/fingerprint.spec.ts
// no exports
```

```ts
// apps/web/tests/parsers/fit.thresholds.integration.spec.ts
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
// apps/web/tests/routing/labsTab.spec.ts
// no exports
```

```ts
// apps/web/tests/setup.ts
// no exports
```

```ts
// apps/web/tests/store/filters.spec.ts
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
// apps/web/tests/store/user.integration.spec.ts
// no exports
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
// apps/web/vitest.config.ts
export default UserConfig;
```

```ts
// packages/engine/src/cadence.ts
export const stepsPerMinute: (strideCadence: number) => number;
export const coastingDurationSec: (records: SessionRecord[]) => number | undefined;
export const stepLength: (records: SessionRecord[]) => StepLength | undefined | null;
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
// packages/engine/src/recordPairs.ts
export const MAX_MOVING_PAIR_GAP_SEC: 10;
export const activeDurationSec: ({ previous, current, }: { previous: SessionRecord; current: SessionRecord; }) => number;
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
// packages/engine/tests/cadence.spec.ts
// no exports
```

```ts
// packages/ui/src/components/pvActionsMenu/PvActionsMenuSheetRow.tsx
export const PvActionsMenuSheetRow: FC<PvActionsMenuSheetRowProps>;
```

```ts
// packages/ui/src/components/pvBottomSheet/PvBottomSheetProvider.tsx
export const useSheetScrollContext: () => SheetScrollContextValue;
export const useUnstableSheetScrollContext: () => SheetScrollContextValue | undefined;
export const useSheetAboveContext: () => SheetAboveContextValue;
export const useUnstableSheetAboveContext: () => SheetAboveContextValue | undefined;
export const useSheetPeekContext: () => SheetPeekContextValue;
export const useUnstableSheetPeekContext: () => SheetPeekContextValue | undefined;
export const PvBottomSheetProvider: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// packages/ui/src/components/pvBottomSheet/types.ts
export interface SheetAboveMotion {
  y: MotionValue<number>;
  height: number;
}
```

```ts
// packages/ui/src/components/pvChartsCard/PvChartRow.tsx
export const PvChartRow: FC<PvChartRowProps>;
```

```ts
// packages/ui/src/components/pvCollapsibleHeader/PvCollapsibleHeader.tsx
export const PvCollapsibleHeader: FC<PvCollapsibleHeaderProps>;
```

```ts
// packages/ui/src/components/pvExternalLink/PvExternalLink.tsx
export const PvExternalLink: FC<PvExternalLinkProps>;
```

```ts
// packages/ui/src/components/pvSegmentedControl/PvSegmentedControl.tsx
export const PvSegmentedControl: FC<PvSegmentedControlProps>;
```

```ts
// packages/ui/src/hooks/useDevice.ts
export const useDevice: () => Device;
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
// packages/ui/src/lib/mediaQueries.ts
export const DESKTOP_MEDIA_QUERY: "(min-width: 1024px)";
export const FINE_POINTER_QUERY: "(hover: hover) and (pointer: fine)";
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
// packages/ui/vitest.config.ts
export default UserConfig;
```

```ts
// tools/workbench/scripts/boundaries.ts
// no exports
```

```ts
// tools/workbench/scripts/colocation.ts
export type SingleOwnerModule = { module: string; owner: string };
export const singleOwnerLibModules: (modules: DepsInput["modules"]) => SingleOwnerModule[];
export const libModuleCount: (modules: DepsInput["modules"]) => number;
export const colocationLine: (found: SingleOwnerModule[], libModules: number) => string;
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
// tools/workbench/scripts/themeTokens.ts
export interface ThemeLiteral {
  line: number;
  match: string;
  check: 'hex' | 'rgb' | 'px';
}
export const findThemeLiterals: (source: string) => ThemeLiteral[];
```

```ts
// tools/workbench/site/src/app/BoardPage.tsx
export const BoardPage: FC;
```

```ts
// tools/workbench/site/src/app/Columns.tsx
export const Columns: FC<ColumnsProps>;
```

```ts
// tools/workbench/site/src/app/hooks/useBoardChangedEffect.ts
export const useBoardChangedEffect: () => void;
```

```ts
// tools/workbench/site/src/app/hooks/useMockupQuestionsMessageEffect.ts
export const useMockupQuestionsMessageEffect: ({ frame, questionStates, }: {
  frame: RefObject<HTMLIFrameElement | null>;
  questionStates: string;
}) => void;
```

```ts
// tools/workbench/site/src/app/hooks/usePanelState.ts
export type PanelContent =
  | { kind: 'item'; folder: string; tab: Slot }
  | { kind: 'guide' }
  | undefined;
export const usePanelState: (items: BoardItem[] | undefined) => PanelState;
```

```ts
// tools/workbench/site/src/app/hooks/useTechDiagramsEffect.ts
export const useTechDiagramsEffect: ({ pane, techHtml, actualHtml, folder, expand, }: {
  pane: RefObject<HTMLDivElement | null>;
  techHtml: string | undefined;
  actualHtml: string;
  folder: string;
  expand: (frame: HTMLElement) => void;
}) => void;
```

```ts
// tools/workbench/site/src/app/hooks/useTechRefitEffect.ts
export const useTechRefitEffect: ({ pane, expanded, active, }: {
  pane: RefObject<HTMLDivElement | null>;
  expanded: boolean;
  active: boolean;
}) => void;
```

```ts
// tools/workbench/site/src/app/hooks/useWriteCardCloseTimer.ts
export const useWriteCardCloseTimer: ({ latestId, hide, }: {
  latestId: number | undefined;
  hide: (id: number) => void;
}) => WriteCardHoverHandlers;
```

```ts
// tools/workbench/site/src/app/hooks/useWriteMutation.ts
export const useWriteMutation: ({ inline }?: { inline?: boolean; }) => UseMutationResult<WriteResult, unknown, WriteInput>;
```

```ts
// tools/workbench/site/src/app/panelTabs.ts
export const tabFor: ({ item, asked }: { item: BoardItem; asked: Slot | undefined; }) => Slot;
```

```ts
// tools/workbench/site/src/lib/boardChangedContract.ts
export type BoardChangedPayload = z.infer<typeof boardChangedPayloadSchema>;
```

```ts
// tools/workbench/site/src/lib/devPlugin.ts
export const serverModulePath: ({ workbench, path, }: { workbench: string; path: string; }) => string | undefined;
export const workbenchFiles: ({ root, guideFile, }: { root: string; guideFile: string; }) => Plugin;
```

```ts
// tools/workbench/tests/scripts/colocation.spec.ts
// no exports
```

```ts
// tools/workbench/tests/scripts/deps.spec.ts
// no exports
```

```ts
// tools/workbench/tests/scripts/changedFiles.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/tests/scripts/techFile.spec.ts · not planned
// no exports
```

## Missing

- `apps/web/tests/testUtils/defined.ts`: planned, not changed
- `packages/ui/src/components/ResponsivePopoverHeading.tsx`: planned, not changed
- `tools/workbench/tests/scripts/themeTokens.spec.ts`: planned, not changed
- `packages/testing/`: planned, not changed
- `tools/docs/`: planned, not changed
- `vite.config.ts`: planned, not changed
