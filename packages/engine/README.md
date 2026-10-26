# @pacevault/engine

PaceVault's domain logic as pure TypeScript functions: record pairs and normalized effort, training load and stress, zones, training effect, VDOT and pace calculation, decoupling, climbs and gradient, wind exposure, geodesy and bounding boxes, effort detection and change points. No React, no state, no browser API.

How each metric is calculated, and the research behind it: [`SOURCES.md`](./SOURCES.md).

## Use

```ts
import { stressFromSummary } from '@pacevault/engine/stress.ts';
import type { Sport } from '@pacevault/engine/types.ts';
```

The package exports its sources (`"./*": "./src/*"`); there is no build step.

## Run and test

```bash
vp check           # from packages/engine
vp test -- --run   # tests/*.spec.ts, node environment
```

## Depends on it

- `apps/web` (`@pacevault/web`)
- `packages/gpx` (`@pacevault/gpx`)
- `packages/testing` (`@pacevault/testing`)
