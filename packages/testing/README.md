# @pacevault/testing

Test factories shared by the app and the packages: record streams (`records.ts`), GPS records (`gps.ts`) and sessions (`sessions.ts`). Built on `@pacevault/engine` types.

## Use

```ts
import { makeSession } from '@pacevault/testing/sessions.ts';
import { makeRunningRecords } from '@pacevault/testing/records.ts';
```

Engine tests import the same files by relative path (`../../testing/src/sessions.ts`), because this package depends on the engine.

## Run and test

```bash
vp check   # from packages/testing; no tests of its own
```

## Depends on it

- `apps/web` tests (devDependency)
- `packages/engine` tests (by relative path)
