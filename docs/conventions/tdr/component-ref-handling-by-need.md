---
kind: pattern-apply-tdr-reference
id: component-ref-handling-by-need
title: A kit component accepts a ref when a consumer may need its DOM node
summary: "A packages/ui component that renders a focusable, anchorable, measurable or scrollable element declares an optional ref typed Ref<T> as a plain prop and hands it unchanged to its outermost element; layout-only components take no ref, and forwardRef is never used."
governs:
  - "packages/ui/src/components/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# A kit component accepts a ref when a consumer may need its DOM node

## 1. Context

This file carries rules R1, R2, R3, R4 and R5.

Whether a kit component accepts a ref is decided by what its consumer might need to do with the underlying DOM node — focus it, scroll it, measure it, or anchor a popover or positioning layer to it — never by how the component happens to be built. Without the rule, ref support accretes by accident and a consumer cannot tell which components expose their node without opening the implementation.

How an accepted ref reaches the DOM follows from the workspace's React 19 (`react@^19.2.0`): `ref` is an ordinary prop on function components, `forwardRef` is on a deprecation path, and components are typed `FC<XProps>` (component-declaration-shape), which `forwardRef`'s wrapper type does not produce. Where a wrapper's props are derived from the wrapped element or primitive with `ComponentProps<…>` (library-type-narrowing), the `ref` field comes with the derived type and is forwarded by the rest spread; only a component that maps its props field by field declares and passes it explicitly.

Scope: components under `packages/ui/src/components/`. The props interface that carries the field is governed by component-declaration-shape.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A component accepts a ref if a consumer may plausibly need its DOM node to focus it, scroll it, measure it, or anchor a positioning layer to it: any component that renders or wraps a focusable interactive element, any component meant to be positioned or anchored relative to another element, and any component a consumer measures or scrolls into view. It excludes a component that only arranges or decorates its children. | manual |
| R2 | A component that does not meet R1 accepts no ref: no `ref` field on its props, no ref-related import, a plain `FC<XProps>` declaration. | manual |
| R3 | Where R1 applies, the props declare `ref?: Ref<T>` — `T` the DOM element type of the component's outermost element — either explicitly or through a `ComponentProps<…>` derivation that carries it. The component passes the value straight through to that element's `ref`: never wrapped, renamed, conditionally reassigned or re-derived. | proposed |
| R4 | The ref field's type is `Ref<T>`, never `RefObject<T>`, `MutableRefObject<T>`, `ComponentRef<typeof X>` or an indexed lookup into another component's props. | proposed |
| R5 | Do not use `forwardRef`. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Whether a consumer could plausibly need to focus, scroll, measure or anchor to a component's
    node is a judgement about the component's purpose, not a pattern over its source.
  enforcedBy: null
R2:
  type: manual
  reason: "The negative of R1, correct only once R1's judgement has been made for the component."
  enforcedBy: null
R3:
  type: grep
  pattern: "^\\s*ref\\??:\\s*(React\\.)?Ref<"
  include: ["packages/ui/src/components/**/*.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A positive-presence check per component judged under R1 to need a ref. Blind to a ref that
    arrives through ComponentProps<…> (which is conforming), and cannot see whether the value is
    actually forwarded; that half requires reading the JSX.
R4:
  type: grep
  pattern: "ref\\??:\\s*(React\\.)?(RefObject|MutableRefObject|ComponentRef)<"
  include: ["packages/ui/src/components/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Flags any field named ref typed this way, including an internal ref threaded through a context value."
R5:
  type: grep
  pattern: "forwardRef"
  include: ["packages/ui/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** a reader can tell what a component supports without opening it: a `ref` field is a promise the node is reachable, its absence a promise it deliberately is not. Dropping the legacy wrapper also removes a type that complicates generic component typing under React 19.
- **Bad, because** the rule is tied to React 19; a downgrade, where `ref` is not an ordinary function-component prop, breaks it outright.
- **Bad, because** "could a consumer plausibly need the node" is a judgement, so the line between a component that takes a ref and one that does not is decided in review.
- **Neutral, because** to someone who only sees the wrapper disappear from a diff, this reads as a style change; the reason (the React version) lives in this record.

## 5. Reference implementation

```tsx
import type { FC, Ref } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

export const Switch: FC<SwitchProps> = (props) => (
  <SwitchPrimitive.Root ref={props.ref} checked={props.checked} onCheckedChange={props.onCheckedChange} />
);
```

## 6. Forbidden practices

- ❌ `forwardRef` around a component — declare a plain optional `ref` prop instead (R3, R5).
- ❌ A `ref` prop on every component "to be safe", including pure layout and decoration components (R1, R2).
- ❌ Typing the field `RefObject<T>`, `MutableRefObject<T>` or `ComponentRef<typeof X>` instead of `Ref<T>` (R4).
- ❌ Declaring the field by indexing another component's props (`ref?: OtherProps['ref']`) (R4).
- ❌ Renaming, wrapping or conditionally reassigning the incoming ref before it reaches the outermost element (R3).
