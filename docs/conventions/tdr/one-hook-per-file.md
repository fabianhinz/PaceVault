---
kind: pattern-apply-tdr-reference
id: one-hook-per-file
title: One hook per module, module named after the hook
summary: A module exports at most one hook and its filename is that hook's name exactly, so a call site names the file it lives in.
governs:
  - "src/**/use*.ts"
  - "src/**/use*.tsx"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-09-17
---

# One hook per module, module named after the hook

## 1. Context

This file carries R1–R6.

A hook is the unit of reusable behaviour in this application, and the convention is that the unit of behaviour and the unit of file are the same thing: a module exports one hook, and its filename is that hook's name. The payoff is that a hook is locatable from its call site by name alone — reading `useSessionWeather()` tells you the file is `useSessionWeather.ts` — and that a hook can never grow a silent sibling that shares its closure, its imports and its blast radius.

Scope: modules under `src/`. Out of scope: tests, and the question of *which directory* a hook module belongs in, which is the hook-placement record.

One deliberate carve-out is stated as a rule rather than an exception in passing: a context accessor hook sits in the provider module that owns the context.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A module exports at most one hook. A second hook, however closely related, goes in its own module. | proposed |
| R2 | A hook is declared at module top level in a module dedicated to it — never inside, or beside, a module whose purpose is to export a component. | proposed |
| R3 | When a module's basename begins with `use`, the exported hook's name equals the basename exactly: no suffix, no truncation, no casing or singular/plural drift. If the hook's name changes, the filename changes with it. | proposed |
| R4 | A hook module may export supporting declarations alongside its hook — the hook's return type, its option type, a constant it reads, a pure helper it delegates to. This is one *hook* per module, not one *export* per module. | manual |
| R5 | A supporting export in a hook module exists to serve that hook or its callers' types. A helper with independent consumers moves to a topic-named sibling module. | manual |
| R6 | A context accessor hook is exempt from R1 and R3: it is declared in the provider module that creates the context, which also exports the provider component. A provider module may export more than one accessor when it exposes independently-subscribable slices. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^export const use[A-Z]"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/store/**", "src/components/ui/toastStore.ts", "src/paraglide/**"]
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Counts store hooks (`useSessionsStore`) as hooks; the exempt list covers the store directory,
    but a store declared elsewhere would be flagged. A provider module exporting several accessors
    is R6, not a violation.
R2:
  type: grep
  pattern: "^(const|export const) use[A-Z][A-Za-z0-9]* = "
  include: ["src/**/*.tsx"]
  exempt: ["src/**/use*.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A provider module declaring its own accessor is R6. A `.tsx` whose basename begins with `use`
    is exempt because it is a hook module that returns JSX.
R3:
  type: glob
  pattern: "for each src/**/use*.{ts,tsx}, an `export const <basename>` exists in that file"
  include: ["src/**/use*.ts", "src/**/use*.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: manual
  reason: >
    This rule permits supporting exports; there is nothing to flag, only something not to flag.
  enforcedBy: null
R5:
  type: manual
  reason: >
    Whether a supporting export has independent consumers needs a usage search per symbol.
  enforcedBy: null
R6:
  type: manual
  reason: >
    Recognising a context accessor means reading what the module creates, not matching its name.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the import path is derivable from the call — no search step between reading `useMapTracks()` and opening the file.
- **Good, because** two hooks cannot quietly share a closure, a module-level cache or a set of imports, so one hook's dependency never becomes another's by accident.
- **Bad, because** closely related hooks that would read well together are split across files, and the relationship between them survives only in the directory listing.
- **Neutral, because** the rule constrains cardinality and naming but says nothing about placement or length, so it has to be read alongside two sibling records to be actionable.

## 5. Reference implementation

```
src/features/map/hooks/useMapTracks.ts
  export interface MapTracks { … }          ← supporting export, R4
  export const useMapTracks = (…): MapTracks => { … }   ← the one hook, name == basename
```

A second map hook — `useMapPopupState` — is its own module beside it, not a second export here.

## 6. Forbidden practices

- ❌ A second `export const useSomething` in a module that already exports a hook.
- ❌ Declaring a hook at the top of the component module that happens to be its only caller today; the first second caller then has to move it anyway.
- ❌ `useHydrated.ts` exporting `useStoresHydrated` — the call site names one thing and the file names another, so neither is findable from the other.
- ❌ Casing drift between file and export (`useGpsBackfill.ts` exporting `useGPSBackfill`); on a case-insensitive filesystem this hides until CI runs on Linux.
- ❌ Splitting a hook's own return type or option type into a separate module to satisfy "one export per file" — R4 says that is not the rule.
