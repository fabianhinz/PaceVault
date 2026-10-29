---
kind: pattern-apply-tdr-reference
id: visible-copy-arrives-as-props
title: Every text the kit renders arrives as a prop
summary: packages/ui authors no copy and imports no message catalogue — visible text and accessible names (including those of controls the kit renders itself) come from children or required, role-named copy props that the consuming app fills with its m.* messages.
governs:
  - "packages/ui/src/components/**/*.tsx"
  - "packages/ui/package.json"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Every text the kit renders arrives as a prop

## 1. Context

This file carries rules R1, R2, R3, R4, R5, R6 and R7.

The kit supplies structure, behaviour and style; every string a user reads or a screen reader announces is supplied by the consumer — `apps/web`, `tools/workbench`, `tools/docs` — as `children` or as a named copy prop, filled there from `m` in `@pacevault/i18n/messages.js` (user-facing-strings-in-copy-modules governs those keys). A string the kit authored would tie the kit to the app's catalogue and tone, and make `@pacevault/i18n` a dependency of a package that otherwise holds no product copy. With copy at the consumer, the kit needs no catalogue, and a tool that renders kit components chooses its own wording.

The rules govern shipped component source under `packages/ui/src/components/`. Specs are out of scope. Two carve-outs are stated as criteria: machine-facing literals (R7) are not copy, and a typographic symbol that carries no words (the `·` crumb separator, the `*` required marker, a `#` column header) is markup, not copy.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Render user-visible text only from `children` or from a named copy prop declared on the component's own props. Do not assign a string literal or an `m.*` call to a copy-carrying attribute of any element the component renders. | proposed |
| R2 | Do not place literal prose, or an `m.*` call, as a JSX text child. A surface that needs a heading, caption or sentence takes a prop for it. | proposed |
| R3 | Name a copy prop for the role the text plays — `label`, `title`, `subtitle`, `placeholder`, `helperText`, `description`, `message`, `tooltip`, `alt`. A second copy slot is named for the element it fills with a `Label`/`Text` suffix (`closeLabel`, `expandLabel`, `submitText`). Do not name a prop after the feature the copy describes. | manual |
| R4 | Do not give a copy prop a natural-language default — neither an inline `??` fallback nor a named default constant. An absent copy prop renders nothing, or the prop is required. | proposed |
| R5 | Do not derive behaviour from the value of a copy prop (comparing it, switching on it, keying a list by it). Branch on a variant union or a boolean instead. | proposed |
| R6 | The accessible name of a control the kit renders itself (a grab handle, a close or expand affordance) arrives as a **required** copy prop of the component that renders it, and is forwarded unchanged through every kit component that wraps it. Where the accessible name describes the component's own primary element, it is a required prop as well. | manual |
| R7 | Machine-facing literals are not copy and stay in the component: class names, test-id values, CSS values, union member identifiers, DOM ids and data attributes. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "(aria-label|title|placeholder|alt)=(\"[A-Za-z]|\\{m\\.)"
  include: ["packages/ui/src/components/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A literal on a test-only attribute is not matched; a title built from a prop is not matched (correct)."
R2:
  type: grep
  pattern: "\\{m\\.[a-z_]+\\(|>[A-Z][a-z]+ [a-z]+"
  include: ["packages/ui/src/components/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "The prose half is heuristic; a word inside a class string can match. Read each hit."
R3:
  type: manual
  reason: "Whether a prop name says the role or the feature is a reading."
  enforcedBy: null
R4:
  type: grep
  pattern: "props\\.(label|title|subtitle|description|placeholder|helperText|message)[A-Za-z]*\\s*\\?\\?\\s*['`]"
  include: ["packages/ui/src/components/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Misses a default applied through destructuring."
R5:
  type: grep
  pattern: "key=\\{[a-z]+\\.(label|title)\\}|(label|title) === "
  include: ["packages/ui/src/components/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A key from a label is reconciliation identity only; read each hit."
R6:
  type: manual
  reason: >
    Requires tracing which kit component renders the control and whether every wrapper forwards the
    prop. Review queue: `rg -n "'aria-label'\\?:" packages/ui/src/components` — an optional
    accessible name on a primary element (`Checkbox`, `Slider`, `RadioGroupItem`) is a violation.
  enforcedBy: null
R7:
  type: manual
  reason: "An allowance, so the checks above do not report class names and test ids."
  enforcedBy: null
```

Package-level signal: `rg -n "@pacevault/i18n" packages/ui` prints nothing once the kit authors no copy.

## 4. Trade-offs

- **Good, because** the kit holds no catalogue and depends on no translation package; every consumer chooses its own wording, and translation stays where the copy lives.
- **Good, because** every string on screen is traceable to a message key at the call site, so a copy change never needs a kit change.
- **Bad, because** every call site of a component with an internal control must pass that control's label, even when every call site passes the same message; a missing label is a type error rather than a silent default.
- **Bad, because** a required accessible-name prop propagates through every kit wrapper that renders the component (`DialogContent` → `ResponsivePopover` → `ActionsMenu`), lengthening their props.
- **Neutral, because** the rendered text is identical before and after the move; only where the message is chosen changes.

## 5. Reference implementation

```tsx
import type { FC } from 'react';
import { ZoomOut } from 'lucide-react';

interface ZoomResetPillProps {
  zoomed: boolean;
  label: string;
  onReset: () => void;
}

export const ZoomResetPill: FC<ZoomResetPillProps> = (props) => {
  if (!props.zoomed) return null;
  return (
    <FloatingPill onClick={props.onReset}>
      <ZoomOut size={16} />
      <span>{props.label}</span>
    </FloatingPill>
  );
};
```

```tsx
<ZoomResetPill zoomed={zoom.zoomed} label={m.ui_chart_reset_zoom()} onReset={zoom.resetZoom} />
```

## 6. Forbidden practices

- ❌ An `m.*` call or a literal sentence inside a kit component.
- ❌ A copy prop with a natural-language default (`props.label ?? 'Reset zoom'`).
- ❌ An optional accessible-name prop on a control the kit renders itself — an absent name is worse than a required one.
- ❌ A kit wrapper that renders a component with a required label but does not take and forward that label itself.
- ❌ Branching on, comparing or keying by a copy prop's value.
- ❌ `@pacevault/i18n` in `packages/ui/package.json`.
