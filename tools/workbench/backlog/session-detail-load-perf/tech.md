# Session detail reload: tech

## Data flow

```mermaid
flowchart LR
  idb[("IndexedDB session-records")] --> query["useSessionRecords<br/>query ['session-records', id]<br/>gcTime 0 · staleTime Infinity"]
  query -- records --> page["SessionDetailPage<br/>banners · map controls · overview"]
  query -- records --> path["useSessionDetailPath<br/>detail track on the map"]
  query -. fetchQuery .-> weather["useSessionWeather<br/>Open-Meteo fetch"]
  page --> explorer["SessionChartsExplorer<br/>terrain · extremes · scales on main thread"]
  explorer -- "sessionId + range · reset" --> hook["useSessionChartRows"]
  hook -- postMessage --> worker["sessionChartRows.worker<br/>createSessionChartRowsResponder"]
  idb --> worker
  kv[("IndexedDB kv store-sessions<br/>sport")] --> worker
  worker -- "chart-rows ≤ ~1500 rows · chart-rows-failed" --> hook
  hook -- "rows · compactRows" --> explorer
  inval["reprocess · delete · delete all · import · demo"] -- invalidateSessionRecords --> query
  query -. "dataUpdatedAt changed → reset" .-> hook
```

## Modules

```mermaid
flowchart TB
  subgraph UI["UI · components, pages"]
    page["SessionDetailPage.tsx"]:::mod
    coll["ui/Collapsible.tsx"]:::mod
  end
  subgraph FEAT["feature · src/features"]
    recq["sessions/hooks/useSessionRecords.ts"]:::new
    explorer["sessions/charts/SessionChartsExplorer.tsx"]:::mod
    rowsHook["sessions/charts/hooks/useSessionChartRows.ts"]:::new
    weatherHook["sessions/session/hooks/useSessionWeather.ts"]:::mod
    weatherCard["sessions/session/WeatherCard.tsx"]:::mod
    mapPath["map/hooks/useSessionDetailPath.ts"]:::mod
    inval["reprocess · delete · delete all · ingest · demo"]:::mod
  end
  subgraph WORK["workers"]
    worker["sessions/charts/sessionChartRows.worker.ts"]:::new
  end
  subgraph STORE["store"]
    sessions["sessions.ts · persisted key store-sessions"]
  end
  subgraph LIB["lib"]
    responder["sessionChartRows.ts"]:::new
    chartData["chartData.ts"]:::mod
    terrain["sessionTerrain.ts"]
    idb["indexeddb.ts"]
    db["db.ts"]
  end
  page --> recq
  page --> explorer
  mapPath --> recq
  weatherHook --> recq
  weatherCard --> weatherHook
  weatherCard --> coll
  explorer --> rowsHook
  rowsHook --> recq
  rowsHook -. "new Worker" .-> worker
  inval --> recq
  recq --> idb
  worker --> responder
  responder --> idb
  responder --> db
  responder -. "reads persisted kv entry" .-> sessions
  responder --> terrain
  responder --> chartData
  idb --> db
  classDef new stroke:#60a5fa,stroke-width:1.5px
  classDef mod stroke:#8b8f9a,stroke-width:2px
```

### New

- `src/features/sessions/hooks/useSessionRecords.ts`: records query, options and invalidation
- `src/lib/sessionChartRows.ts`: worker logic (`createSessionChartRowsResponder`), message types, cache per session id, Zod read of `sport` from `store-sessions`
- `src/features/sessions/charts/sessionChartRows.worker.ts`: thin `self.onmessage` around the responder
- `src/features/sessions/charts/hooks/useSessionChartRows.ts`: worker lifecycle, request ids, reset on `dataUpdatedAt` change

### Changed

