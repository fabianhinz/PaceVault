# @pacevault/engine

**WHY:** The domain logic of PaceVault (metrics, zones, stress, training effect, GPS) as pure functions, so it can be tested without a browser and reused by the app and `@pacevault/gpx`.
**WHAT:** TypeScript sources in `src/`, imported by name with a `.ts` subpath (`@pacevault/engine/zones.ts`); no build step. Tests in `tests/`. Shared code rules: root `CLAUDE.md` §2.

## Rules

- **Pure, no React, no app imports**: No imports from `apps/web` (`@/…`, `src/lib/`, `src/store/`, `src/components/`), no React, no state library, no browser API, no npm runtime dependency: it imports only its own modules. `vp run workbench:deps` checks this (`engine-is-pure`).
- **Type placement**: A type read by more than one engine module lives in `types.ts`, which imports nothing and holds only declarations and `as const` lists with the unions derived from them. A type read by one engine module stays in it, exported when the app or a spec needs it (e.g., `WindExposure` in `windExposure.ts`); a type inferred from a value stays with the value (`HeartRateZoneName` beside `HEART_RATE_ZONES`).
- **Module layout**: Every file follows: imports, types and interfaces (exported or not), constants (exported or not), unexported helpers, exported functions.
- **Return nullability**: `T | undefined` for insufficient data, `T | null` for no valid result. Never throw.
- **Parameters**: A function with two or more inputs takes one destructured object with an inline type (`({ records, sport }: { records: SessionRecord[]; sport: Sport })`), hot per-record helpers included; one input stays positional. Only callback contracts (`Array.prototype` callbacks, `sort` comparators) keep positional lists.
- **Units**: seconds (duration), metres (distance), sec/km (pace), m/s (speed), watts (power), bpm (HR), unix ms (session and lap dates), elapsed seconds since the first record (record `timestamp`).
- **Constants**: A value that governs behaviour (threshold, bound, iteration limit, coefficient read more than once) is a module-scope `UPPER_SNAKE_CASE` constant declared at the top of the module, named for its reason with its unit in long form (`_SEC`, `_MIN`, `_MS`, `_METERS`, `_DEGREES`, `_DAYS`). It is exported only when another module or a spec imports it. Lookup tables keyed by a closed union are a `Record<Union, T>` named `<VALUE>_BY_<KEY>` (`METERS_BY_RACE_DISTANCE`) and indexed without fallback; per-member behaviour is a `switch` with no `default`.
- **Domain values only**: Functions return domain values — numbers, union keys, thresholds. No colour, label, display string or rendering order, and no encoding for storage; the app maps keys to presentation in `apps/web` (`src/lib/colors/` or the component owner, e.g. `COLOR_BY_RUNNING_ZONE`) and owns encoding (`apps/web/src/lib/analysis/gpsTrack.ts`).
- **Comments**: Three kinds only. A `@see [SourceKey]` JSDoc tag on every formula or constant derived from published science (the key resolves in `SOURCES.md`; when adding or modifying engine modules, update `SOURCES.md` with any new citations and keep the module in the Validation Summary table). The `// Sources: [Key], …` file header with its `// See packages/engine/SOURCES.md` line. A note that explains why: a choice between published variants, a deliberate non-obvious rule, an accepted approximation. No section banners, no comment that restates the code, no `@param`/`@returns` prose, no unit notes: units are part of the name (`durationSec`, `distanceMeters`, `timeMs`). Specs and config carry no comments.
- **Tests**: `tests/<module>.spec.ts`, node environment, no app setup file (a test that needs a fixed date sets it itself). Records, sessions and other engine entities come from the `createMock<Entity>` factories and series builders of `packages/testing` by relative path (`../../testing/src/…`, because `@pacevault/testing` depends on this package); a spec writes no entity literal. One top-level `describe` per spec: `describe(unit.name, …)` when the spec covers one exported function, the module name as a string when it covers several; nested groups name a sub-unit (`describe(sub.name, …)`) or a short behaviour cluster.

## Verification

```bash
vp check           # from packages/engine
vp test -- --run
```
