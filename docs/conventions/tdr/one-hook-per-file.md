---
kind: pattern-apply-tdr-reference
id: one-hook-per-file
title: One hook per module, module named after the hook
summary: A module exports at most one hook, never sits inside a component module, and a use*-named module's basename equals its exported hook's name.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# One hook per module, module named after the hook

## 1. Context

This file carries rules R1–R5.

A hook is the unit of reusable behaviour in `apps/web/src`, and the unit of behaviour and the unit of file are the same thing: a module exports one hook, and its filename is that hook's name. A hook is then locatable from its call site by name alone — reading `useSessionTitle()` tells you the file is `useSessionTitle.ts` — and it can never grow a silent sibling that shares its closure, its imports and its blast radius.

Scope: modules under `apps/web/src` and `packages/ui/src`. Out of scope: tests, the zustand store modules in `apps/web/src/store/` (their `use<Name>Store` accessors belong to the store definition), and *which directory* a hook module belongs in, which is `hook-directory-placement`. The root `CLAUDE.md` file-naming table already requires hooks to be camelCase with a `use` prefix; this record adds cardinality and the basename-to-export correspondence.

The rules bind the board island of `tools/workbench` (`tools/workbench/site/src/`) as well.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A module exports at most one hook. A second hook, however closely related — including a private helper hook the first one calls — goes in its own module. Exception: a context provider module (`<Name>Provider.tsx`, context-provider-accessor-pairs R6) exports one `use<Name>Context` accessor per context it declares. | proposed |
| R2 | A hook is declared at module top level in a module dedicated to it — never inside, or beside, a module whose purpose is to export a component. The same provider-module exception applies: its accessors sit beside the provider component. | proposed |
| R3 | When a module's basename begins with `use`, the exported hook's name equals the basename exactly: no suffix, no truncation, no casing or singular/plural drift (`useGpsBackfill.ts` exports `useGpsBackfill`). If the hook's name changes, the filename changes with it. | proposed |
| R4 | A hook module may export supporting declarations alongside its hook — the hook's return type, its option type, a constant it reads, a pure helper it delegates to. This is one *hook* per module, not one *export* per module. | manual |
| R5 | A supporting export in a hook module exists to serve that hook or its callers' types. A helper with independent consumers moves to a topic-named sibling module. | manual |

## 3. Detection

The load-bearing signal is a basename-to-export comparison, and its blind spot is structural: a check that only opens `use*`-named files cannot see a hook declared anywhere else. R2 closes that blind spot and runs over all modules.

```yaml
R1:
  type: grep
  pattern: "^(export )?const (use[A-Z][A-Za-z0-9]*)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["apps/web/src/store/**"]
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Counts top-level declarations per file; more than one per file is a violation. A re-export line
    (`export { useX } from`) matches nothing and is invisible to this signal.
R2:
  type: grep
  pattern: "^(export )?const use[A-Z]\\w* = "
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: ["apps/web/src/**/use*.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A grep approximation: any top-level hook declaration in a .tsx module not named use* is a
    violation. Cannot see a hook declared in a .ts module that exports neither a hook nor a
    component; run the R1 grep over non-use .ts files for that.
R3:
  type: manual
  reason: >
    Per-file comparison: for each file whose basename matches /^use[A-Z]/, capture every
    `^export const (use[A-Z]\w*)` and flag the file when no capture equals the basename. A shell
    loop does it: `for f in $(find apps/web/src -name 'use[A-Z]*.ts*'); do b=$(basename $f | sed -E 's/\.tsx?$//'); grep -qE "export const $b( |<|:|=)" $f || echo $f; done`.
  include: ["apps/web/src/**/use*.ts", "apps/web/src/**/use*.tsx", "packages/ui/src/**/use*.ts", "packages/ui/src/**/use*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  enforcedBy: null
  falsePositives: >
    Blind to hooks in modules NOT named use*; pair with R2. Wrongly flags a use*-named module that
    re-exports its hook from a sibling.
R4:
  type: manual
  reason: >
    Deciding that a non-hook export is "supporting" requires reading what it is — a return type, an
    options type, a threshold constant, a pure helper the hook delegates to.
  enforcedBy: null
R5:
  type: manual
  reason: >
    Requires following import edges to see whether a helper has consumers outside its own module's
    hook. A single-file signal cannot see the consumer set.
  enforcedBy: null
```

Nothing in the root `vite.config.ts` lint block enforces any of this; `react-hooks/rules-of-hooks` governs hook usage, not module layout. Every entry is `proposed` or `manual` with `enforcedBy: null`.

## 4. Trade-offs

- **Good, because** a hook is reachable from its name with no search: the call site names the file and the import path, which is as useful to an agent editing the code as to a human reading it.
- **Good, because** a hook's dependency surface is exactly its module's import list. When two hooks share a file, the reader cannot tell which imports belong to which, and an unrelated edit to one hook pulls the other into the diff.
- **Good, because** renaming a hook becomes a mechanical, verifiable operation: the filename must move with it, and a stale filename is visible without reading the file.
- **Bad, because** it produces a very large number of very small modules. Two hooks that are genuinely a pair get split across two files, and following the pair costs a jump that a single scroll would have covered.
- **Bad, because** R3 makes the filename part of the API, so every rename is a file move. In review a moved file reads as a bigger change than a renamed symbol.
- **Neutral, because** the rule constrains hooks only. Types, constants and helpers ride along in the same module, so the file count tracks the number of behaviours, not the number of exports.

## 5. Reference implementation

```ts
// apps/web/src/lib/hooks/useDebouncedValue.ts — basename == exported hook
export const INPUT_DEBOUNCE_MS = 600;

export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);
  useDebounce(() => setDebounced(value), delayMs, [value]);
  return debounced;
};
```

A second, related hook does not join it — `useMapCameraTarget` gets `useMapCameraTarget.ts` beside `useMapCameraEffect.ts`, and the hook `Dock.tsx` needs lives in `useDockList.ts`, not inside the component module.

## 6. Forbidden practices

- A `useX.ts` whose exported hook is `useXMutation`, `useXSession` or any other extension of the basename — the call site names a file that does not exist.
- Casing or singular/plural drift between filename and export (`useGpsBackfill.ts` exporting `useGPSBackfill`, `useHydrated.ts` exporting `useStoresHydrated`).
- Two hooks in one module, even when one is a private helper of the other.
- Declaring a hook inside a component module because that component is its only caller today (`useDockList` in `Dock.tsx`, `useHeldReprocess` in `ImportProgressOverlay.tsx`). The hook is a separate unit of behaviour and of test.
- A `hooks.ts` or `useHelpers.ts` collecting several unrelated hooks.
