---
kind: pattern-apply-tdr-reference
id: mirrored-spec-layout
title: Specs live in one tests tree that mirrors the source tree
summary: App specs live under apps/web/tests, mirror their subject's src path, are named <subject>[.<qualifier>].spec.ts(x), never sit under src, and share helpers only through @testUtils.
governs:
  - "apps/web/tests/**"
  - "apps/web/src/**"
  - "apps/web/vitest.config.ts"
  - "packages/ui/tests/**"
  - "packages/ui/src/**"
  - "packages/engine/tests/**"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
  - "tools/workbench/tests/**/*.ts"
adopted_rules: [R1, R2, R3, R5, R8, R9, R10]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Specs live in one tests tree that mirrors the source tree

## 1. Context

This file carries R1, R2, R3, R5, R8, R9 and R10. `apps/web/vitest.config.ts` runs one test project (`environment: 'jsdom'`, `globals: true`, setup file `apps/web/tests/setup.ts`) whose `include` is `tests/**/*.spec.{ts,tsx}`. A spec placed beside its subject under `apps/web/src/` never runs at all, and a spec with any other suffix is silently skipped. Inside `apps/web/tests/` the path mirrors the `apps/web/src/` path of the module under test, so a reader moves between a module and its spec by swapping one prefix rather than searching.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant: a kit spec mirrors `packages/ui/src/X` at `packages/ui/tests/X.spec.ts`, imports its subject by relative path (the kit has no alias, `packages/ui/CLAUDE.md` § Rules), and has no shared-helper alias. `packages/engine` follows R1, R3, R5 and R10 the same way: its `src/` is flat, so a spec mirrors `packages/engine/src/X.ts` at `packages/engine/tests/X.spec.ts` (`X.<qualifier>.spec.ts` for a second spec of the same module), and its factories come from `packages/testing` by relative path.

Scope: unit and integration specs for `apps/web`'s own source. Out of scope: the Playwright specs in `apps/web/e2e/` (own runner, own config, untouched). Fixed points that mirror nothing: the setup file `apps/web/tests/setup.ts` (fixed date, store reset, fake IndexedDB, `localStorage.clear()`), the factory modules in `apps/web/tests/factories/` (imported as `@tests/factories/<module>.ts`), the shared helpers in `apps/web/tests/testUtils/` (imported as `@testUtils/<module>.ts`) and the ambient declarations in `apps/web/tests/types/`. Test APIs are imported from `vite-plus/test`. Package specs (`packages/*/tests/`) and workbench specs (`tools/workbench/tests/`) follow the same mirror inside their own package.

The rules bind `tools/workbench` as well: its spec tree `tools/workbench/tests/` mirrors the package's two source roots, `scripts/x.ts` → `tests/scripts/x.spec.ts` and `site/src/<path>/x.ts` → `tests/site/src/<path>/x.spec.ts` (R2), and several specs of one subject carry a qualifier (`tests/site/src/actions/index.read.spec.ts`, R10). Its specs import the test API from `vite-plus/test`. R8 and R9 have no subject there (no shared helpers, no ambient test types).

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Never place a spec file under `apps/web/src/`. Every app spec lives under `apps/web/tests/`. | manual |
| R2 | A spec's path inside `apps/web/tests/` mirrors its subject's path inside `apps/web/src/`: a module at `apps/web/src/X.ts` is specified at `apps/web/tests/X.spec.ts`. Directory names and casing are reproduced exactly. | manual |
| R3 | Name the spec after the module it covers, suffixed `.spec.ts`, or `.spec.tsx` when the spec itself contains JSX. There is no `.test.ts` suffix. A spec covering a module with a differently spelled or pluralised name is misnamed, not merely inconsistent. | manual |
| R5 | When a subject is renamed or moved within `apps/web/src/`, rename or move its spec in the same change so the mirror holds. A spec left at the old path still passes and will not be found from the new one. | manual |
| R8 | Colocate a spec's own fixtures — binary artefacts, recorded payloads, fixture-building modules — in the mirrored directory beside the spec. Put helpers shared across specs in `apps/web/tests/testUtils/` and import them through the `@testUtils` alias. | manual |
| R9 | Put ambient type declarations that specs depend on — custom matcher augmentations, polyfill shims — in `apps/web/tests/types/` as `.d.ts` files, one per augmented surface. The matcher registration belongs in `apps/web/tests/setup.ts`; only its declaration goes here. | manual |
| R10 | When one subject needs several spec files, keep the mirrored path and add a qualifier segment before `.spec` (`chartData.integration.spec.ts`, `fit.laps.spec.ts`) rather than inventing a parallel directory. | manual |

## 3. Detection

The path arithmetic in R2 and the absence in R1 are directly executable: take a spec path, strip `apps/web/tests/`, the qualifier segments and `.spec`, and require a file at the corresponding `apps/web/src/` path. R3, R5 and R8–R10 need the spec's imports read or a change compared. Nothing in the toolchain fails on a broken mirror: the vitest `include` glob decides only whether a file runs.

