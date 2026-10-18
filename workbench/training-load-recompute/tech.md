# Training load recompute: tech

## Data flow

```mermaid
flowchart LR
  profile[("store-user profile")] --> sig["trainingLoadSignature"]
  phase[("sessionReprocessing phase")] --> effect["useTrainingLoadRecomputeEffect"]
  sig --> effect
  effect -- "phase done and signature changed" --> recompute["recomputeTrainingLoad<br/>under SESSION_REPROCESSING_LOCK"]
  sessions[("store-sessions")] --> recompute
  recompute --> stressAt["sessionStressAt<br/>thresholdsAt + calculateSummaryStress"]
  stressAt -- "only differing sessions" --> apply["applyRecomputedTrainingLoad<br/>per REPROCESS_BATCH_SIZE"]
  apply --> sessions
  recompute -- "diff not empty" --> overlay["ImportProgressOverlay<br/>held for MIN_OPEN_MS"]
  fit[("FIT file")] --> parse["parseFitFile<br/>app NP + calculateSummaryStress"]
  parse -- "import and one-time reparse<br/>SESSION_DERIVATION_VERSION 4" --> sessions
```

## Modules

```mermaid
flowchart TB
  subgraph UI["UI · components, pages"]
    layout["AppLayout.tsx"]:::mod
    overlay["ImportProgressOverlay.tsx"]:::mod
  end
  subgraph FEAT["feature · src/features"]
    hook["useTrainingLoadRecomputeEffect.ts"]:::new
    recompute["recomputeTrainingLoad.ts"]:::new
    reprocess["reprocessSessions.ts"]:::mod
    fit["parsers/fit.ts"]:::mod
  end
  subgraph STORE["store"]
    sessionsStore["sessions.ts"]:::mod
    user["user.ts"]
    progress["importProgress.ts"]
    phaseStore["sessionReprocessing.ts"]
  end
  subgraph LIB["lib"]
    stressLib["sessionStress.ts"]:::new
    thresholds["thresholdsAt.ts"]
    lock["webLock.ts"]
  end
  subgraph ENG["engine"]
    stress["stress.ts"]:::mod
    derivation["sessionDerivation.ts"]:::mod
    normalize["normalize.ts"]
  end
  layout --> hook
  layout --> overlay
  overlay --> progress
  hook --> stressLib
  hook --> user
  hook --> phaseStore
  hook --> recompute
  recompute --> stressLib
  recompute --> lock
  recompute --> sessionsStore
  recompute --> user
  recompute --> progress
  recompute --> reprocess
  reprocess --> stressLib
  reprocess --> normalize
  reprocess --> derivation
  fit --> stress
  fit --> normalize
  stressLib --> thresholds
  stressLib --> stress
  stress --> normalize
  classDef new stroke:#60a5fa,stroke-width:1.5px
  classDef mod stroke:#8b8f9a,stroke-width:2px
```

### New

- `src/lib/sessionStress.ts`: session + profile → stored load; profile signature for the effect
- `src/features/sessions/recomputeTrainingLoad.ts`: metadata-only recompute under the reprocessing lock
- `src/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts`: runs the recompute on signature change once reprocessing is done

### Changed

- `src/packages/engine/stress.ts`: `calculateSummaryStress`, `calculateTSS` takes NP, `calculateSessionStress` always returns derived NP
- `src/packages/engine/sessionDerivation.ts`: `SESSION_DERIVATION_VERSION` bumped to 4
- `src/parsers/fit.ts`: app NP from records for every session, load via `calculateSummaryStress`
- `src/features/sessions/reprocessSessions.ts`: lock exported, keep rule removed, stress via `sessionStressAt`
- `src/store/sessions.ts`: `applyRecomputedTrainingLoad` action
- `src/components/layout/AppLayout.tsx`: mounts `useTrainingLoadRecomputeEffect`
- `src/components/ui/ImportProgressOverlay.tsx`: `MIN_OPEN_MS` 1500, reprocess overlay held until `openedAt + MIN_OPEN_MS`
- `messages/en.json`: `ui_reprocess_updating` "Migrating your sessions…"
- `messages/de.json`: `ui_reprocess_updating` "Einheiten werden migriert…"

## Interfaces

```ts
// src/packages/engine/stress.ts
export interface StressSummary {
  durationSec: number;
  avgHr?: number;
  normalizedPower?: number;
}
export interface StressThresholds {
  restHr: number;
  maxHr: number;
  gender: Gender;
  ftp?: number;
}
export interface SessionStress {
  tss: number;
  stressMethod: 'tss' | 'trimp' | 'duration';
  normalizedPower?: number;
}
export const calculateSummaryStress: (
  summary: StressSummary,
  thresholds: StressThresholds,
) => SessionStress;
export const calculateSessionStress: (
  records: SessionRecord[],
  durationSec: number,
  avgHr: number | undefined,
  restHr: number,
  maxHr: number,
  gender: Gender,
  ftp?: number,
) => SessionStress;
```

```ts
// src/lib/sessionStress.ts
export type StoredSessionStress = Pick<TrainingSession, 'tss' | 'stressMethod' | 'normalizedPower'>;
type StressInputs = Pick<TrainingSession, 'date' | 'duration' | 'avgHr' | 'normalizedPower'>;
export const sessionStressAt: (session: StressInputs, profile: UserProfile) => StoredSessionStress;
export const trainingLoadSignature: (profile: UserProfile | null) => string;
```

```ts
// src/features/sessions/recomputeTrainingLoad.ts
export const recomputeTrainingLoad: () => Promise<number>;
```

```ts
// src/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts
export const useTrainingLoadRecomputeEffect: () => void;
```

```ts
// src/features/sessions/reprocessSessions.ts
export const SESSION_REPROCESSING_LOCK = 'pacevault-session-reprocessing';
```

```ts
// src/store/sessions.ts
export type RecomputedTrainingLoad = Pick<
  TrainingSession,
  'id' | 'tss' | 'stressMethod' | 'normalizedPower'
>;
interface SessionsState {
  applyRecomputedTrainingLoad: (changes: RecomputedTrainingLoad[]) => void;
}
```

```ts
// src/packages/engine/sessionDerivation.ts
export const SESSION_DERIVATION_VERSION = 4;
```

## Components

```mermaid
flowchart TB
  layout["AppLayout"]:::uimod --> effect["useTrainingLoadRecomputeEffect"]
  layout --> overlay["ImportProgressOverlay"]:::uimod
  overlay --> held["useHeldReprocess · holds last reprocess state"]
  overlay --> content["OverlayContent · Migrating your sessions…"]
  classDef ui stroke:#8b8f9a,stroke-dasharray:4 3
  classDef uimod stroke:#8b8f9a,stroke-width:2px
```
