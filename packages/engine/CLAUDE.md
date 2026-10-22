# @pacevault/engine

**WHY:** The domain logic of PaceVault (metrics, zones, stress, training effect, GPS) as pure functions, so it can be tested without a browser and reused by the app and `@pacevault/gpx`.
**WHAT:** TypeScript sources in `src/`, imported by name with a `.ts` subpath (`@pacevault/engine/zones.ts`); no build step. Tests in `tests/`. Shared code rules: root `CLAUDE.md` §2.

## Rules

- **Pure, no React, no app imports**: No imports from `apps/web` (`@/…`, `src/lib/`, `src/store/`, `src/features/`), no React, no state library, no browser API. Imports only its own modules and its two npm deps, `@googlemaps/polyline-codec` and `simplify-ts`. `vp run workbench:deps` checks this (`engine-is-pure`).
- **Type placement**: Core domain types live in `types.ts`; derived/computed types are colocated with their computing module (e.g., `WindExposure` in `windExposure.ts`).
- **Module layout**: Every file follows: imports, exported interfaces, exported constants, unexported helpers, exported functions.
- **Return nullability**: `T | undefined` for insufficient data, `T | null` for no valid result. Never throw.
- **Units**: seconds (duration), metres (distance), sec/km (pace), m/s (speed), watts (power), bpm (HR), unix ms (session and lap dates), elapsed seconds since the first record (record `timestamp`).
- **Constants**: `UPPER_SNAKE_CASE`, exported, declared at file top. Lookup tables as `Record<>` or `Map<>`.
- **Formatter injection**: Display formatting via the `EngineFormatter` strategy interface, defaulting to `defaultFormatter`. Never hardcode locale-specific formatting.
- **Citations**: Every formula or constant derived from published science must have a `@see [SourceKey]` JSDoc tag. When adding or modifying engine modules, update `SOURCES.md` with any new citations and ensure the module appears in the Validation Summary table.
- **Tests**: `tests/<module>.spec.ts`, node environment, no app setup file (a test that needs a fixed date sets it itself). Factories come from `packages/testing` by relative path (`../../testing/src/…`), because `@pacevault/testing` depends on this package.

## Verification

```bash
vp check           # from packages/engine
vp test -- --run
```
