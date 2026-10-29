# @pacevault/testing

**WHY:** One set of test factories for the app and the packages, so a session or record stream is built the same way everywhere.
**WHAT:** Entity factories (`src/sessions.ts`, `src/records.ts`, `src/gps.ts`, `src/personalBests.ts`, `src/dailyMetrics.ts`, `src/route.ts`, each exporting only `createMock<Entity>(overrides?)`) and the series builders in `src/series.ts`, imported as `@pacevault/testing/<module>.ts`; no build step, no tests of its own. Shared code rules: root `CLAUDE.md` §2.

## Rules

- **Engine and gpx only**: Factories import only `@pacevault/engine` and `@pacevault/gpx`; anything that needs app types (`@/types`, profiles) stays in `apps/web/tests/factories/`.
- **Test-only**: Imported from tests, never from app or package sources. The app lists it as a devDependency.
- **Engine tests import by path**: `packages/engine` tests use `../../testing/src/…` instead of the package name, because this package depends on the engine (a workspace cycle trips `vp run`).
- **Randomness**: The record series use `Math.random` and `createMockTrainingSession` uses `Date.now()`; assert ranges or pass explicit values when a test needs exact numbers.
- **Parameters**: A function with two or more inputs takes one destructured object with an inline type (`cyclingRecordSeries({ count, basePowerWatts })`), `clamp` and the random-walk helpers included; a factory takes only its optional `overrides`, a builder of only a count takes it bare. Only callback contracts (`Array.prototype` callbacks) keep positional lists.

## Verification

```bash
vp check           # from packages/testing; the factories are exercised by the app and engine tests
```
