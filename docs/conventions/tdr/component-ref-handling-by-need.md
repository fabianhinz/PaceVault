---
kind: pattern-apply-tdr-reference
id: component-ref-handling-by-need
title: Ref handling is decided by consumer need, not component shape
summary: "A component accepts a ref only when a consumer could plausibly need its DOM node, and then declares it as an ordinary optional `ref?: Ref<T>` prop passed straight through."
governs:
  - "src/components/**/*.tsx"
  - "src/features/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-09-17
---

# Ref handling is decided by consumer need, not component shape

## 1. Context

This file carries R1–R5.

This record is prescriptive rather than descriptive: it fixes a decision about ref handling going forward. It governs two questions that were decided together — whether a component accepts a ref at all, and, where it does, how that ref reaches the DOM. Without it, ref support accretes by accident: some components expose a ref because their author happened to need one that day, others do not, and a consumer cannot tell which without opening the implementation.

**Whether a component accepts a ref** is decided by what its consumer might need to do with the underlying DOM node — focus it, scroll it, measure it, or anchor a popover or positioning layer to it — never by how the component happens to be built internally. A component assembled from several nested parts still exposes exactly one ref, to its outermost element, if a consumer could plausibly need that node; a component built from a single element exposes none if nobody would ever need it.

**How an accepted ref reaches the DOM** follows from React 19, where `ref` is an ordinary prop on function components and `forwardRef` is on a deprecation path. This project has no `forwardRef` anywhere, so unlike the codebase this convention was drawn from there is no migration backlog — R5 is a guard against reintroducing it, not a to-do list.

Out of scope: class components (none exist here) and refs that reach *inner* parts of a component, which the slot-props record covers.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A component accepts a ref if a consumer may plausibly need the underlying DOM node in order to focus it, scroll it, measure it, or anchor a positioning layer to it. Concretely this covers any component that renders or wraps a focusable interactive element, any component whose purpose is to be positioned or anchored relative to another element, and any component a consumer is expected to measure or scroll into view. It excludes a component that exists purely to arrange or decorate its children. | manual |
| R2 | A component that does not meet R1 accepts no ref of any kind: no `ref` field on its props type, no ref-related import, and a plain function-component declaration. | manual |
| R3 | Where R1 applies, the props type declares `ref?: Ref<T>` — `T` being the DOM element type of the component's outermost element — as an ordinary optional field alongside the rest of the props. The component reads it as an ordinary prop and passes the value straight through to that element's own `ref`: never wrapped, renamed, conditionally reassigned, or re-derived. | proposed |
| R4 | The ref field's type is `Ref<T>`, never `RefObject<T>`, `MutableRefObject<T>`, `ComponentRef<typeof X>`, or an indexed lookup into another component's props. `Ref<T>` is the union React's own function-component ref prop uses; any narrower type rejects a valid consumer ref — a callback ref, or one produced by a ref-merging utility — at the type level. | proposed |
| R5 | Do not use `forwardRef`. There is none in this codebase and none is to be added; a ref is an ordinary prop. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    "Could a consumer plausibly need this node" is a judgement about the component's role, which
    no pattern over its source expresses.
  enforcedBy: null
R2:
  type: grep
  pattern: "\\bRef<|useImperativeHandle"
  include: ["src/components/**/*.tsx", "src/features/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Every component that correctly meets R1 matches too. Run this against the list of components
    R1 answered "no" for, not across the whole tree.
R3:
  type: grep
  pattern: "ref=\\{[a-zA-Z]+ \\?\\?|ref=\\{\\([a-zA-Z]+\\) =>"
  include: ["src/components/**/*.tsx", "src/features/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A callback ref the component genuinely needs for its own measurement is not a pass-through and
    is not governed here; read whether the ref came from props.
R4:
  type: grep
  pattern: "ref\\??: (RefObject|MutableRefObject|ComponentRef)<"
  include: ["src/components/**/*.tsx", "src/features/**/*.tsx", "src/components/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A component's *internal* ref, held in a `useRef` and typed `RefObject<T>`, is not a props
    field and is correct; only a props declaration is a violation.
R5:
  type: grep
  pattern: "forwardRef"
  include: ["src/**/*.tsx", "src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** a consumer can tell from the props type whether a component hands out its node, without opening the implementation.
- **Good, because** the criterion is about the consumer's need rather than the component's internal structure, so a component that grows from one element to several does not change its ref surface.
- **Bad, because** "plausibly need" is a prediction, and predicting wrong in the restrictive direction means a consumer has to change the component before they can use it.
- **Neutral, because** most of the interactive components here wrap a Radix primitive that already forwards `ref` through a props spread, so the rule often describes what the spread already does rather than adding anything.

## 5. Reference implementation

R1 met — an ordinary optional prop, passed straight through:

```tsx
interface ButtonProps extends ComponentProps<'button'> {
  ref?: Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
}

export const Button: React.FC<ButtonProps> = (props) => (
  <button ref={props.ref} className={cn(…)}>{props.children}</button>
);
```

R1 not met — no ref surface at all:

```tsx
export const PageGrid: React.FC<PropsWithChildren> = (props) => (
  <div className="grid gap-4">{props.children}</div>
);
```

## 6. Forbidden practices

- ❌ Giving a component a ref because its author needed one that day; the surface then varies for reasons a consumer cannot see.
- ❌ Exposing a ref from a component that only arranges or decorates children — there is no node a consumer has a use for.
- ❌ Exposing several refs to several inner parts; a component has one public ref, to its outermost element, and inner parts are reached through the slot-props surface.
- ❌ `ref?: RefObject<HTMLDivElement>` — it rejects a callback ref and a merged ref at the type level, both of which are valid things for a consumer to pass.
- ❌ Wrapping, renaming or conditionally reassigning the ref on its way to the element; the consumer's ref must reach the node it was aimed at.
- ❌ `forwardRef` — in React 19 it is a wrapper that buys nothing and produces a component type this project does not use.
