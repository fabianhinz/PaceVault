# Feature Architecture Rules

- **Feature-level hooks**: Feature-specific hooks must live in `src/features/<feature>/hooks/` using camelCase file naming (e.g., `useDashboardChartZoom.ts`).
- **Colocate store subscriptions**: Do not hoist store reads in parent components just to pass them down as props. Let child components subscribe directly to the store via hooks to prevent unnecessary re-renders.
