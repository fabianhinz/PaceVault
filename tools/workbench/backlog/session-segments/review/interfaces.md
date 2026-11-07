# Interfaces · session-segments

Generated 2026-11-07 by `vp run workbench:deps -- session-segments` from the TypeScript files changed since the base (as `files.json`): 179 planned, 42 not planned. The checker's types; compare with tech.md `## Interfaces`, the planned record.

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
// apps/web/src/components/charts/SeriesRail.tsx
export const SeriesRail: FC<SeriesRailProps>;
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
// apps/web/src/components/layout/VirtualItemList.tsx
export const VirtualItemList: <T>(props: VirtualItemListProps<T>) => ReactNode;
```

```ts
// apps/web/src/components/mapBackground/DeckGLOverlay.tsx
export const DeckGLOverlay: FC<DeckGLOverlayProps>;
```

```ts
// apps/web/src/components/mapBackground/hooks/useDetailLayers.ts
export const useDetailLayers: ({ terrain, eventHandlers, }: {
  terrain: boolean;
  eventHandlers: DeckEventHandlers;
}) => DetailLayers;
```

```ts
// apps/web/src/components/mapBackground/hooks/useGeolocationCameraEffect.ts
export const useGeolocationCameraEffect: ({ mapRef, sessionControls, }: {
  mapRef: React.RefObject<MapRef | null>;
  sessionControls: boolean;
}) => void;
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
export const useMapHover: (target: MapHoverTarget | null) => MapHoverHandlers;
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
// apps/web/src/components/mapBackground/hooks/useMapScene.ts
export const useMapScene: () => MapScene;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapTracks.ts
export const useMapTracks: (gpsData: SessionGPS[] | null) => MapTrack[];
```

```ts
// apps/web/src/components/mapBackground/hooks/useOpenedSessionEffect.ts
export const useOpenedSessionEffect: (sessionId: string | null) => void;
```

```ts
// apps/web/src/components/mapBackground/hooks/usePickLayers.ts
export const usePickLayers: (terrain: boolean) => PickLayers;
```

```ts
// apps/web/src/components/mapBackground/hooks/useSegmentLayers.ts
export const useSegmentLayers: () => LayersList;
```

```ts
// apps/web/src/components/mapBackground/hooks/useSegmentMapTracks.ts
export const useSegmentMapTracks: () => SegmentMapTracks;
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
// apps/web/src/components/mapBackground/mapPadding.ts
export const MAP_FIT_MARGIN: 80;
export const MAP_CONTROLS_HEIGHT: 44;
export const MAP_CONTROLS_BOTTOM: 40;
export const mapPadding: (margin: number, options?: MapPaddingOptions) => MapPadding;
```

```ts
// apps/web/src/components/mapBackground/mapScene.ts
export type MapScene =
  | { kind: 'overview'; key: string }
  | { kind: 'trip'; key: string; sessionIds: string[] }
  | { kind: 'session'; key: string; sessionId: string }
  | { kind: 'segmentTab'; key: string }
  | { kind: 'segmentPage'; key: string; segmentId: string }
  | { kind: 'studioTab'; key: string }
  | { kind: 'studioRoute'; key: string; routeId: string };
