---
kind: pattern-apply-tdr-reference
id: names-spell-out-their-meaning
title: Engine names say what a value is, in full, with its unit
summary: In packages/engine, packages/gpx, packages/testing, tools/docs and tools/workbench a function is named for what it returns (no get/calculate/compute), names are written out except the domain's established acronyms, every quantity carries its unit in long form, and no local or parameter has a stand-in name.
governs:
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "packages/testing/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/docs/banner/**/*.tsx"
  - "tools/docs/*.config.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Engine names say what a value is, in full, with its unit

## 1. Context

This file carries rules R1 through R4.

The engine is read far more often than it is written: by the app, by reviewers checking a formula against `SOURCES.md`, and by specs. With comments reduced to citations and why-notes (comments-cite-sources-and-explain-why), the names carry everything else. Before this record they carried it unevenly: `getFormStatus`, `calculateVdot` and `computeMetrics` beside `stepLength` and `windAngles` for the same kind of function; `calculateGAP`, `toRad`, `haversineM`, `TELabelKey`; quantities named `seconds`, `dt`, `metres` or `timeMinutes`; and single-letter or stand-in locals (`x`, `out`, `result`, `c`) in the densest algorithms.

Scope: names declared in `packages/engine/src` — exported functions, types, constants, interface fields, parameters and locals. Out of scope, by owner decision: persisted and stored shapes. Persisted fields (`TrainingSession`, `SessionRecord`, `SessionLap`) keep their stored names; no rename or migration is made for these rules. Boolean naming is owned by boolean-names-without-is-prefix and constant naming by behavioural-constants-hoisted-upper-snake; this record covers the rest.

The rules bind `packages/gpx/src` too. Its stored fields are out of scope and keep their names, with no migration: `lat`, `lng`, `ele`, `time`, `seg` and `dist` of `ParsedGpxPoint` and `RoutePoint` (IndexedDB), and `gain`, `loss`, `min`, `max`, `maxGrade` of `RouteElevationStats` (the studio store). The fields of `GpxPoint`, `GpxWaypoint` and `GpxMetadata` that mirror a GPX 1.1 element or attribute keep the format's spelling — `lat`, `lon`, `ele`, `time`, `name`, `desc`, and `seg` for the `<trkseg>` a point belongs to — the way a member that mirrors an external interface keeps its name (boolean-names-without-is-prefix R6).

The rules bind the test factories and series builders in `packages/testing/src` as well. Their option fields are names too and carry the unit (`baseHrBpm`, `basePowerWatts`, `baseSpeedMetersPerSec`); a count of records is a `…RecordCount`, not a `…Duration`. The per-channel arrays a series builds (`elevations`, `speeds`, `hrs`, `cadences`, `powers`, `grades`) are named after the persisted `SessionRecord` field they fill and carry no suffix, the way the field itself keeps its stored name.

The rules bind `tools/docs` too (`tools/docs/banner/**`, `tools/docs/*.config.ts`): a binding is named for what it holds (`WEB_APP_ORIGIN` for the web app's dev server, `bannerLocale` for the banner's locale), and R4 holds for its locals and callback parameters, the Playwright `page.evaluate` callbacks included. R3 has a subject there only in durations (`_MS`); the capture's geometry is CSS pixels throughout and carries no suffix.

The rules bind `tools/workbench` too (`scripts/`, `site/src/`): R4 holds for its locals and parameters, and a function is named for what it does or returns (`readBacklogFile`, `writeEdits`, not `read`, `commit`).

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Name a function for what it returns: a noun phrase (`stepLength`, `windAngles`) or `<result>From<input>` (`vdotFromRace`, `stressFromRecords`). Do not prefix `get`, `calculate` or `compute`. A verb that names real work stays: `detect`, `estimate`, `predict`, `derive`, `build`, `upsert`; a boolean-returning function takes `is`/`has`. | proposed |
| R2 | Write names out. The only abbreviations are the domain's established acronyms — HR, TSS, NP, FTP, CTL, ATL, TSB, ACWR, VDOT, VAM, TRIMP, PELT — and the R3 unit suffixes. `GAP`, `TE`, `DEFS`, `Rad`, `M`, `Deg` are spelled out. A field that mirrors an external file format keeps the format's spelling (GPX `lon`, `ele`, `desc` in `packages/gpx`). | proposed |
| R3 | A name that holds a quantity carries its unit as a long-form suffix: `Sec`, `Min`, `Ms`, `Meters`, `Degrees`, `SecPerKm`, `MetersPerSec`, `Bpm`, `Watts` (constants: R7 of behavioural-constants). `durationSec`, not `seconds`; `elapsedSec`, not `dt`; `distanceDeltaMeters`, not `dx`. Persisted fields keep their names. | proposed |
| R4 | No stand-in names for locals or parameters: not `result`, `out`, `data`, `x`, `fmt`, `dist`, `idx`, and no single letter other than a loop index (`i`, `j`, `k`) or the comparator pair `(a, b)` of a `sort` callback. Name the value for what it is (`smoothed`, `gradientByIndex`, `series`). | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "\\b(get|calculate|compute)[A-Z]\\w*\\s*="
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: grep
  pattern: "\\b(\\w*GAP\\w*|TE[A-Z_]\\w*|\\w*_DEFS|toRad|\\w+M|\\w+Deg)\\b"
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Words that happen to end in an upper-case M or contain GAP (`GAP_CAP_SEC` names a time gap, not grade-adjusted pace); read each hit."
R3:
  type: grep
  pattern: "\\b(dt|dx|seconds|minutes|metres|meters|\\w+Seconds|\\w+Minutes)\\b"
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["packages/engine/src/types.ts", "packages/gpx/src/types.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Persisted fields in types.ts (exempted) and words inside a citation or why-note."
R4:
  type: grep
  pattern: "\\b(const|let) (result|out|data|x|fmt|dist|idx|[a-hl-z])\\b|\\(([a-hl-z]|result|data)[,:)]"
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "The `(a, b)` pair of a sort comparator."
```

## 4. Trade-offs

- **Good, because** a reader of `stressFromRecords(…)` or `elapsedSec` needs no comment and no jump to the declaration.
- **Good, because** one naming scheme for the same kind of function lets an app author guess an engine name.
- **Bad, because** renames of exported engine names touch app modules and specs, and long names lengthen formulas.
- **Neutral, because** the acronym list is a judgement; it is written down here so it is applied the same way everywhere.

## 5. Reference implementation

```ts
export const vdotFromRace = (distanceMeters: number, timeMin: number): number => {
  const velocityMetersPerMin = distanceMeters / timeMin;
  return vo2FromVelocity(velocityMetersPerMin) / pctVo2max(timeMin);
};

export const haversineDistanceMeters = (a: GPSPoint, b: GPSPoint): number => { … };
```

## 6. Forbidden practices

- ❌ `getZoneForPace`, `calculateGAP`, `computeMetrics` — empty verbs and unspelled abbreviations.
- ❌ `const dt = current.timestamp - previous.timestamp;` — the unit is in nobody's head but the author's.
- ❌ `const out = [...pieces];` and `(x: Float64Array, …)` — stand-ins that say nothing about the value.
- ❌ Renaming a persisted or stored field to satisfy R3 — stored shapes (`TrainingSession`, `SessionRecord`, `SessionLap`, `RoutePoint`, `RouteElevationStats`) are out of scope and keep their names.
