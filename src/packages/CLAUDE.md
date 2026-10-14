# Packages

Self-contained modules that could theoretically be extracted into standalone npm packages.

- **No React, no app imports**: Packages must not import from `src/features/`, `src/store/`, `src/components/`, or any React API.
- **Inter-package imports allowed**: A package may import from another package (e.g. `gpx` may use types from `engine`).
- **One directory per package**: Each package lives in its own subdirectory (e.g. `engine/`, `gpx/`). Keep a CLAUDE.md at the package root when the package has its own conventions.
- **Tests**: Mirror the source folder structure under `tests/packages/` (e.g. `tests/packages/engine/zones.spec.ts`, `tests/packages/gpx/buildGpx.spec.ts`).
