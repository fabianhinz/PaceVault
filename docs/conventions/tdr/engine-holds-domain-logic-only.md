---
kind: pattern-apply-tdr-reference
id: engine-holds-domain-logic-only
title: The engine returns domain values; presentation and serialization live in the app
summary: packages/engine returns numbers, union keys and thresholds only and has no runtime dependency, packages/gpx keeps only the GPX file format; colours, labels, display strings, display rounding, file names, rendering order and storage encoding are mapped from those keys in apps/web/src/lib.
governs:
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "packages/engine/package.json"
  - "packages/gpx/package.json"
adopted_rules: [R1, R2, R3, R4]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# The engine returns domain values; presentation and serialization live in the app

## 1. Context

This file carries rules R1 through R4.

`packages/engine` is the pure domain layer the app, its workers, `packages/gpx`, `packages/testing` and the Node tools all import. The root `CLAUDE.md` (§2 "Pure packages") already keeps presentation, serialization, format conversion and I/O out of it. What crept in regardless was small and looked harmless: a hex colour and an English label on every zone definition, a traffic-light colour name for the ACWR, a Tailwind colour token on the training-effect label, a display pace string, and the polyline encoding of a session's GPS track for IndexedDB. Each of these ties the engine to one screen or one storage format, and two of them pulled npm runtime dependencies into a package that otherwise has none.

The boundary this record draws: the engine answers *what the data means* — a number, a member of a closed union, a threshold. The app decides *how that looks or is stored*, keyed by the engine's union. Scope: `packages/engine/src` and its `package.json`.

The rules bind `packages/gpx/src` as well, with one difference: GPX is a file format, and reading and writing it (`parseGpx.ts`, `buildGpx.ts`) is that package's purpose. R2 there allows the GPX parse and build and forbids every other encoding — the route polylines and their simplification for storage live in `apps/web/src/lib/gpsTrack.ts` (`encodedSegmentPolylines`). R1 and R4 hold unchanged: rounding a route profile for a chart and naming an export file are presentation and live in `apps/web/src/lib/` (`routeChartProfile` in `chartData.ts`, `buildGpxFilename` in `gpxExport.ts`). R3 there reads: `packages/gpx/package.json` declares `@pacevault/engine` and `zod` as its only runtime dependencies.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | An engine function returns domain values only: numbers, members of closed unions, thresholds, structures of those. It returns no colour (hex, token name or colour word), no label or other copy, and no display-formatted string. | manual |
| R2 | The engine does no serialization: no encoding or decoding for storage or transport (polyline codecs, compression) and no reordering for a rendering library (`[lng, lat]` tuples for a map layer). That code lives in `apps/web/src/lib/` (`apps/web/src/lib/gpsTrack.ts`). In `packages/gpx` the GPX file format itself (parse and build) is the one serialization allowed. | proposed |
| R3 | `packages/engine/package.json` declares no runtime `dependencies`; engine modules import only other engine modules. `packages/gpx/package.json` declares only `@pacevault/engine` and `zod`. | proposed |
| R4 | When the app needs presentation for an engine result, the engine exposes the key or threshold (`RunningZoneName`, `ACWR_MODERATE_THRESHOLD`) and the app maps it with an exhaustive `Record<Union, T>` in `apps/web/src/lib/` (`COLOR_BY_RUNNING_ZONE` in `apps/web/src/lib/zoneColors.ts`). The engine never ships a presentational wrapper around its own key. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "#[0-9a-fA-F]{6}\\b|\\bcolou?r\\b|\\blabel\\s*:|'(green|yellow|red|amber|orange|blue|neutral)'"
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A domain key that happens to be a colour word, or a `label` key of a non-display union; read each hit."
R2:
  type: grep
  pattern: "from '(@googlemaps/polyline-codec|simplify-ts)'|\\bencode\\(|\\bdecode\\("
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R3:
  type: grep
  pattern: "\"dependencies\"\\s*:"
  include: ["packages/engine/package.json", "packages/gpx/package.json"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "packages/gpx/package.json has a dependencies block by design; a hit there is a violation only when it lists anything besides @pacevault/engine and zod."
R4:
  type: manual
  reason: "Whether an exported engine value is a domain key or a presentational wrapper is a judgement about its meaning."
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the engine stays importable from every runtime — workers, Node tools, other packages — without dragging a palette, copy or a codec along.
- **Good, because** a colour or label change is an app change: it touches one map in `apps/web/src/lib/`, not a package API.
- **Good, because** keying the app's maps by the engine's union makes a new zone or band a compile error in the app until it has a colour.
- **Bad, because** a consumer that needs both the value and its look now reads two modules, and the zone's colour no longer travels with the zone object.
- **Neutral, because** the stored GPS shape (`SessionGPS`) stays an engine type; only the code that produces it moves.

## 5. Reference implementation

```ts
export const computeRunningZones = (thresholdPaceSec: number): RunningZone[] =>
  ZONE_DEFS.map((def) => ({
    name: def.name,
    minPace: Math.round(thresholdPaceSec * def.minPct),
    maxPace: Math.round(thresholdPaceSec * def.maxPct),
  }));
```

```ts
import type { RunningZoneName } from '@pacevault/engine/types.ts';

export const COLOR_BY_RUNNING_ZONE: Record<RunningZoneName, string> = {
  recovery: '#60a5fa',
  easy: '#34d399',
  tempo: '#fbbf24',
  threshold: '#f97316',
  vo2max: '#ef4444',
};
```

## 6. Forbidden practices

- ❌ A `color` or `label` field on an engine type or constant table — the engine does not know what a zone looks like.
- ❌ An engine function returning `'green' | 'yellow' | 'red'` or a Tailwind token — that is a presentation decision dressed as a classification.
- ❌ A display formatter (pace string, date string for the screen) in the engine, or a "formatter strategy" injected into an engine function.
- ❌ Polyline encoding, decoding or simplification for storage inside the engine, and any npm runtime dependency in `packages/engine/package.json`.
- ❌ Polyline encoding, simplification, display rounding or download file names in `packages/gpx` — the GPX parse and build are its only serialization, and presentation is the app's.
