---
kind: pattern-apply-tdr-reference
id: design-values-come-from-tokens
title: Design values come from the token layer, never from literals
summary: Every visual quantity is read from a Tailwind theme class or the token module; literal colours, spacings, radii and typefaces are authored in one place only.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10]
adopted: 2026-09-17
---

# Design values come from the token layer, never from literals

## 1. Context

This file carries R1–R10.

Every visual quantity a component renders — colour, spacing, radius, blur, shadow, typeface, fixed width or height, layering, opacity, animation timing — is read from the design-token layer. That layer has two faces of one source: the `@theme` block in `src/index.css`, which is what Tailwind's utility classes resolve against, and `src/lib/tokens.ts`, a JavaScript mirror of it for the places that need a value rather than a class — chart configuration, deck.gl layer properties, the map style, the PWA manifest. The CSS file is the source of truth and the mirror follows it.

Without this, a rebrand or a contrast fix becomes a repository-wide search for hex strings, and two surfaces meant to look identical drift apart because each picked its own approximation. A dark-mode-only application makes this worse rather than better: there is no second theme forcing the values into one place.

The governed population is the shipped source. Three carve-outs are deliberate and are absences of the category rather than violations: the token-authoring modules themselves, which are the one place literals belong; the vendored basemap style JSON under `src/features/map/`, whose palette is a copy of an upstream map style rather than a statement about this design system; and values that compensate for something outside the design system, which R9 admits under a named constant.

A neighbouring rule defers here: the behavioural-constants record governs the naming and placement of module-scope constants but explicitly leaves colour, spacing, radius, shadow and typeface to this one — hoisting a raw literal under a name does not launder it.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Express a design value as a Tailwind utility class that resolves against the `@theme` block. Read from the `tokens` module directly only where no class applies — a chart configuration object, a deck.gl layer property, a map style, a manifest field. | manual |
| R2 | Never author a hex, `rgb()`, `rgba()` or `hsl()` literal outside the token module — including inside a named constant, a gradient stop, a shadow string, a keyframe, or a Tailwind arbitrary-value class (`bg-[#0a0b0f]`). | proposed |
| R3 | Produce padding, margin and gap through Tailwind's spacing scale. Do not write an arbitrary-value spacing class (`p-[13px]`) and do not pass a bare pixel number to a style object for spacing. | proposed |
| R4 | Take radii, shadows, blurs and typefaces from the theme's own scales. | manual |
| R5 | Take fixed component dimensions from the theme's sizing scale where one fits; where a dimension is genuinely bespoke, it falls under R9 and is bound to a named constant rather than inlined as an arbitrary-value class. | manual |
| R6 | Take layering values from a named layer scheme whenever the element is layered against anything outside its own component — `src/features/map/mapZ.ts` is that scheme for the map. A bare `z-10` is acceptable only to order siblings inside one component's own stacking context. | manual |
| R7 | Express text style through the `Typography` component's `variant` prop. Where a style object needs the metrics, take font size, weight and line height from the theme scales. Never author a literal `fontFamily`, `fontSize` or `fontWeight`. | proposed |
| R8 | Author literal design values in one module only. The `@theme` block in `src/index.css` is the source of truth; `src/lib/tokens.ts` mirrors it for JavaScript consumers and is updated in the same change. There is no second colour or token module. | proposed |
| R9 | The escape hatch is for values that compensate for something *outside* the design system — a third-party primitive's internal geometry, a browser default — not for values the theme could express. Such a value is bound to a module-scope `UPPER_SNAKE_CASE` constant in the module that reads it, named for why the value exists. Colour, spacing, radius, shadow and typeface are never in this category. | proposed |
| R10 | Type a prop that carries a design value as a token key, not as `string` or `number`. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    Whether a Tailwind class resolves against the theme or is an arbitrary value needs the class
    read; whether a direct token read was the right choice needs the call site read.
  enforcedBy: null
R2:
  type: grep
  pattern: "#[0-9a-fA-F]{3,8}\\b|rgba?\\(|hsla?\\("
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/tokens.ts", "src/features/map/darkMatter.style.json", "src/features/map/voyager.style.json", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a hex-like string that is not a colour — a commit sha, an id fragment — and an
    `rgba(` inside a vendored style string.
