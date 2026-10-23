---
kind: pattern-apply-tdr-reference
id: context-provider-accessor-pairs
title: Every context ships with its accessor hook in one provider module
summary: A project-declared React context, its use<Name>Context accessor and its provider live in one <Name>Provider.tsx; nothing else calls useContext on it, the context defaults to undefined, use<Name>Context throws outside the provider, and callers that may render outside it read useUnstable<Name>Context.
governs:
  - "packages/ui/src/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
adopted_rules: [R1, R2, R3, R5, R6, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Every context ships with its accessor hook in one provider module

## 1. Context

This file carries rules R1, R2, R3, R5, R6, R7 and R8.

A React context cannot express "a provider is mounted above me" in its type: `useContext` hands back the default value, and every consumer that reads the context directly invents its own handling of that default. This convention removes the choice from the consumer: the module that creates a context is the only module that calls `useContext` on it, and it publishes an accessor hook with an explicit return type.

Global, persisted or app-wide state belongs in the zustand store (single-zustand-store-of-slices); what remains in a context is positional — a value scoped to a subtree, such as the bottom sheet's scroll element, its motion and its peek target, which components inside the sheet subtree register with and read.

A context is typed `T | undefined` with an `undefined` default, so "no provider" is a distinct state rather than a fabricated no-op value. The accessor `use<Name>Context` throws when it reads `undefined` (R3): a component that only makes sense inside the provider fails loudly instead of rendering a silent fallback. Some callers legitimately render outside the provider — on desktop the dock, the session list, the map controls and the peeks render outside `BottomSheetProvider` (`apps/web/src/components/layout/AppLayout.tsx`) and must read "no sheet" — and those read `useUnstable<Name>Context`, which returns `T | undefined` and leaves the `undefined` branch to the caller (R5). A kit component that renders nothing in that branch says so with a `console.warn`.

Placing several accessor hooks in one `<Name>Provider.tsx` is a deliberate exception to one-hook-per-file R1, stated here as R6 and recorded there as well.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | `useContext` is called only inside the module that declares the context. No other module imports `useContext` to read a project-declared context. | proposed |
| R2 | The declaring module exports an accessor hook named `use<Name>Context` (and, per R5, `useUnstable<Name>Context`) with an explicit return type. Consumers import those hooks and nothing else. | proposed |
| R3 | Type every context `T \| undefined` and create it with `createContext<T \| undefined>(undefined)`. The accessor `use<Name>Context(): T` throws an `Error` naming itself and the provider (`'use<Name>Context must be used inside <Name>Provider'`) when it reads `undefined`; it never returns a fabricated default. | proposed |
| R5 | A caller that may legitimately render outside the provider reads `useUnstable<Name>Context(): T \| undefined`, exported from the same module, and handles `undefined` itself (optional chaining with an explicit fallback, or an early return). A kit component that renders `null` because the unstable accessor returned `undefined` logs a `console.warn` naming itself and the missing provider. Callers that always render inside the provider use the throwing accessor. | manual |
| R6 | The context objects, their accessor hooks and the provider component live in one module named `<Name>Provider.tsx`, beside the component whose subtree it serves (`packages/ui/src/components/BottomSheetProvider.tsx` next to `BottomSheet.tsx`). The provider renders the context providers around `children` and nothing else, and is typed `FC<PropsWithChildren>`. These accessors are the one exception to one-hook-per-file R1. | manual |
| R7 | A module declaring several contexts exports one accessor per context. | manual |
| R8 | Export the context object itself only when a caller must re-provide a different value; name an exported context `<Name>Context`. A context nothing re-provides stays module-private. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "useContext\\("
  include: ["packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags the declaring modules themselves; a match is a violation only when the same file has no
    createContext( call. Also flags a direct read of a third-party library's context, which is out
    of scope.
R2:
  type: grep
  pattern: "export const use[A-Z][A-Za-z0-9]*Context\\s*=\\s*\\(\\)\\s*:"
  include: ["packages/ui/src/**/*Provider.tsx", "apps/web/src/**/*Provider.tsx"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: "Compares the accessor count with twice the createContext count of the same file (use<Name>Context plus useUnstable<Name>Context)."
R3:
  type: grep
  pattern: "createContext<[^>]*>\\((?!undefined\\))"
  include: ["packages/ui/src/**/*.tsx", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Needs a PCRE grep (rg -P). Also run rg -n 'createContext\\(\\{' for an untyped default object."
R5:
  type: manual
  reason: >
    Whether a caller may render outside the provider depends on the layout (desktop vs. mobile in
    AppLayout); a review checks that useUnstable<Name>Context is used only there and that every
    null render on its undefined branch in packages/ui logs a console.warn.
  enforcedBy: null
R6:
  type: glob
  pattern: "files containing createContext( whose basename does not end in Provider.tsx"
  include: ["packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: manual
  reason: "Requires pairing each createContext with its accessor."
  enforcedBy: null
R8:
  type: grep
  pattern: "export const [A-Za-z0-9]*Context\\s*=\\s*createContext"
  include: ["packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Legitimate when some module re-provides the context with another value; review each hit."
```

## 4. Trade-offs

- **Good, because** no consumer writes its own handling of a missing provider; the default is decided once, in the declaring module.
- **Good, because** the context objects stay module-private: how many contexts back the provider, and what they hold, can change without touching a consumer.
- **Bad, because** a module exporting a component and hooks needs the fast-refresh lint rule to know about the accessor names, and editing it reloads every consumer instead of hot-replacing.
- **Good, because** a sheet-only component rendered outside its provider throws instead of silently rendering a no-op, and the callers that may legitimately be outside are named by their `useUnstable*` accessor.
- **Bad, because** each context needs two accessors, and every unstable caller writes its own `undefined` handling; the desktop renders also log a warning on every render of a sheet-only component.
- **Neutral, because** the accessors still return the whole context value, so a consumer that reads one member re-renders when any member changes; splitting state from actions is a separate decision.

## 5. Reference implementation

```tsx
import { createContext, useContext, useState, type FC, type PropsWithChildren } from 'react';

interface SheetScrollContextValue {
  element: HTMLDivElement | null;
  register: (element: HTMLDivElement | null) => void;
}

const SheetScrollContext = createContext<SheetScrollContextValue | undefined>(undefined);

export const useSheetScrollContext = (): SheetScrollContextValue => {
  const value = useContext(SheetScrollContext);
  if (value === undefined) {
    throw new Error('useSheetScrollContext must be used inside BottomSheetProvider');
  }
  return value;
};

export const useUnstableSheetScrollContext = (): SheetScrollContextValue | undefined =>
  useContext(SheetScrollContext);

export const BottomSheetProvider: FC<PropsWithChildren> = (props) => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  return (
    <SheetScrollContext.Provider value={{ element, register: setElement }}>
      {props.children}
    </SheetScrollContext.Provider>
  );
};
```

```tsx
const register = useSheetScrollContext().register;
const sheetScroller = useUnstableSheetScrollContext()?.element ?? null;
```

## 6. Forbidden practices

- ❌ `useContext(SomeContext)` in a consumer module — every such call site invents its own handling of the default.
- ❌ An accessor that substitutes a fabricated value for a missing provider (`?? {}` inside the hook), or a `createContext` default object of no-ops.
- ❌ Calling `useUnstable<Name>Context` from a component that always renders inside the provider, or the throwing accessor from one that may render outside it.
- ❌ A kit component that silently renders `null` because no provider is mounted.
- ❌ Declaring a context in one module and its provider or accessor in another.
- ❌ Exporting a context object nothing re-provides, or exporting one under a bare `Context` name.
- ❌ A provider that renders markup or styling of its own besides the context providers.
