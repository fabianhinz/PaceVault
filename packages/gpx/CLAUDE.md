# @pacevault/gpx

**WHY:** GPX import and export for the route studio and session export, kept apart from the app so it stays pure and testable.
**WHAT:** TypeScript sources in `src/` (`parseGpx`, `buildGpx`, `routeCut`, `routeGeometry`, `routeProfile`, `simplifyGpxPoints`), imported by name with a `.ts` subpath (`@pacevault/gpx/parseGpx.ts`); no build step. Tests in `tests/`. Shared code rules: root `CLAUDE.md` §2.

## Rules

- **Pure, no React, no app imports**: No imports from `apps/web` (`@/…`), no React, no state library. Imports `@pacevault/engine` (types, gradient, GPS helpers), `zod`, `simplify-ts` and `@googlemaps/polyline-codec`. `DOMParser` (in `parseGpx.ts`) is the one browser API it uses.
- **External data through Zod**: Parsed GPX is validated with `safeParse`; on failure return a safe fallback, never throw.
- **Tests**: `tests/<module>.spec.ts` in jsdom (for `DOMParser`), no app setup file. Fixtures live in `tests/fixtures/` (`route.gpx` is a copy of the e2e fixture). A snapshot is allowed for file-format output; `buildGpx` locks the exported XML other apps read.

## Verification

```bash
vp check           # from packages/gpx
vp test -- --run
```