export type MapSceneKind = MapScene['kind'];
export const mapSceneOf: (route: MapSceneRoute) => MapScene;
export const sceneSessionId: (scene: MapScene) => string | null;
export const sceneSegmentId: (scene: MapScene) => string | null;
export const sceneStudioRouteId: (scene: MapScene) => string | null;
export const sceneTripSessionIds: (scene: MapScene) => string[];
export const sceneHoveredId: ({ hover, sceneKey, kind, }: {
  hover: MapHover | null;
  sceneKey: string;
  kind: MapHoverKind;
}) => string | null;
export const sceneHoveredSpan: ({ hover, sceneKey, }: { hover: MapHover | null; sceneKey: string; }) => RecordSpan | null;
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
export const HOVER_MARKER_RADIUS_PX: 12;
export const HOVER_MARKER_RING_WIDTH_PX: 4;
export const HOVER_MARKER_RING_COLOR: [number, number, number, number];
export const HOVER_MARKER_FILL_COLOR: [number, number, number, number];
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
// apps/web/src/components/segments/BestCrown.tsx
export const BestCrown: FC<BestCrownProps>;
```

```ts
// apps/web/src/components/segments/BestHighlight.tsx
export const BestHighlight: FC<BestHighlightProps>;
```

```ts
// apps/web/src/components/segments/CreateSegmentDialog.tsx
export const CreateSegmentDialog: FC<CreateSegmentDialogProps>;
```

```ts
// apps/web/src/components/segments/DeleteSegmentDialog.tsx
export const DeleteSegmentDialog: FC<DeleteSegmentDialogProps>;
```

```ts
// apps/web/src/components/segments/PassItem.tsx
export const PassItem: FC<PassItemProps>;
```

```ts
// apps/web/src/components/segments/PassStrip.tsx
export const PassStrip: FC<PassStripProps>;
```

```ts
// apps/web/src/components/segments/PassStripSkeleton.tsx
export const PassStripSkeleton: FC;
```

```ts
// apps/web/src/components/segments/PassTile.tsx
export const PassTile: FC<PassTileProps>;
```

```ts
// apps/web/src/components/segments/SaveSegmentPill.tsx
export const SaveSegmentPill: FC<SaveSegmentPillProps>;
```

```ts
// apps/web/src/components/segments/SegmentActionsMenu.tsx
export const SegmentActionsMenu: FC<SegmentActionsMenuProps>;
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
// apps/web/src/components/segments/SegmentItemSkeleton.tsx
export const SegmentItemSkeleton: FC;
```

```ts
// apps/web/src/components/segments/SegmentNameDialog.tsx
export const SegmentNameDialog: FC<SegmentNameDialogProps>;
```

```ts
// apps/web/src/components/segments/SegmentPassesNote.tsx
export const SegmentPassesNote: FC;
```

```ts
// apps/web/src/components/segments/SegmentPeek.tsx
export const SegmentPeek: FC<SegmentPeekProps>;
```

```ts
// apps/web/src/components/segments/SegmentsEmpty.tsx
export const SegmentsEmpty: FC;
```

```ts
// apps/web/src/components/segments/SegmentsTab.tsx
export const SegmentsTab: FC;
```

```ts
// apps/web/src/components/segments/charts/SegmentChannelChart.tsx
export const SegmentChannelChart: FC<SegmentChannelChartProps>;
```

```ts
// apps/web/src/components/segments/charts/SegmentChannelRail.tsx
export const SegmentChannelRail: FC<SegmentChannelRailProps>;
```

```ts
// apps/web/src/components/segments/charts/SegmentChartsExplorer.tsx
export const SegmentChartsExplorer: FC<SegmentChartsExplorerProps>;
```

```ts
// apps/web/src/components/segments/charts/SegmentExplorerFrame.tsx
export const SegmentExplorerFrame: FC<SegmentExplorerFrameProps>;
```

```ts
// apps/web/src/components/segments/charts/hooks/useSegmentChartRows.ts
export const useSegmentChartRows: ({ segment, selected, best, }: {
  segment: MatchedSegment;
  selected: StoredSegmentPass;
  best: StoredSegmentPass;
}) => SegmentChartSeries;
```

```ts
// apps/web/src/components/segments/charts/segmentChannels.ts
export const SPEC_BY_SEGMENT_CHANNEL: Record<"hr" | "power" | "speed" | "pace" | "gap" | "elevation" | "grade" | "cadence", ChannelSpec>;
export const channelIcon: ({ channel, sport, }: { channel: SegmentChannel; sport: Sport; }) => LucideIcon;
export const channelUnit: ({ channel, sport, }: { channel: SegmentChannel; sport: Sport; }) => string;
```

```ts
// apps/web/src/components/segments/charts/segmentChartRows.ts
export const SEGMENT_CHANNELS: readonly ["hr", "power", "speed", "pace", "gap", "elevation", "grade", "cadence"];
export type SegmentChannel = (typeof SEGMENT_CHANNELS)[number];
export interface PassSeries {
  movingSec: number[];
  positions: Array<[number, number] | null>;
  values: Record<SegmentChannel, Array<number | null>>;
}
export const SECONDS_PER_MINUTE: 60;
export const passSeries: ({ records, pass, running, }: {
  records: SessionRecord[];
  pass: StoredSegmentPass;
  running: boolean;
}) => PassSeries;
export const valueAtMovingSec: ({ series, channel, movingSec, }: {
  series: PassSeries;
  channel: SegmentChannel;
  movingSec: number;
}) => number | null;
export const positionAtMovingSec: ({ series, movingSec, }: { series: PassSeries; movingSec: number; }) => [number, number] | null;
export const hasChannelValues: ({ series, channel, }: { series: PassSeries | undefined; channel: SegmentChannel; }) => boolean;
export const segmentChartRows: ({ selected, best, channel, }: {
  selected: PassSeries;
  best: PassSeries | undefined;
  channel: SegmentChannel;
}) => SegmentChartRow[];
```

```ts
// apps/web/src/components/segments/charts/segmentExplorerHover.ts
export const SEGMENT_HOVER_GROUP: "segment-detail";
export const hoverSegmentExplorer: ({ movingSec, selected, best, }: {
  movingSec: number | null;
  selected: PassSeries;
  best: PassSeries | undefined;
}) => void;
```

```ts
// apps/web/src/components/segments/hooks/useClearExplorerMarkersEffect.ts
export const useClearExplorerMarkersEffect: () => void;
```

```ts
// apps/web/src/components/segments/hooks/useFilteredSegments.ts
export const useFilteredSegments: () => MatchedSegment[] | undefined;
```

```ts
// apps/web/src/components/segments/hooks/useListExpansion.ts
export const useListExpansion: () => ListExpansion;
```

```ts
// apps/web/src/components/segments/hooks/useReferenceSegmentMenuEntry.ts
export const useReferenceSegmentMenuEntry: (session: TrainingSession) => ReferenceSegmentMenuEntry;
```

```ts
// apps/web/src/components/segments/hooks/useSaveSegment.ts
export const useSaveSegment: () => SaveSegment;
```

```ts
// apps/web/src/components/segments/hooks/useSegmentDetail.ts
export const useSegmentDetail: (segmentId: string | undefined) => SegmentDetailState;
```

```ts
// apps/web/src/components/segments/hooks/useSegmentPassSelection.ts
export const useSegmentPassSelection: (segment: MatchedSegment) => [string | null, (sessionId: string) => void];
```

```ts
// apps/web/src/components/segments/hooks/useSegmentTitle.ts
export const useSegmentTitle: (segment: Segment | MatchedSegment) => SegmentTitle;
```

```ts
// apps/web/src/components/segments/hooks/useSegments.ts
export const useSegments: () => MatchedSegment[] | undefined;
```

```ts
// apps/web/src/components/segments/hooks/useSessionReferenceSegment.ts
export const useSessionReferenceSegment: (session: TrainingSession) => SessionReferenceSegment;
```

```ts
// apps/web/src/components/segments/hooks/useSessionSegments.ts
export const useSessionSegments: (sessionId: string) => SessionSegment[] | undefined;
```

```ts
// apps/web/src/components/segments/hooks/useSimilarSegment.ts
export const useSimilarSegment: (segment: Segment | null) => Segment | undefined;
```

```ts
// apps/web/src/components/segments/index.tsx
export const Segments: FC;
```

```ts
// apps/web/src/components/segments/segmentCreation.ts
export const suggestedSegmentName: ({ session, kind, startMeters, endMeters, }: {
  session: TrainingSession;
  kind: SegmentSourceKind;
  startMeters: number;
  endMeters: number;
}) => string;
export const segmentDraft: ({ session, records, span, kind, }: {
  session: TrainingSession;
  records: SessionRecord[];
  span: RecordSpan;
  kind: SegmentSourceKind;
}) => Segment | null;
export const similarSegment: ({ segment, segments, }: { segment: Segment; segments: Segment[]; }) => Segment | undefined;
```

```ts
// apps/web/src/components/segments/segmentFacts.ts
export const segmentFacts: (segment: Pick<Segment, "distanceMeters" | "netElevationMeters">) => string[];
```

```ts
// apps/web/src/components/segments/segmentFilter.ts
export const segmentInFilter: ({ segment, sessionsById, criteria, now, keptSessionId, }: {
  segment: MatchedSegment;
  sessionsById: Map<string, TrainingSession>;
  criteria: FilterCriteria | null;
  now: number;
  keptSessionId: string | null;
}) => MatchedSegment;
export const segmentsInFilter: ({ segments, sessionsById, criteria, now, }: {
  segments: MatchedSegment[];
  sessionsById: Map<string, TrainingSession>;
  criteria: FilterCriteria | null;
  now: number;
}) => MatchedSegment[];
```

```ts
// apps/web/src/components/segments/segmentPasses.ts
export const bestPassOf: (segment: MatchedSegment) => StoredSegmentPass | undefined;
export const latestPassOf: (segment: MatchedSegment) => StoredSegmentPass | undefined;
export const passesByYear: (passes: StoredSegmentPass[]) => PassYear[];
export const passDotScale: (passes: StoredSegmentPass[]) => ((movingSec: number) => PlotStripPosition);
export interface SessionSegment {
  segment: MatchedSegment;
  pass: StoredSegmentPass;
  best: boolean;
}
export const sessionSegmentsInRideOrder: ({ segments, sessionId, }: { segments: MatchedSegment[]; sessionId: string; }) => SessionSegment[];
export const matchedSegment: ({ segment, entry, }: { segment: Segment; entry: SegmentPassesEntry; }) => MatchedSegment;
export const withPasses: ({ segment, passes, }: { segment: MatchedSegment; passes: StoredSegmentPass[]; }) => MatchedSegment;
export const byLastRidden: (a: MatchedSegment, b: MatchedSegment) => number;
```

```ts
// apps/web/src/components/segments/segmentsSnackbars.ts
export const SEGMENTS_SNACKBARS: SnackbarMap;
```

```ts
// apps/web/src/components/segments/types.ts
export interface MatchedSegment extends Segment {
  geometry: Array<[number, number]>;
  passes: StoredSegmentPass[];
  lastPassDate: number | null;
}
export const PASS_STRIP_SHELL_CLASS: any;
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
// apps/web/src/components/sessions/charts/SessionChartsExplorer.tsx
export const SessionChartsExplorer: FC<SessionChartsExplorerProps>;
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
export const recordSpanOfMinutes: ({ records, range, }: { records: SessionRecord[]; range: RailRange; }) => RecordSpan | null;
export const computeRangeStats: ({ records, range, terrain, }: {
  records: SessionRecord[];
  range: RailRange;
  terrain: SessionTerrain;
}) => RangeStats;
```

```ts
// apps/web/src/components/sessions/session/DeleteSessionDialog.tsx
export const DeleteSessionDialog: FC<DeleteSessionDialogProps>;
```

```ts
// apps/web/src/components/sessions/session/SegmentRideRail.tsx
export const SegmentRideRail: FC<SegmentRideRailProps>;
```

```ts
// apps/web/src/components/sessions/session/SegmentsRow.tsx
export const SegmentsRow: FC<SegmentsRowProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionActionsMenu.tsx
export const SessionActionsMenu: FC<SessionActionsMenuProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionSegmentItem.tsx
export const SessionSegmentItem: FC<SessionSegmentItemProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionSegmentList.tsx
export const SessionSegmentList: FC<SessionSegmentListProps>;
```

```ts
// apps/web/src/components/sessions/session/SessionSummaryCard.tsx
export const SessionSummaryCard: FC<SessionSummaryCardProps>;
```

```ts
// apps/web/src/components/sessions/session/hooks/useSessionLapsEffect.ts
export const useSessionLapsEffect: ({ records, laps, }: { records: SessionRecord[]; laps: SessionLap[]; }) => void;
```

```ts
// apps/web/src/components/settings/deleteAllData.ts
export const clearAllAppState: (queryClient: QueryClient) => void;
```

```ts
// apps/web/src/components/studio/StudioRouteItem.tsx
export const StudioRouteItem: FC<StudioRouteItemProps>;
```

```ts
// apps/web/src/components/trips/index.tsx
export const Trips: FC;
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
// apps/web/src/lib/analysis/movingTime.ts
export const movingSeconds: (records: SessionRecord[]) => number[];
export const sessionMovingTime: (records: SessionRecord[]) => { movingS: number; elapsedS: number; } | undefined;
export interface MovingClock {
  timestampsSec: number[];
  movingSec: number[];
}
export const movingClock: (records: SessionRecord[]) => MovingClock;
export const movingSecondsAt: ({ clock, timestampSec, }: { clock: MovingClock; timestampSec: number; }) => number | undefined;
```

```ts
// apps/web/src/lib/analysis/segmentMatching.ts
export interface CachedSessionTrack {
  track: SegmentTrack | undefined;
  clock: MovingClock;
}
export const segmentMatchSessions: (sessions: TrainingSession[]) => SegmentSessionMeta[];
export const sessionsKeyBySport: (sessions: SegmentSessionMeta[]) => Record<Sport, string>;
export const matchSegment: ({ segment, sessions, gpsBySessionId, tracks, ignoreCache, clockMs, }: MatchRun & {
  ignoreCache: boolean;
  clockMs?: ClockMs;
}) => Promise<SegmentMatch>;
```

```ts
// apps/web/src/lib/analysis/segmentPrefilter.ts
export const reachesSegmentEnds: ({ encodedPolyline, reference, }: {
  encodedPolyline: string;
  reference: SegmentReferencePoint[];
}) => boolean;
```

```ts
// apps/web/src/lib/debug/pvDebug.ts
export const registerPvDebug: () => void;
```

```ts
// apps/web/src/lib/debug/segmentMetrics.ts
export const segmentDebugMode: () => SegmentDebugMode;
export const latestSegmentMetrics: () => SegmentMatchingMetrics | null;
export const reportSegmentMetrics: (metrics: SegmentMatchingMetrics) => void;
```

```ts
// apps/web/src/lib/format/formatters.ts
export type DateFormatMode =
  | 'date'
  | 'date-time'
  | 'short'
  | 'day-month'
  | 'year'
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
  'segment-passes': {
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
export const getSegmentPassesEntry: (segmentId: string) => Promise<SegmentPassesEntry | undefined>;
export const saveSegmentPassesEntry: (entry: SegmentPassesEntry) => Promise<void>;
export const deleteSegmentPassesEntries: (segmentIds: string[]) => Promise<void>;
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
export const SEGMENT_MATCHER_VERSION: 2;
export type SegmentSessionMeta = z.infer<typeof segmentSessionMetaSchema>;
export type StoredSegmentPass = z.infer<typeof storedSegmentPassSchema>;
export const segmentPassesEntrySchema: z.ZodObject<{
  segmentId: z.ZodString;
  matcherVersion: z.ZodNumber;
  sourceSessionKey: z.ZodString;
  checkedSessionKeys: z.ZodArray<z.ZodString>;
  passes: z.ZodArray<z.ZodObject<{ sessionId: z.ZodString; date: z.ZodNumber; startTimestampSec: z.ZodNumber; endTimestampSec: z.ZodNumber; movingSec: z.ZodNumber; coverageRatio: z.ZodNumber; }, z.core.$strip>>;
}, z.core.$strip>;
export type SegmentPassesEntry = z.infer<typeof segmentPassesEntrySchema>;
export type SegmentMatchInput = z.infer<typeof segmentMatchInputSchema>;
export const workerMessageInSchema: z.ZodObject<{
  type: z.ZodLiteral<"match">;
  segments: z.ZodArray<z.ZodObject<{ segmentId: z.ZodString; sport: z.ZodEnum<{ [x: string]: any; }>; bounds: z.ZodObject<{ minLat: z.ZodNumber; maxLat: z.ZodNumber; minLng: z.ZodNumber; maxLng: z.ZodNumber; }, z.core.$strip>; source: z.ZodObject<{ sessionId: z.ZodString; startSec: z.ZodNumber; endSec: z.ZodNumber; }, z.core.$strip>; }, z.core.$strip>>;
  sessions: z.ZodArray<z.ZodObject<{ sessionId: z.ZodString; sport: z.ZodEnum<{ [x: string]: any; }>; date: z.ZodNumber; derivationVersion: z.ZodNumber; }, z.core.$strip>>;
  ignoreCache: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;
export type SegmentMatchMetrics = z.infer<typeof segmentMatchMetricsSchema>;
export type SegmentMatchingMetrics = z.infer<typeof segmentMatchingMetricsSchema>;
export const workerMessageOutSchema: z.ZodObject<{
  type: z.ZodLiteral<"done">;
  entries: z.ZodArray<z.ZodObject<{ segmentId: z.ZodString; matcherVersion: z.ZodNumber; sourceSessionKey: z.ZodString; checkedSessionKeys: z.ZodArray<z.ZodString>; passes: z.ZodArray<z.ZodObject<{ sessionId: z.ZodString; date: z.ZodNumber; startTimestampSec: z.ZodNumber; endTimestampSec: z.ZodNumber; movingSec: z.ZodNumber; coverageRatio: z.ZodNumber; }, z.core.$strip>>; }, z.core.$strip>>;
  metrics: z.ZodOptional<z.ZodObject<{ matcherVersion: z.ZodNumber; environment: z.ZodObject<{ hardwareConcurrency: z.ZodNullable<z.ZodNumber>; deviceMemoryGb: z.ZodNullable<z.ZodNumber>; userAgent: z.ZodString; }, z.core.$strip>; workerMs: z.ZodNumber; mainThreadMs: z.ZodNullable<z.ZodNumber>; sessionsRead: z.ZodNumber; segments: z.ZodArray<z.ZodObject<{ segmentId: z.ZodString; cache: z.ZodEnum<{ hit: "hit"; partial: "partial"; miss: "miss"; }>; missReason: z.ZodNullable<z.ZodEnum<{ matcherVersion: "matcherVersion"; noEntry: "noEntry"; sourceSession: "sourceSession"; forced: "forced"; }>>; sessionsChecked: z.ZodNumber; bboxCandidates: z.ZodNumber; recordsRead: z.ZodNumber; readMs: z.ZodNumber; matchMs: z.ZodNumber; referencePoints: z.ZodNumber; passes: z.ZodNumber; ms: z.ZodNumber; }, z.core.$strip>>; }, z.core.$strip>>;
}, z.core.$strip>;
export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
```

```ts
// apps/web/src/main.tsx
// no exports
```

```ts
// apps/web/src/microcopy/segments.ts
export const segmentCountLabel: (count: number) => string;
export const passCountLabel: (count: number) => string;
export const showMoreSegmentsLabel: (count: number) => string;
export const segmentRangeName: ({ name, startMeters, endMeters, }: {
  name: string;
  startMeters: number;
  endMeters: number;
}) => string;
export const sessionSegmentsDeleteLabel: (count: number) => string;
export const passTileLabel: ({ date, time, best, }: { date: string; time: string; best: boolean; }) => string;
```

```ts
// apps/web/src/mutations/segments/useDeleteSegmentMutation.ts
export const useDeleteSegmentMutation: () => UseMutationResult<void, Error, { segmentId: string; }>;
```

```ts
// apps/web/src/mutations/sessions/useDeleteSessionMutation.ts
export const useDeleteSessionMutation: () => UseMutationResult<void, Error, { sessionId: string; segmentIds: string[]; }>;
```

```ts
// apps/web/src/pages/SegmentDetailPage.tsx
export const SegmentDetailPage: FC;
```

```ts
// apps/web/src/queries/segments/useSegmentPasses.ts
export const matchSegmentPasses: (options: {
  segments: SegmentMatchInput[];
  sessions: SegmentSessionMeta[];
  signal: AbortSignal;
}) => Promise<QueryResults["segmentPasses"]>;
export const segmentPassesQueryKey: (options?: { segmentIds?: string[]; sessionsKeys?: string[]; }) => string[];
export const useSegmentPasses: (options: { enabled: boolean; }) => UseQueryResult<QueryResults["segmentPasses"]>;
export const resetSegmentPasses: (queryClient: QueryClient) => Promise<void>;
```

```ts
// apps/web/src/queries/sessions/useSessionRecordSlices.ts
export const loadSessionRecordSlice: <T>({ sessionId, slice, }: {
  sessionId: string;
  slice: (input: { sessionId: string; records: SessionRecord[]; }) => T;
}) => Promise<T>;
export const sessionRecordSlicesQueryKey: (options?: { scope?: string; sessionId?: string; }) => string[];
export const useSessionRecordSlices: <T>({ scope, sessionIds, slice, }: {
  scope: string;
  sessionIds: string[];
  slice: (input: { sessionId: string; records: SessionRecord[]; }) => T;
}) => Map<string, T>;
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
// apps/web/src/routing/useRouteMatch.ts
export interface RouteMatch {
  id: string | undefined;
}
export const useRouteMatch: (page: SupportedPage) => RouteMatch | null;
```

```ts
// apps/web/src/store/mapFocus.ts
export type MapHoverTarget =
  | { kind: 'session'; id: string }
  | { kind: 'studioRoute'; id: string }
  | { kind: 'segment'; id: string }
  | { kind: 'segmentSpan'; id: string; span: RecordSpan };
export type MapHoverKind = MapHoverTarget['kind'];
export interface MapHover {
  target: MapHoverTarget;
  sceneKey: string;
}
export const INITIAL_MAP_FOCUS_STORE_STATE: Pick<MapFocusState, "mapHover" | "hoveredPoint" | "pickCircle" | "mapRefitRequest">;
export const useMapFocusStore: UseBoundStore<WithImmer<StoreApi<MapFocusState>>>;
```

```ts
// apps/web/src/store/segmentFocus.ts
export type MapMarker = [number, number];
export const INITIAL_SEGMENT_FOCUS_STORE_STATE: Pick<SegmentFocusState, "passMarker" | "bestMarker">;
export const useSegmentFocusStore: UseBoundStore<WithImmer<StoreApi<SegmentFocusState>>>;
```

```ts
// apps/web/src/store/segments.ts
export type SegmentSourceKind = 'range' | 'session';
export interface Segment {
  id: string;
  name: string;
  sport: Sport;
  source: SegmentSource;
  distanceMeters: number;
  netElevationMeters: number | null;
  encodedPolyline: string;
  bounds: GPSBounds;
  createdAt: number;
}
export const INITIAL_SEGMENTS_STORE_STATE: Pick<SegmentsState, "segments">;
export const useSegmentsStore: UseBoundStore<WithPersist<WithImmer<StoreApi<SegmentsState>>, unknown>>;
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
  segmentPasses: SegmentPassesEntry[];
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
// apps/web/tests/components/mapBackground/hooks/useMapHover.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/hooks/useMapTracks.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/hooks/useOpenedSessionEffect.integration.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/lapPath.spec.ts
// no exports
```

```ts
// apps/web/tests/components/mapBackground/mapScene.integration.spec.tsx
// no exports
```

```ts
// apps/web/tests/components/segments/SegmentActionsMenu.spec.tsx
// no exports
```

```ts
// apps/web/tests/components/segments/SegmentDetail.spec.tsx
// no exports
```

```ts
// apps/web/tests/components/segments/SegmentItem.spec.tsx
// no exports
```

```ts
// apps/web/tests/components/segments/SegmentNameDialog.spec.tsx
// no exports
```

```ts
// apps/web/tests/components/segments/charts/hooks/useSegmentChartRows.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/charts/segmentChartRows.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/charts/segmentExplorerHover.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/hooks/useSaveSegment.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/hooks/useSegmentDetail.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/hooks/useSegmentPassSelection.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/hooks/useSegmentTitle.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/hooks/useSessionSegments.spec.ts
// no exports
```

```ts
// apps/web/tests/components/segments/segmentCreation.spec.ts
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
// apps/web/tests/components/sessions/session/DeleteSessionDialog.spec.tsx
// no exports
```

```ts
// apps/web/tests/components/sessions/session/SegmentsRow.spec.tsx
// no exports
```

```ts
// apps/web/tests/components/sessions/session/SessionActionsMenu.spec.tsx
// no exports
```

```ts
// apps/web/tests/factories/segments.ts
export const createMockStoredSegmentPass: (overrides?: Partial<StoredSegmentPass>) => StoredSegmentPass;
export const createMockSegment: (overrides?: Partial<Segment>) => Segment;
export const createMockMatchedSegment: (overrides?: Partial<MatchedSegment>) => MatchedSegment;
export const createMockSegmentPassesEntry: (overrides?: Partial<SegmentPassesEntry>) => SegmentPassesEntry;
export const createMockSegmentSessionMeta: (overrides?: Partial<SegmentSessionMeta>) => SegmentSessionMeta;
export const createMockPassSeries: (overrides?: Partial<PassSeries>) => PassSeries;
```

```ts
// apps/web/tests/factories/trips.ts
export const createMockTrip: (overrides?: Partial<Trip>) => Trip;
```

```ts
// apps/web/tests/lib/analysis/records.computePbsForSessions.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/segmentMatching.spec.ts
// no exports
```

```ts
// apps/web/tests/lib/analysis/segmentPrefilter.spec.ts
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
// apps/web/tests/lib/workers/segmentsContract.spec.ts
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
// apps/web/tests/routing/useRouteMatch.spec.ts
// no exports
```

```ts
// apps/web/tests/store/mapFocus.spec.ts
// no exports
```

```ts
// apps/web/tests/store/segments.spec.ts
// no exports
```

```ts
// packages/engine/src/segments.ts
export interface SegmentTrackPoint {
  lat: number;
  lng: number;
  distanceMeters: number;
  timestampSec: number;
  elevationMeters: number | undefined;
}
export interface SegmentTrack {
  sessionId: string;
  sport: Sport;
  date: number;
  points: SegmentTrackPoint[];
}
export type SegmentReferencePoint = Omit<SegmentTrackPoint, 'timestampSec'>;
export interface SegmentPass {
  sessionId: string;
  startTimestampSec: number;
  endTimestampSec: number;
  durationSec: number;
  coverageRatio: number;
}
export interface SegmentMatchTolerances {
  corridorMeters: number;
  endToleranceMeters: number;
  minCoverageRatio: number;
}
export const segmentTrack: ({ sessionId, sport, date, records, }: {
  sessionId: string;
  sport: Sport;
  date: number;
  records: SessionRecord[];
}) => SegmentTrack | undefined;
export const segmentReference: (records: SessionRecord[]) => SegmentReferencePoint[];
export const segmentReferenceFacts: (reference: SegmentReferencePoint[]) => SegmentReferenceFacts;
export const matchTolerances: (lengthMeters: number) => SegmentMatchTolerances;
export const segmentPasses: ({ reference, tracks, }: {
  reference: SegmentReferencePoint[];
  tracks: SegmentTrack[];
}) => SegmentPass[];
```

```ts
// packages/engine/tests/metrics.ewmaAlpha.spec.ts
// no exports
```

```ts
// packages/engine/tests/segments.perf.spec.ts
// no exports
```

```ts
// packages/engine/tests/segments.spec.ts
// no exports
```

```ts
// packages/testing/src/segments.ts
export const createMockSegmentPass: (overrides?: Partial<SegmentPass>) => SegmentPass;
export const createMockSegmentTrack: (overrides?: Partial<SegmentTrack>) => SegmentTrack;
export const createMockSegmentReferencePoint: (overrides?: Partial<SegmentReferencePoint>) => SegmentReferencePoint;
```

```ts
// packages/testing/src/series.ts
export interface PathWaypoint {
  eastMeters: number;
  northMeters: number;
}
export interface PathJitter {
  meters: number;
  seed?: number;
}
export interface RecordGap {
  fromSec: number;
  toSec: number;
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
export const gpsPathRecordSeries: ({ path, speedMetersPerSec, legSpeedsMetersPerSec, reverse, gradeRatio, recordIntervalSec, lateralOffsetMeters, jitter, gaps, }: {
  path: PathWaypoint[];
  speedMetersPerSec: number;
  legSpeedsMetersPerSec?: number[];
  reverse?: boolean;
  gradeRatio?: number | null;
  recordIntervalSec?: number;
  lateralOffsetMeters?: number;
  jitter?: PathJitter;
  gaps?: RecordGap[];
}) => SessionRecord[];
```

```ts
// packages/ui/src/components/pvActionItem/PvActionItem.tsx
export const PvActionItem: FC<PvActionItemProps>;
```

```ts
// packages/ui/src/components/pvChartsCard/PvZoomResetPill.tsx
export const PvZoomResetPill: FC<PvZoomResetPillProps>;
```

```ts
// packages/ui/src/components/pvPlotStrip/PvPlotStrip.tsx
export const PvPlotStrip: FC<PvPlotStripProps>;
```

```ts
// packages/ui/src/components/pvPlotStrip/PvPlotStripGroup.tsx
export const PvPlotStripGroup: FC<PvPlotStripGroupProps>;
```

```ts
// packages/ui/src/components/pvPlotStrip/PvPlotStripMarker.tsx
export const PvPlotStripMarker: FC<PvPlotStripMarkerProps>;
```

```ts
// packages/ui/src/components/pvPlotStrip/PvPlotStripTile.tsx
export const PvPlotStripTile: FC<PvPlotStripTileProps>;
```

```ts
// packages/ui/src/components/pvPlotStrip/plotStripScale.ts
export const plotStripTopPx: (ratio: number) => number;
```

```ts
// packages/ui/src/components/pvPlotStrip/types.ts
export type PlotStripTone = 'neutral' | 'best';
export interface PlotStripPosition {
  ratio: number;
  clamped: boolean;
}
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
// packages/ui/src/hooks/useScrollToEndEffect.ts
export const useScrollToEndEffect: ({ ref, scrollKey, }: { ref: RefObject<HTMLElement | null>; scrollKey: string; }) => void;
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
// packages/ui/tests/components/pvPlotStrip/PvPlotStripTile.spec.ts
// no exports
```

```ts
// packages/ui/tests/components/pvPlotStrip/plotStripScale.spec.ts
// no exports
```

```ts
// packages/ui/tests/components/pvStatRail/PvStatRail.spec.ts
// no exports
```

```ts
// packages/ui/tests/hooks/useScrollToEndEffect.spec.ts
// no exports
```

```ts
// apps/web/src/components/errors/NotFoundBanner.tsx · not planned
export const NotFoundBanner: FC<{ children?: ReactNode | undefined; }>;
```

```ts
// apps/web/src/components/mapBackground/hooks/useMapTerrainEffect.ts · not planned
export const useMapTerrainEffect: () => void;
```

```ts
// apps/web/src/components/onboarding/DesktopOnboarding.tsx · not planned
export const DesktopOnboarding: FC<ShellProps>;
```

```ts
// apps/web/src/components/onboarding/OnboardingHeading.tsx · not planned
export const OnboardingHeading: FC<OnboardingHeadingProps>;
```

```ts
// apps/web/src/components/onboarding/OnboardingStep.tsx · not planned
export const OnboardingStep: FC<StepProps>;
```

```ts
// apps/web/src/components/onboarding/PhoneOnboarding.tsx · not planned
export const PhoneOnboarding: FC<ShellProps>;
```

```ts
// apps/web/src/components/onboarding/types.ts · not planned
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
export const ONBOARDING_HEADING_ID: "onboarding-heading";
```

```ts
// apps/web/src/components/segments/SegmentCompactItem.tsx · not planned
export const SegmentCompactItem: FC<SegmentCompactItemProps>;
```

```ts
// apps/web/src/components/sessions/SessionsPickPopup.tsx · not planned
export const SessionsPickPopup: FC<SessionsPickPopupProps>;
```

```ts
// apps/web/src/components/sessions/session/index.tsx · not planned
export const Session: FC;
```

```ts
// apps/web/src/components/settings/DeleteAllDataDialog.tsx · not planned
export const DeleteAllDataDialog: FC<DeleteAllDataDialogProps>;
```

```ts
// apps/web/src/components/settings/PaceEstimatorDialog.tsx · not planned
export const PaceEstimatorDialog: FC<PaceEstimatorDialogProps>;
```

```ts
// apps/web/src/components/settings/ThresholdEditDialog.tsx · not planned
export const ThresholdEditDialog: FC<ThresholdEditDialogProps>;
```

```ts
// apps/web/src/components/settings/ThresholdEditForm.tsx · not planned
export const ThresholdEditForm: FC<ThresholdEditFormProps>;
```

```ts
// apps/web/src/components/studio/DeleteStudioRouteDialog.tsx · not planned
export const DeleteStudioRouteDialog: FC<DeleteStudioRouteDialogProps>;
```

```ts
// apps/web/src/components/studio/StudioRouteFormDialog.tsx · not planned
export const StudioRouteFormDialog: FC<StudioRouteFormDialogProps>;
```

```ts
// apps/web/src/components/studio/index.tsx · not planned
export const Studio: FC;
```

```ts
// apps/web/src/components/studio/markers/StudioMarkerDialog.tsx · not planned
export const StudioMarkerDialog: FC<StudioMarkerDialogProps>;
```

```ts
// apps/web/src/components/studio/markers/StudioRoutesPickPopup.tsx · not planned
export const StudioRoutesPickPopup: FC<StudioRoutesPickPopupProps>;
```

```ts
// apps/web/src/components/trips/DeleteTripDialog.tsx · not planned
export const DeleteTripDialog: FC<DeleteTripDialogProps>;
```

```ts
// apps/web/src/components/trips/ManageTripDialog.tsx · not planned
export const ManageTripDialog: FC<ManageTripDialogProps>;
```

```ts
// apps/web/src/components/trips/TripDetail.tsx · not planned
export const TripDetail: FC<TripDetailProps>;
```

```ts
// apps/web/src/components/trips/TripFormDialog.tsx · not planned
export const TripFormDialog: FC<TripFormDialogProps>;
```

```ts
// apps/web/src/components/trips/TripsTab.tsx · not planned
export const TripsTab: FC;
```

```ts
// apps/web/tests/lib/analysis/movingTime.spec.ts · not planned
// no exports
```

```ts
// apps/web/tests/lib/analysis/segmentMatching.integration.spec.ts · not planned
// no exports
```

```ts
// packages/ui/src/components/pvActionItem/PvActionItemContent.tsx · not planned
export const PvActionItemContent: FC<PvActionItemContentProps>;
```

```ts
// packages/ui/src/components/pvActionItem/PvActionItemList.tsx · not planned
export const PvActionItemList: FC<PvActionItemListProps>;
```

```ts
// packages/ui/src/components/pvActionItem/types.ts · not planned
export type ActionItemSize = 'md' | 'sm';
export const LIST_GAP_CLASS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, string>;
export const LIST_ROW_SPACING_CLASS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, string>;
```

```ts
// packages/ui/src/components/pvBanner/PvBanner.tsx · not planned
export const PvBanner: FC<PvBannerProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialog.tsx · not planned
export const PvDialog: FC<PvDialogProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogBody.tsx · not planned
export const PvDialogBody: FC<PvDialogBodyProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogDescription.tsx · not planned
export const PvDialogDescription: FC<DialogPrimitive.DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogFooter.tsx · not planned
export const PvDialogFooter: FC<PvDialogFooterProps>;
```

```ts
// packages/ui/src/components/pvDialog/PvDialogHeader.tsx · not planned
export const PvDialogHeader: FC<PvDialogHeaderProps>;
```

```ts
// packages/ui/src/components/pvResponsivePopover/PvResponsivePopover.tsx · not planned
export const PvResponsivePopover: FC<PvResponsivePopoverProps>;
```

```ts
// packages/ui/src/hooks/useScrollFadeEffect.ts · not planned
export const useScrollFadeEffect: (ref: RefObject<HTMLElement | null>, options?: { axis?: ScrollFadeAxis; }) => void;
```

```ts
// packages/ui/src/lib/scrollFade.ts · not planned
export const scrollFadeEdges: (metrics: ScrollMetrics) => { top: boolean; bottom: boolean; };
export const horizontalScrollFadeEdges: (metrics: HorizontalScrollMetrics) => { left: boolean; right: boolean; };
```

```ts
// packages/ui/tests/hooks/useScrollFadeEffect.spec.ts · not planned
// no exports
```

```ts
// packages/ui/tests/lib/scrollFade.spec.ts · not planned
// no exports
```

```ts
// tools/workbench/site/src/app/AnswerDialog.tsx · not planned
export const AnswerDialog: FC<AnswerDialogProps>;
```

```ts
// tools/workbench/site/src/app/AnswerForm.tsx · not planned
export const AnswerForm: FC<AnswerFormProps>;
```
