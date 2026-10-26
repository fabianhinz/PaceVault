# @pacevault/testing

Test factories shared by the app and the packages: `createMock<Entity>` factories per entity (`sessions.ts`, `records.ts`, `gps.ts`, `personalBests.ts`, `dailyMetrics.ts`, `route.ts`) and record, lap and session series (`series.ts`). Built on `@pacevault/engine` and `@pacevault/gpx` types.

## Use

```ts
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { runningRecordSeries } from '@pacevault/testing/series.ts';
```

Engine tests import the same files by relative path (`../../testing/src/sessions.ts`), because this package depends on the engine.

## Run and test

```bash
vp check   # from packages/testing; no tests of its own
```

## Depends on it

- `apps/web` tests (devDependency)
- `packages/engine` tests (by relative path)
