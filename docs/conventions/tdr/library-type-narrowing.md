---
kind: pattern-apply-tdr-reference
id: library-type-narrowing
title: Component props are derived from the component value
summary: A component that wraps or delegates to another derives that prop surface with ComponentProps<typeof X> (composing Pick/Partial/Required over it), never restates it; children-only components are FC<PropsWithChildren>.
governs:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R3, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Component props are derived from the component value

## 1. Context

This file carries rules R1, R3, R5, R6 and R7.

A component that wraps, decorates or delegates to another component needs that other component's prop surface in its own type. This convention governs how that derivation is *declared*: the source is named by the component value (`ComponentProps<typeof DialogRoot>`), not by an imported props alias and not by restating fields, so a wrapper cannot drift from what it wraps. Removing keys from a component's props has no helper of its own: neither `apps/web` nor `packages/ui` has a single `Omit` over a component's props, so a helper would be code nothing imports. Wrappers compose `Pick`/`Partial`/`Required` over the derived type, and a kit wrapper that strips its own props before forwarding the rest to a primitive does so with the rest-destructure `packages/ui/CLAUDE.md` allows. The rules hold in `apps/web/src` and in `packages/ui/src`; for an intrinsic element the value form is `ComponentProps<'button'>` (not `ButtonHTMLAttributes<HTMLButtonElement>`).

Scope is deliberately narrow: the source type must be a **component's** props. Narrowing anything else — a domain model, a persisted shape, an options bag — stays a plain `Omit<>`/`Pick<>` (R5). How a props type is declared in the first place (name, placement, `props` parameter) is component-declaration-shape; which package a wrapped component comes from is ui-primitives-from-react-ui.

The rules bind the board island of `tools/workbench` (`tools/workbench/site/src/**/*.tsx`) as well.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Derive another component's prop surface from the component *value* (`ComponentProps<typeof X>`, `type ComponentProps` imported from `react`), never from a separately imported props alias and never by restating its fields. | manual |
| R3 | `Pick`, `Partial` and `Required` are used directly, composed *over* the derived type — `Required<Pick<ComponentProps<typeof DialogRoot>, 'open' \| 'onOpenChange'>>` — rather than over a restated alias. | manual |
| R5 | `Omit<>` is the correct and expected form when the source is not a component's props. Do not route a domain model, persisted shape or parameter bag through a component-props helper. | manual |
| R6 | A component whose only prop is children is typed `FC<PropsWithChildren>`. Do not spell the object out inline and do not declare a one-member `{ children: ReactNode }` interface. | proposed |
| R7 | A props interface that carries other members declares `children` as an ordinary member typed `ReactNode`. Do not wrap the interface in `PropsWithChildren<>` and do not `extends PropsWithChildren`. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Distinguishing "restated the fields" from "declared its own props that happen to overlap"
    needs the wrapped component's signature. A useful prompt: props members that are passed
    straight through to a kit component (open/onOpenChange to DialogRoot, value/onValueChange to
    Tabs or SelectRoot).
  enforcedBy: null
R3:
  type: manual
  reason: >
    The conforming and non-conforming forms are syntactically identical; only the identity of the
    source type separates them.
  enforcedBy: null
R5:
  type: manual
  reason: "This rule exists to stop a false positive, not to find one."
  enforcedBy: null
R6:
  type: grep
  pattern: "FC<\\{\\s*children\\??:|props: \\{ children\\??: (React\\.)?ReactNode \\}|interface [A-Za-z]+Props \\{\\n\\s+children\\??: (React\\.)?ReactNode;\\n\\}"
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    The interface alternative needs a multi-line search (rg -U). Would wrongly flag a children
    member deliberately narrower than ReactNode (a single ReactElement).
R7:
  type: grep
  pattern: "(extends PropsWithChildren\\b|PropsWithChildren<)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Deliberately does not match the bare FC<PropsWithChildren> form, which R6 requires. Blind to
    a missing children member.
```

## 4. Trade-offs

- **Good, because** naming the source as `typeof Component` means there is exactly one place the prop surface is written down. A wrapper picks up a changed upstream type automatically and cannot drift from a hand-copied member.
- **Good, because** a renamed or removed upstream prop breaks the build at the derivation, where a restated member would keep compiling against a prop the wrapped component no longer has.
- **Bad, because** it is asymmetric and therefore hard to remember: component props are derived, everything else is narrowed with plain utility types, and a reader who internalises one half will be wrong about the other.
- **Bad, because** `typeof X` forces a value import of the wrapped component where an `import type` would otherwise do.
- **Bad, because** a derived surface is less deliberate than a hand-written one: a wrapper that picks too much inherits props it does not honour, and nothing signals that until someone passes one.

## 5. Reference implementation

```tsx
import type { ComponentProps, FC, PropsWithChildren } from 'react';
import { DialogContent, DialogRoot } from '@pacevault/ui/components/Dialog.tsx';

interface DeleteTripDialogProps
  extends Required<Pick<ComponentProps<typeof DialogRoot>, 'open' | 'onOpenChange'>> {
  tripId: string;
  tripName: string;
  onDeleted?: () => void;
}

export const DeleteTripDialog: FC<DeleteTripDialogProps> = (props) => (
  <DialogRoot open={props.open} onOpenChange={() => props.onOpenChange(false)}>
    <DialogContent />
  </DialogRoot>
);

const CardBody: FC<PropsWithChildren> = (props) => <div className="flex flex-col gap-4">{props.children}</div>;

type TripInput = Omit<Trip, 'id'>;
```

## 6. Forbidden practices

- ❌ Copying a wrapped component's props into a hand-written interface (`open: boolean; onOpenChange: (open: boolean) => void;` beside a `DialogRoot`) — it is a snapshot that nothing keeps current.
- ❌ Importing a separately published props alias for a component whose value is available, instead of `ComponentProps<typeof X>`.
- ❌ Reaching for a component-props helper to trim a domain model, persisted shape or options bag — `Omit<>` is the right tool there.
- ❌ `(props: { children: ReactNode })` or a one-member `{ children: ReactNode }` interface when children is the only prop — `FC<PropsWithChildren>` says the same thing.
- ❌ `interface X extends PropsWithChildren` or `PropsWithChildren<XProps>` on an interface that already has members. Declare `children: ReactNode` alongside the rest, where a reader sees it.
