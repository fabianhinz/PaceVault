# @pacevault/gpx

**WHY:** GPX import and export for the route studio and session export, kept apart from the app so it stays pure and testable.
**WHAT:** TypeScript sources in `src/` (`parseGpx`, `buildGpx`, `routeCut`, `routeGeometry`, `routeProfile`, `types`), imported by name with a `.ts` subpath (`@pacevault/gpx/parseGpx.ts`); no build step. Tests in `tests/`. Shared code rules: root `CLAUDE.md` §2.

## Rules

- **Pure, no React, no app imports**: No imports from `apps/web` (`@/…`), no React, no state library. Imports `@pacevault/engine` (types, gradient, GPS helpers) and `zod`, nothing else at runtime. `DOMParser` (in `parseGpx.ts`) is the one browser API it uses. GPX parse and build are its only serialization: route polylines (`apps/web/src/lib/analysis/gpsTrack.ts`), display rounding (`apps/web/src/components/charts/chartData.ts`) and export file names (`apps/web/src/components/sessions/gpxExport.ts`) live in the app.
- **Type placement**: A type read by more than one gpx module lives in `types.ts` (`RoutePoint`), which holds only declarations and imports nothing but the schema-inferred `ParsedGpxPoint` type it extends. A type read by one gpx module stays in it, exported when the app or a spec reads it (`GpxPoint` in `buildGpx.ts`, `RouteElevationStats` in `routeGeometry.ts`); a type inferred from a schema stays beside it (`ParsedGpxPoint` in `parseGpx.ts`).
- **Module layout**: Every file follows: imports, types and interfaces (exported or not), constants (exported or not), unexported helpers, exported functions.
- **Constants**: A value that governs behaviour (threshold, bound, output precision) is a module-scope `UPPER_SNAKE_CASE` constant at the top of the module, named for its reason with its unit in long form (`ELEVATION_HYSTERESIS_METERS`), and exported only when another module or a spec imports it.
- **External data through Zod**: Parsed GPX is validated with `safeParse`; on failure return a safe fallback, never throw.
- **Parameters**: A function with two or more inputs takes one destructured object with an inline type (`({ points, startMeters, endMeters }: { points: RoutePoint[]; startMeters: number; endMeters: number })`), the interpolation helpers included; one input stays positional. Only callback contracts (`Array.prototype` callbacks, `sort` comparators) keep positional lists.
- **Comments**: Three kinds only, as in `packages/engine`: a `@see [SourceKey]` JSDoc tag on a published formula (the key resolves in `packages/engine/SOURCES.md`; add new citations there and list gpx heuristics in its App-Specific Logic table), a `// Sources:` file header, and a note that explains why. No section banners, no comment that restates the code, no `@param`/`@returns` prose, no unit notes: units are part of the name (`distanceMeters`). Specs and config carry no comments.
- **Tests**: `tests/<module>.spec.ts` in jsdom (for `DOMParser`), no app setup file. Fixtures live in `tests/fixtures/` (`route.gpx` is a copy of the e2e fixture). A snapshot is allowed for file-format output; `buildGpx` locks the exported XML other apps read. Route points, GPX points, waypoints and metadata come from the `createMock<Entity>` factories of `packages/testing/src/route.ts` by relative path (`../../testing/src/route.ts`); a spec writes no entity literal. One top-level `describe` per spec: `describe(unit.name, …)` when the spec covers one exported function, the module name as a string when it covers several; nested groups name a sub-unit (`describe(sub.name, …)`) or a short behaviour cluster.

## Verification

```bash
vp check           # from packages/gpx
vp test -- --run
```
