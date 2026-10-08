# Engine Rules

- **Purity boundary**: Only two npm deps allowed (`@googlemaps/polyline-codec`, `simplify-ts`). No imports from `src/lib/`, `src/store/`, `src/features/`, or any React/browser API.
- **Type placement**: Core domain types live in `types.ts`; derived/computed types are colocated with their computing module (e.g., `WindExposure` in `windExposure.ts`).
- **Module layout**: Every file follows: imports, exported interfaces, exported constants, unexported helpers, exported functions.
- **Return nullability**: `T | undefined` for insufficient data, `T | null` for no valid result. Never throw.
- **Units**: seconds (duration), metres (distance), sec/km (pace), m/s (speed), watts (power), bpm (HR), unix ms (session and lap dates), elapsed seconds since the first record (record `timestamp`).
- **Constants**: `UPPER_SNAKE_CASE`, exported, declared at file top. Lookup tables as `Record<>` or `Map<>`.
- **Formatter injection**: Display formatting via the `EngineFormatter` strategy interface, defaulting to `defaultFormatter`. Never hardcode locale-specific formatting.
- **Citations**: Every formula or constant derived from published science must have a `@see [SourceKey]` JSDoc tag. When adding or modifying engine modules, update `SOURCES.md` with any new citations and ensure the module appears in the Validation Summary table.