R3:
  type: grep
  pattern: "(p|m|gap|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-\\[[0-9]+(px|rem)\\]"
  include: ["src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: grep
  pattern: "rounded-\\[|shadow-\\[|blur-\\[|font-\\['"
  include: ["src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R5:
  type: grep
  pattern: "(w|h|min-w|min-h|max-w|max-h)-\\[[0-9]+px\\]"
  include: ["src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A genuinely bespoke dimension is R9's case and matches here too; the fix is a named constant,
    not a new token.
R6:
  type: grep
  pattern: "z-\\[[0-9]+\\]|zIndex: [0-9]"
  include: ["src/**/*.tsx", "src/**/*.ts"]
  exempt: ["src/features/map/mapZ.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A single lift over one adjacent sibling inside a component's own stacking context is permitted.
R7:
  type: grep
  pattern: "text-\\[[0-9]|fontSize: |fontWeight: |fontFamily: "
  include: ["src/**/*.tsx", "src/**/*.ts"]
  exempt: ["src/lib/tokens.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A Recharts or deck.gl configuration object legitimately needs a numeric `fontSize`; it should
    read one from the token module rather than inline a number, so a match there is still a
    violation but the fix is a token read, not a class.
R8:
  type: glob
  pattern: "src/lib/tokens.ts is the only module authoring design literals; src/lib/colors.ts must not exist"
  include: ["src/lib/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R9:
  type: manual
  reason: >
    Whether a value compensates for something outside the design system is exactly the judgement
    the escape hatch exists to make.
  enforcedBy: null
R10:
  type: grep
  pattern: "\\b(color|background|fill|stroke|tint)\\??: string"
  include: ["src/components/**/*.tsx", "src/components/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A prop carrying a colour that genuinely originates outside the design system — a user-chosen
    route colour — is a value, not a token key, and is correctly typed `string`.
```

## 4. Trade-offs

- **Good, because** a contrast fix or a palette change is one edit in two synchronised files rather than a search across the tree.
- **Good, because** two surfaces meant to look the same are guaranteed to, because they resolve the same token rather than two approximations of it.
- **Bad, because** the token layer has two representations — the CSS `@theme` block and its JavaScript mirror — that nothing checks against each other. R8 says the CSS wins, but a drift between them is silent until something looks wrong.
- **Bad, because** a genuinely one-off dimension has to earn either a token or a named constant, which is ceremony for a number used once.
- **Neutral, because** Tailwind already constrains most of this through its scale, so the rule mostly bites at the arbitrary-value escape (`w-[80px]`, `bg-[#...]`) rather than across the whole codebase.

## 5. Reference implementation

The class form, which is the default:

```tsx
<div className="bg-surface-elevated text-text-secondary rounded-lg p-4 gap-2" />
```

The direct-read form, for a consumer that needs a value rather than a class:

```ts
import { tokens } from '@/lib/tokens.ts';

const chartAxis = { stroke: tokens.textTertiary, fontSize: tokens.fontSizeXs };
```

R9's escape hatch — a value compensating for a third-party primitive's geometry:

```ts
const MAPLIBRE_CONTROL_OFFSET_PX = 10;
```

## 6. Forbidden practices

- ❌ A hex, `rgb()` or `hsl()` literal anywhere but the token module — including inside a named constant, which does not launder it.
- ❌ `bg-[#0a0b0f]`, `text-[13px]`, `p-[13px]` — an arbitrary-value class is a literal wearing a class's clothes.
- ❌ A second colour or token module beside the first; the next reader cannot tell which is authoritative.
- ❌ Editing `src/lib/tokens.ts` without editing the `@theme` block in `src/index.css`, or the reverse — the two must move together.
- ❌ Colours in `src/packages/engine/`; the engine owns the zone names and the thresholds, the presentation layer owns what they look like.
- ❌ A bare `z-[60]` on an element layered against something outside its own component; layering across components belongs to a named scheme.
- ❌ `color?: string` on a component prop that is meant to take a design value — it accepts anything and documents nothing.
