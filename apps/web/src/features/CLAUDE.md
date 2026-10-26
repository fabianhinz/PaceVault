# Feature Architecture Rules

- **Hook placement**: A hook lives in the `hooks/` directory of the concept it is about, at whatever depth owns that concept (`features/sessions/session/hooks/` beside `features/sessions/hooks/` is correct), camelCase and named after the hook (e.g. `useDashboardChartZoom.ts`). A directory holds either a `hooks/` subdirectory or loose `use*` siblings, never both. Server reads and writes are not feature hooks: they live in `src/queries/` and `src/mutations/`.
- **Colocate store subscriptions**: Do not hoist store reads in parent components just to pass them down as props. Let child components subscribe directly to the store via hooks to prevent unnecessary re-renders.
