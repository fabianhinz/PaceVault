# @pacevault/testing

**WHY:** One set of test factories for the app and the packages, so a session or record stream is built the same way everywhere.
**WHAT:** `src/records.ts`, `src/gps.ts`, `src/sessions.ts`, imported as `@pacevault/testing/<factory>.ts`; no build step, no tests of its own. Shared code rules: root `CLAUDE.md` §2.

## Rules

- **Engine only**: Factories import only `@pacevault/engine`; anything that needs app types (`@/types`, profiles) stays in `apps/web/tests/factories/`.
- **Test-only**: Imported from tests, never from app or package sources. The app lists it as a devDependency.
- **Engine tests import by path**: `packages/engine` tests use `../../testing/src/…` instead of the package name, because this package depends on the engine (a workspace cycle trips `vp run`).
- **Randomness**: The record factories use `Math.random` and `makeSession` uses `Date.now()`; assert ranges or pass explicit values when a test needs exact numbers.

## Verification

```bash
vp check           # from packages/testing; the factories are exercised by the app and engine tests
```