```yaml
R1:
  type: glob
  pattern: "apps/web/src/**/*.spec.ts, apps/web/src/**/*.spec.tsx, apps/web/src/**/*.test.ts, apps/web/src/**/*.test.tsx"
  include: ["apps/web/src/**", "packages/ui/src/**", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: manual
  reason: >
    The check itself is mechanical — strip `apps/web/tests/`, qualifier segments and `.spec`, then
    require `apps/web/src/<rest>.{ts,tsx}` or `apps/web/src/<rest>/index.{ts,tsx}` to exist — but it
    needs filesystem resolution across two directories, which a single-file pattern cannot express.
    Skip the fixed points (`setup.ts`, `factories/`, `testUtils/`, `types/*.d.ts`). Treat a
    non-resolving path as a finding to triage, not a failure: the subject may be a directory of
    small modules or a spec may predate a rename.
  enforcedBy: null
R3:
  type: manual
  reason: >
    Detecting a misnamed spec requires comparing the filename against the module its imports
    actually pull in; near-miss spellings and singular/plural drift are exactly the cases a name
    comparison alone cannot decide. The one mechanical part — no `.test.ts` file under
    `apps/web/tests/` — is `find apps/web/tests -name '*.test.ts*'` printing nothing.
  enforcedBy: null
R5:
  type: manual
  reason: >
    Only visible across a change, by comparing renamed `apps/web/src/` paths against renamed spec
    paths in the same diff. Not a property of a checkout.
  enforcedBy: null
R8:
  type: manual
  reason: >
    Distinguishing a spec-local fixture from a helper that several specs already import requires
    counting importers across the tree; a file's location alone does not say which it is.
  enforcedBy: null
R9:
  type: glob
  pattern: "apps/web/tests/**/*.d.ts"
  include: ["apps/web/tests/**", "packages/ui/tests/**", "packages/engine/tests/**", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts"]
  exempt: ["apps/web/tests/types/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A generated or vendored declaration file that a fixture depends on would be flagged although it
    is not an ambient augmentation.
R10:
  type: manual
  reason: >
    A qualifier segment and a genuinely misplaced spec are indistinguishable by pattern; deciding
    requires resolving the base path after dropping the qualifier.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** navigation is arithmetic: swap `apps/web/tests/` for `apps/web/src/` and drop `.spec`, in either direction, which an agent can do without a search.
- **Good, because** one suffix and one tree mean one `include` glob; a spec either runs or is visibly misnamed.
- **Bad, because** the mirror is a convention held by hand. Moving or renaming a source module does not move its spec and nothing complains: the spec keeps passing at the old path, and the next reader looking beside the new module finds no coverage. Whole subtrees drift this way when a directory level is removed from `apps/web/src/` and the tests tree keeps it.
- **Bad, because** a module's spec is not visible in its own directory listing. Whether a module is covered at all cannot be answered by looking at it, only by resolving into another tree.
- **Neutral, because** the layout does not distinguish unit from integration specs; both sit at the mirrored path of their entry module, and a spec's breadth is visible only from its contents or its `.integration` qualifier.

## 5. Reference implementation

The convention is path arithmetic, so the mapping table is the implementation:

```text
apps/web/src/lib/chartData.ts
  -> apps/web/tests/lib/chartData.spec.ts
  -> apps/web/tests/lib/chartData.integration.spec.ts           (one subject, several specs)

apps/web/src/parsers/fit.ts
  -> apps/web/tests/parsers/fit.spec.ts
  -> apps/web/tests/parsers/fit.laps.spec.ts
  -> apps/web/tests/parsers/fit.thresholds.integration.spec.ts

apps/web/src/store/sessions.ts
  -> apps/web/tests/store/sessions.integration.spec.ts

apps/web/src/features/map/hooks/useMapTracks.ts
  -> apps/web/tests/features/map/hooks/useMapTracks.integration.spec.ts
```

Fixed points, none of which mirror anything:

```text
apps/web/tests/setup.ts          the one setup file: fake IndexedDB, fixed date, store reset, localStorage.clear
apps/web/tests/factories/*       entity factories, imported via the `@tests` alias
apps/web/tests/testUtils/*       cross-spec helpers, imported via the `@testUtils` alias
apps/web/tests/types/*.d.ts      ambient declarations (matcher augmentation, polyfill shims)
```

The wiring in `apps/web/vitest.config.ts`:

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@tests': path.resolve(__dirname, 'tests'),
    '@testUtils': path.resolve(__dirname, 'tests/testUtils'),
  },
},
test: {
  environment: 'jsdom',
  setupFiles: ['tests/setup.ts'],
  include: [],
  globals: true,
},
```

A spec in its shape: the subject imported through `@/` at the path the spec mirrors, a shared helper through `@testUtils`:

```ts
import { describe, expect, it } from 'vite-plus/test';
import { parseFitFile } from '@/parsers/fit.ts';
import { readE2eFixture } from '@testUtils/fixtures.ts';

const profile = () => ({ restHr: 48, maxHr: 188, gender: 'male' as const, ftp: 265 });

describe(parseFitFile.name, () => {
  it('reads the laps of a running file', async () => {
    const parsed = await parseFitFile(readE2eFixture('running.fit'), 'running.fit', profile);

    expect(parsed.laps).not.toEqual([]);
  });
});
```

## 6. Forbidden practices

- ❌ A `*.spec.ts` or `*.test.ts` beside its subject under `apps/web/src/` — the vitest `include` does not reach it, so it never runs and never fails; it reads as coverage that does not exist.
- ❌ A `.test.ts` suffix, or a `.integration.test.ts` file, under `apps/web/tests/` — the `include` glob skips it.
- ❌ Reorganising a spec's directory for the tests' own convenience — grouping by feature, by concern, or by who wrote them (an `apps/web/tests/packages/engine/` bucket for app wiring specs) — when `apps/web/src/` is organised differently. The mirror is the index.
- ❌ Keeping the old tests-tree shape after flattening or renaming a directory in `apps/web/src/`. Once the trees disagree on a level, every spec below that point is unreachable by path arithmetic.
- ❌ A spec named for a scenario or an old module name (`storeEngine.integration.spec.ts`, `utils.spec.ts` for `formatters.ts`) instead of `<subject>.<qualifier>.spec.ts`.
- ❌ Promoting a spec-local fixture to `apps/web/tests/testUtils/` for a single consumer, or leaving a helper that several specs already copy colocated beside each of them.
