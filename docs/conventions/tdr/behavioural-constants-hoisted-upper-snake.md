---
kind: pattern-apply-tdr-reference
id: behavioural-constants-hoisted-upper-snake
title: Behavioural constants hoisted to module scope in UPPER_SNAKE_CASE
summary: A number that governs behaviour is named once at module scope in UPPER_SNAKE_CASE; a one-off structural style value and a design value are both excluded.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8]
adopted: 2026-09-17
---

# Behavioural constants hoisted to module scope in UPPER_SNAKE_CASE

## 1. Context

This file carries R1–R8.

A value that governs **behaviour** — a threshold a gesture must cross, a delay before a close, an upper or lower bound, the value used when an input is absent, a layering scheme, a simplification tolerance — is named once at module scope instead of appearing as a bare literal inside a handler, an effect or a class string. The name is the only explanation such a number ever gets in a codebase that does not comment, so an unnamed `250` or `1.2` is unreviewable: nobody can tell whether it was measured, guessed, or copied.

Three buckets, and the whole value of this record is the boundary between them. **Design values** (colour, spacing, radius, shadow, typeface, elevation) are not the subject here at all — they come from the token module, and hoisting a literal colour into a module-scope constant does not launder it. **Behavioural values** are the subject: hoisted, UPPER_SNAKE, module scope. **One-off structural styling** that is meaningless outside the one place it sits (`flex-shrink-0`, `min-w-0`, a single `z-10` lift over an adjacent sibling) stays inline — hoisting those makes the markup harder to read, and an agent that hoists every number in a class string makes the code strictly worse.

`src/packages/engine/` is out of scope: that package's own rules already fix the same convention and add a citation requirement this record does not carry. Test modules and generated code under `src/paraglide/` are also out of scope.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare a value that governs behaviour — threshold, delay or interval, bound, fallback, layering index, or a fixed dimension no design token expresses — as a module-scope `const` above the unit that reads it; do not inline it at the use site. | manual |
| R2 | Name a module-scope constant that holds a scalar or a frozen literal in `UPPER_SNAKE_CASE`. | proposed |
| R3 | Treat a keyed lookup record mapping a variant, size or state key to a **data** value (a number, a string, a component reference, a props object) as a constant too, and name it `UPPER_SNAKE_CASE`. Reserve camelCase for a module-scope object that groups **functions** into a namespace, and for the keyed class maps of a component's styles module. | proposed |
| R4 | Leave a structural style value inline when it is meaningful only there and is read by nothing else: layout mode, positioning, overflow, flex sizing, and a single lift over one adjacent sibling. Hoist a layering value only once there is a scheme of two or more named layers. | manual |
| R5 | Do not hoist a design value into a constant. A colour, spacing, radius, shadow or typeface is resolved from the token module at the use site. Hoisting a *token key* under a name is fine; hoisting a raw literal is not. | proposed |
| R6 | Declare the constant unexported, in the module that reads it. Export it only when a sibling module or a spec reads it. | manual |
| R7 | Name the constant for the reason it exists rather than for its literal value; prefix a constant that supplies the value of an omitted or absent input with `DEFAULT_`; suffix a duration with its unit (`_MS`, `_S`). | proposed |
| R8 | Do not introduce a central or shared constants module. Behavioural constants are colocated with the unit whose behaviour they govern. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "(setTimeout|setInterval)\\([^,]+,\\s*[0-9]+|\\.slice\\(-?[0-9]{1,3}\\)|> [0-9]+\\.[0-9]+|tolerance: [0-9]"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/packages/engine/**", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches `.slice(-1)` and `> 0` style guards, which are not behavioural tuning and need no
    name. The pattern is a prompt to read the line, not a verdict.
R2:
  type: grep
  pattern: "^const [a-z][A-Za-z0-9]* = (-?[0-9]|'|\")"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/packages/engine/**", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A module-scope string that is not a constant in this record's sense — a CSS class fragment, a
    test id — also matches.
R3:
  type: grep
  pattern: "^const [a-z][A-Za-z0-9]*(Map|By[A-Z][A-Za-z]*) = \\{"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/packages/engine/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A keyed map of Tailwind class strings belongs to a component's styles module and is camelCase
    by that record's rules, not a violation here.
R4:
  type: manual
  reason: >
    Whether a style value is meaningful outside its one declaration is the judgement the rule
    exists to make.
  enforcedBy: null
R5:
  type: grep
  pattern: "^const [A-Z_]+ = ('|\")#[0-9a-fA-F]{3,8}"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/colors.ts", "src/lib/tokens.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R6:
  type: manual
  reason: >
    Whether a constant has a consumer outside its module needs a usage search per symbol.
  enforcedBy: null
R7:
  type: manual
  reason: >
    Whether a name states the reason a value exists is a reading of the name against its use site.
  enforcedBy: null
R8:
  type: glob
  pattern: "src/**/constants.ts must not exist"
  include: ["src/**/constants.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** the name is the only explanation a number gets in a codebase with no comments, so hoisting is what makes a tuning value reviewable at all.
- **Good, because** the same value used twice in a module cannot drift, and a spec can import it rather than restating it.
- **Bad, because** the boundary between "behavioural" and "one-off structural" is a judgement, and an over-eager reading of R1 produces a wall of constants above a component that was readable before.
- **Neutral, because** R8's ban on a central constants module means a value needed by two modules has to be exported from the one that owns the behaviour, which makes ownership explicit and the import path longer.

## 5. Reference implementation

```ts
const MAX_VISIBLE_TOASTS = 5;
const DEFAULT_SIMPLIFY_TOLERANCE_M = 2.5;
const DISMISS_DELAY_MS = 250;

export const useToastStore = create<ToastState>()(
  immer((set) => ({
    toasts: [],
    addToast: (toast) =>
      set((draft) => {
        draft.toasts.push(toast);
        draft.toasts = draft.toasts.slice(-MAX_VISIBLE_TOASTS);
      }),
  })),
);
```

The inline case R4 protects, unchanged:

```tsx
<div className="flex min-w-0 shrink-0 items-center overflow-hidden">
```

## 6. Forbidden practices

- ❌ A bare `250`, `0.85` or `5` inside a handler, an effect or a slice call — nobody can tell whether it was measured or guessed.
- ❌ `const maxToasts = 5` — a module-scope scalar constant is UPPER_SNAKE so it reads as fixed at every use.
- ❌ Hoisting `flex-shrink-0` or a single `z-10` into a named constant; the class already says everything a name would.
- ❌ `const BRAND_BLUE = '#3b82f6'` — naming a colour does not make it a behavioural constant; it belongs in the token module.
- ❌ `src/lib/constants.ts` collecting values from across the app, so a reader has to leave the behaviour to find the number that governs it.
- ❌ `const TIMEOUT = 5000` — no unit in the name, so the next reader guesses between seconds and milliseconds.
