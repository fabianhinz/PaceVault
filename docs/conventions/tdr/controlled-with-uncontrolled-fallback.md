---
kind: pattern-apply-tdr-reference
id: controlled-with-uncontrolled-fallback
title: Controlled props with an uncontrolled fallback
summary: A catalogue component owning interactive state exposes one optional triple — a seed, a control and a report — over a single internal state it always owns.
governs:
  - "src/components/ui/**/types.ts"
  - "src/components/ui/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Controlled props with an uncontrolled fallback

## 1. Context

This file carries R1–R7.

A shared component cannot know whether its caller wants to drive the interactive state it owns. Offering only the controlled form forces every caller to write a `useState` and a handler for the common case where nobody cares; offering only the uncontrolled form makes the component unusable inside a form, a wizard, or a group of components that must stay synchronised. This record fixes the shape that serves both: one optional triple of props — a seed, a control, and a report — over a single internal state the component always owns.

Scope: the public prop surface of `src/components/ui/`. Two categories are deliberately out of scope, and recognising them is most of this record's value. First, the thin Radix wrappers that forward the whole question to the primitive underneath and hold no state of their own — they relay the three props straight through and Radix decides; adding a parallel internal state there would produce two sources of truth. Second, composites whose state prop is *required*, because they exist to render state the caller already owns. Both are recognised by the same test: does this component call a state setter of its own?

Feature components with one or two call sites are not a public prop surface and do not owe the triple.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A component that owns interactive state a consumer could read, drive, or synchronise exposes exactly three props for it: `default<State>` seeds it, `<state>` controls it, `on<State>Change` reports it. Declare all three together in the component's types module; never ship a subset. | manual |
| R2 | Name all three after the state itself. The controlled prop carries the bare state name with no `is`/`has` prefix; the callback is `on` + that same name + `Change`, present tense, never a verb describing the interaction and never a past participle. | proposed |
| R3 | Mark all three optional and give the state a hard-coded fallback, so the component renders and stays interactive when none of them is passed. Never require the change callback. | proposed |
| R4 | Seed internal state once, in the state initialiser, from the coalesced chain `<state> ?? default<State> ?? <fallback>`. Do not apply the seed from a mount effect, and do not seed from the default alone. | proposed |
| R5 | Keep the internal state as the single value the render reads, and push the controlled prop into it from a layout-phase effect that returns early while the controlled prop is `undefined`. Do not resolve the mode inline on each render by coalescing the prop over the internal value. | proposed |
| R6 | Call `on<State>Change` on every internal transition, unconditionally and after the internal setter, so an observer gets the same events as an owner without having to take ownership. | manual |
| R7 | Give a purely presentational transient — a hover, press, or focus flag read only by the class layer — no props at all. Qualify a state for the triple only when a consumer could plausibly need to read it, set it, restore it, or keep it in step with another component. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "default[A-Z][A-Za-z0-9]*\\?:"
  include: ["src/components/ui/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Finds the seed prop; confirming the other two exist beside it needs the declaration read. Use
    this as the entry point to a manual check rather than as a verdict.
R2:
  type: grep
  pattern: "on[A-Z][A-Za-z0-9]*(Changed|Toggle|Select|Click)\\?:"
  include: ["src/components/ui/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A genuine interaction callback that is not the state report — `onClick` on a button — matches
    and is correct.
R3:
  type: grep
  pattern: "on[A-Z][A-Za-z0-9]*Change: "
  include: ["src/components/ui/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: grep
  pattern: "useState\\([^)]*\\)[\\s\\S]{0,200}useEffect\\(\\(\\) => \\{\\s*set[A-Z]"
  include: ["src/components/ui/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    R5's layout-phase push looks similar; the difference is the early return while the controlled
    prop is `undefined`.
R5:
  type: grep
  pattern: "props\\.[a-z][A-Za-z0-9]* \\?\\? [a-z][A-Za-z0-9]*State"
  include: ["src/components/ui/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R6:
  type: manual
  reason: >
    "On every internal transition" means checking each setter call for a paired callback
    invocation, which needs the component read.
  enforcedBy: null
R7:
  type: manual
  reason: >
    Whether a state is presentational or something a consumer could need is the judgement the rule
    exists to make.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a caller who does not care writes nothing and the component still works, while a caller who needs to synchronise two components has a way in that does not require the component to change.
- **Good, because** the render reads one value in both modes, so there is no branch on "am I controlled" scattered through the component.
- **Bad, because** the layout-phase push in R5 is an effect that copies a prop into state — exactly the shape the effects record removes elsewhere. It is justified here and stated as a rule, but it means the codebase contains one sanctioned instance of a pattern it otherwise treats as a defect.
- **Bad, because** most of this catalogue wraps Radix, which already implements the triple; applying the record where it does not belong creates two sources of truth, and the out-of-scope test is doing more work than the rules.
- **Neutral, because** three props per piece of state is a larger surface than either mode alone, and R7 is the only thing keeping every transient flag from acquiring one.

## 5. Reference implementation

```ts
export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  defaultSelected?: string;
  selected?: string;
  onSelectedChange?: (selected: string) => void;
}
```

```tsx
export const SegmentedControl: React.FC<SegmentedControlProps> = (props) => {
  const [selected, setSelected] = useState(
    props.selected ?? props.defaultSelected ?? props.options[0]?.value ?? '',
  );

  useLayoutEffect(() => {
    if (props.selected === undefined) return;
    setSelected(props.selected);
  }, [props.selected]);

  const handleSelect = (value: string) => {
    setSelected(value);
    props.onSelectedChange?.(value);
  };

  return ( … );
};
```

The out-of-scope case — a Radix wrapper relaying, holding nothing:

```tsx
export const Switch: React.FC<SwitchProps> = (props) => <SwitchPrimitive.Root {...props} />;
```

## 6. Forbidden practices

- ❌ Shipping a subset of the triple — a controlled prop with no seed, or a seed with no report — so a caller can read the state but not drive it, or the reverse.
- ❌ `isOpen` / `onToggled` / `onOpened` as the triple's names; the controlled prop is the bare state name and the callback is present-tense `Change`.
- ❌ A required `on<State>Change`; the component must stay interactive when nobody is listening.
- ❌ Seeding internal state from a mount effect instead of the initialiser — the component renders once with the wrong value.
- ❌ `const value = props.value ?? internalValue` resolved inline on each render; the render then reads two sources depending on the mode.
- ❌ Calling `on<State>Change` only when the component is uncontrolled; an observer then gets fewer events than an owner.
- ❌ Adding the triple to a Radix wrapper that holds no state of its own — the internal state becomes a second source of truth the primitive does not know about.
- ❌ Giving a hover or press flag a prop triple.
