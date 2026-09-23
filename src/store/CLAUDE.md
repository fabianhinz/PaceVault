# Store & State Rules

- **Scope-clear store naming**: When store actions serve one specific feature, name them to reflect that exact scope (e.g., `setDashboardChartRange`, not `setCustomRange`).
- **Persistence**: All persisted stores must use `createJSONStorage(() => idbStorage)` with `skipHydration: true`, starting at `version: 1`. A change to the persisted shape bumps the version and ships a `migrate`. Persist key format: `store-<name>` (e.g. `store-sessions`, `store-layout`). No store should use localStorage.
- **Testing Requirement**: Tests are strictly required for all state transitions, persistence logic, and derived computations.
