# @pacevault/gpx

GPX for PaceVault: parse a GPX route (`parseGpx`), build a GPX file from a session or route (`buildGpx`), cut a route into segments (`routeCut`), and derive its geometry and elevation profile (`routeGeometry`, `routeProfile`). Pure TypeScript on top of `@pacevault/engine`.

## Use

```ts
import { parseGpx } from '@pacevault/gpx/parseGpx.ts';
```

The package exports its sources (`"./*": "./src/*"`); there is no build step.

## Run and test

```bash
vp check           # from packages/gpx
vp test -- --run   # tests/*.spec.ts in jsdom (DOMParser), fixtures in tests/fixtures/
```

## Depends on it

- `apps/web` (`@pacevault/web`): route studio import and GPX export