- `src/pages/SessionDetailPage.tsx`: records from the query instead of state + `getSessionRecords`
- `src/features/map/hooks/useSessionDetailPath.ts`: ref, state and effect replaced by `useSessionRecords(targetId, hasDetailedRecords)`
- `src/features/sessions/session/hooks/useSessionWeather.ts`: `ctx.client.fetchQuery(sessionRecordsQueryOptions(id))`
- `src/features/sessions/charts/SessionChartsExplorer.tsx`: `useSessionChartRows(props.session, zoomRange)` replaces the two row memos; loading branch
- `src/lib/chartData.ts`: exports `SessionChartRows`
- `src/components/ui/Collapsible.tsx`: loading state on `CollapsibleListItem`
- `src/features/sessions/session/WeatherCard.tsx`: uses that loading state instead of the 52 px block
- `src/features/sessions/hooks/useSessionReprocessingEffect.ts`: `invalidateSessionRecords`
- `src/features/sessions/session/DeleteSessionDialog.tsx`: `invalidateSessionRecords`
- `src/features/settings/DeleteAllDataDialog.tsx`: `invalidateSessionRecords`
- `src/features/sessions/createIngestBatcher.ts`: `invalidateSessionRecords`
- `src/features/demo/loadDemoData.ts`: `invalidateSessionRecords`

## Interfaces

```ts
// src/features/sessions/hooks/useSessionRecords.ts (planned; names from the plan, types inferred)
export const sessionRecordsQueryOptions: (sessionId: string) => UseQueryOptions<SessionRecord[]>; // queryKey ['session-records', id], gcTime 0, staleTime Infinity, structuralSharing false, retry false
export const useSessionRecords: (
  sessionId: string,
  enabled: boolean,
) => UseQueryResult<SessionRecord[]>;
export const invalidateSessionRecords: (queryClient: QueryClient) => Promise<void>;
```

```ts
// src/lib/sessionChartRows.ts (planned; message types from the plan, responder shape not fixed)
export type ChartRowsRequest =
  | {
      type: 'chart-rows';
      requestId: number;
      sessionId: string;
      range: { from: number; to: number } | null;
    }
  | { type: 'reset' };
export type ChartRowsResponse =
  | { type: 'chart-rows'; requestId: number; rows: SessionChartRows }
  | { type: 'chart-rows-failed'; requestId: number };
export const createSessionChartRowsResponder: () => (
  request: ChartRowsRequest,
) => Promise<ChartRowsResponse | undefined>;
```

```ts
// src/features/sessions/charts/hooks/useSessionChartRows.ts (planned; return shape not fixed by the plan)
export const useSessionChartRows: (
  session: TrainingSession,
  zoomRange: { from: number; to: number } | null,
) => { rows: SessionChartRows | undefined; compactRows: SessionChartRows | undefined };
```

```ts
// src/lib/chartData.ts (existing function; type export planned)
export type SessionChartRows = ReturnType<typeof buildSessionChartRows>;
export const buildSessionChartRows: (records: SessionRecord[], options: SessionChartRowOptions) => …;
// SessionChartRowOptions: { isRunning: boolean; terrain: SessionTerrain; range?: { from: number; to: number } }
```

```ts
// src/lib/sessionTerrain.ts (existing, used by the worker)
export const buildSessionTerrain: (sport: Sport, records: SessionRecord[]) => SessionTerrain;
```

```ts
// src/lib/indexeddb.ts (existing, queryFn and worker read)
export const getSessionRecords: (sessionId: string) => Promise<SessionRecord[]>;
```

## Components

```mermaid
flowchart TB
  page["SessionDetailPage"]:::uimod --> overview["SessionOverview"]
  overview --> summary["SessionSummaryCard"]
  summary --> weather["WeatherCard"]:::uimod
  weather --> item["CollapsibleListItem · loading state"]:::uimod
  summary --> others["TrainingEffectCard · LapsRow · MoreStatsRow"]
  others --> item
  overview --> explorer["SessionChartsExplorer · empty plots until rows arrive"]:::uimod
  explorer --> charts["ChartsCard · ChartRow"]:::ui
  classDef ui stroke:#8b8f9a,stroke-dasharray:4 3
  classDef uimod stroke:#8b8f9a,stroke-width:2px
```
