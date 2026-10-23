---
kind: pattern-apply-tdr-reference
id: styled-api-over-sx
title: Design values come from the theme tokens
summary: Colours, radii, pixel sizes, type sizes, shadows and kit z-index layers in apps/web, packages/ui, the banner page and the workbench board are read from packages/ui/src/theme.css (or its JS mirror tokens.ts); a value the theme lacks first gets a token carrying its exact value, so adopting a token never changes a pixel.
governs:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.css"
  - "packages/ui/src/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "tools/docs/banner/page/**/*.tsx"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
  - "tools/workbench/scripts/deps.ts"
adopted_rules: [R3, R5, R9, R10, R11]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Design values come from the theme tokens

## 1. Context

This file carries rules R3, R5, R9, R10 and R11.

`apps/web` is styled with Tailwind v4 utilities whose values come from one theme: `packages/ui/src/theme.css` (`@theme`: palette, surfaces, text, accent, status, sport, chart, precip, wind and route colours, spacing, radius), with every colour mirrored in `packages/ui/src/lib/tokens.ts` for code that needs a value in JS (Recharts props, deck.gl, inline styles, console styling). A hard-coded colour or dimension survives no theme change and is invisible to every audit of the palette, so the token rule holds wherever a design value is written — in a class string, in an SVG attribute, in an inline `style`, in a JS table. Adopting a token must not change a pixel: a literal is replaced only by a token that resolves to the identical value, and where the theme has none, a token carrying exactly today's value is added first — a px-valued spacing or size token for a pixel size (the theme's spacing scale is px-valued, so output does not move with the browser's default font size), a font-size token with the line height the element renders today, a colour token with the exact alpha (`#ffffff1a`, not `white/10`), the exact palette value. Never map a literal to a nearby token. New px tokens are named for their value with a `px` suffix (`--spacing-440px`, `--radius-10px`, `--blur-28px`), so no existing scale class changes.

Scope: rendered modules and their helpers under `apps/web/src` and `packages/ui/src` (the kit's own components follow the token rule like any consumer; R9–R11 were added for the kit and govern `packages/ui/src` only; the kit's stacking layers come from the `--z-index-*` tokens, while the app's bare integer `z-*` classes are Tailwind's scale and stay). Out of scope: `packages/ui/src/theme.css` and `tokens.ts` themselves (they *define* the values), the vendored map styles (`features/map/*.style.json`), the deck.gl RGB map palette documented in `apps/web/CLAUDE.md` §3, and tests.

The banner page of `tools/docs` (`tools/docs/banner/page/**/*.tsx`) is bound by R3, R5 and R10 like the kit: colours and radii from the theme, no static declaration in a `style` attribute. Its entry stylesheet `banner/page/banner.css` imports the theme and is not a component stylesheet, so R11 does not reach it. The workbench board (`tools/workbench/site/src`, and the Mermaid `classDef` strings of `tools/workbench/scripts/deps.ts`) imports the same theme and is bound by R3: its item-type and graph colours read `tokens`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R3 | Read every colour, radius, pixel size and spacing, type size, shadow and (in `packages/ui`) z-index from the theme: a Tailwind utility backed by `packages/ui/src/theme.css` (`bg-accent`, `rounded-xs`, `fill-white`, `w-440px`, `text-2xs`, `shadow-floating`, `z-overlay`) or, in JS, `tokens` (colours) and `fontSizes` from `@pacevault/ui/lib/tokens.ts`. Never write a literal hex colour, a pixel arbitrary value (`w-[440px]`, `rounded-[10px]`, `text-[11px]`), an arbitrary shadow or z-index, or an alpha suffix appended to a hex. Replace a literal only with an identical-value token: an existing token that resolves to the same value, or a token newly added to `theme.css` (and, for a colour, its `tokens.ts` mirror) that carries exactly today's value — px for px, the exact alpha, the exact palette value, a font-size token with today's line height. Never substitute a nearby token. | manual |
| R5 | An SVG attribute that carries a colour (`fill`, `stroke`) takes it from a theme utility or `tokens` as well, through an identical-value token as in R3 (an exact-alpha token for an alpha-hex stroke). Being an attribute is not an exception. | manual |
| R9 | In `packages/ui`, type a component prop that carries a colour as a theme value, `TokenColor` (`(typeof tokens)[keyof typeof tokens]`, exported from `packages/ui/src/lib/tokens.ts`), wherever every caller passes a `tokens.*` value — not as `string`. A prop some caller fills with a non-token colour stays `string` until that caller is resolved. | manual |
| R10 | Do not use the DOM `style` attribute for a static declaration. It is reserved for a value recomputed from data, pointer input or measurement — a drag offset, a percentage extent, a measured size, a data colour, a motion value — or a measured value published as a CSS custom property that a class consumes. Everything static is a utility class. | proposed |
| R11 | No `.css` / `.module.css` import carries a component's own styles. The theme (`packages/ui/src/theme.css`) is the kit's only stylesheet; component styling is utility classes. | proposed |

## 3. Detection

```yaml
R3:
  type: grep
  pattern: "\\b[a-z:-]+-\\[[0-9.]+px\\]|shadow-\\[|z-\\[|#[0-9a-fA-F]{3,8}\\b|\\}[0-9a-fA-F]{2}`"
  include: ["apps/web/src/**/*.tsx", "apps/web/src/**/*.ts", "apps/web/src/**/*.css", "packages/ui/src/**/*.tsx", "packages/ui/src/**/*.ts", "tools/docs/banner/page/**/*.tsx", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/scripts/deps.ts"]
  exempt: ["apps/web/src/**/*.style.json"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A hex-looking id or hash in a string literal, and colours that are data rather than styling
    (a value read from a record), and the non-design arbitrary values that keep their brackets:
    safe-area and viewport calc()/max() expressions, grid templates, data-attribute variants,
    filter amounts. Bare integer z-* classes in packages/ui are a violation the grep does not
    catch; review the kit's z-* classes by hand. Review each hit.
R5:
  type: grep
  pattern: "(fill|stroke)=\"#[0-9a-fA-F]{3,8}\""
  include: ["apps/web/src/**/*.tsx", "packages/ui/src/**/*.tsx", "tools/docs/banner/page/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    none known; an alpha-hex stroke is a violation too and takes an exact-alpha colour token.
R9:
  type: manual
  reason: "Whether every caller passes a token value needs tracing each call site's source; a string-typed colour prop is the candidate."
  enforcedBy: null
R10:
  type: grep
  pattern: "style=\\{\\{"
  include: ["packages/ui/src/**/*.tsx", "tools/docs/banner/page/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags the carve-out as loudly as a violation: a motion value, a percentage extent or a measured
    size matches exactly like a static declaration. Misses style={someObject}. Read each hit.
R11:
  type: grep
  pattern: "^import [^;]*'[^']*\\.(module\\.)?css'"
  include: ["packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** funnelling every value through the theme makes a palette or scale change a change in one file. A literal hex code is invisible to that change and is the failure mode the rule exists to prevent.
- **Good, because** the map palette rules in `apps/web/CLAUDE.md` §3 can only be checked against values that live in one place.
- **Bad, because** a one-off size the scale cannot express costs a named token in another package and a review there, more ceremony than the arbitrary value it replaces.
- **Bad, because** the line between a design value and data (a zone colour computed from a record, a user-picked route colour) is a judgement call with no crisp test.
- **Neutral, because** Tailwind still offers arbitrary values for non-design purposes (data-attribute variants, grid templates, safe-area `calc()`), so the bracket syntax itself stays in the codebase; only colour literals, pixel values, arbitrary shadows and kit z-index literals are ruled out.

## 5. Reference implementation

Class strings take values from named tokens:

```tsx
<span className="inline-block size-2 rounded-xs" />
<rect className="fill-white" fillOpacity={0.06} />
```

A pixel size the scale does not hold gets a px token with exactly that value first (`theme.css`: `--spacing-440px: 440px;`, `--text-2xs: 11px; --text-2xs--line-height: 1.5;`):

```tsx
<div className="fixed top-6 bottom-6 left-6 z-10 w-440px p-6" />
<div className="flex justify-between text-2xs text-text-quaternary tabular-nums" />
```

JS consumers read the mirror, never a literal:

```ts
import { tokens } from '@pacevault/ui/lib/tokens.ts';

export const WIND_COLORS = {
  tail: tokens.windTail,
  cross: tokens.windCross,
  head: tokens.windHead,
} as const;
```

## 6. Forbidden practices

- ❌ A pixel radius or size as an arbitrary value (`rounded-[2px]`, `w-[440px]`, `text-[11px]`) instead of a token carrying the same px value.
- ❌ Replacing a literal with a nearby token (`#888` with `statusNeutral`, `#ffffff1a` with `white/10`, a px size with a rem scale step) — the value must be identical; add an exact token instead.
- ❌ Building a colour by appending an alpha suffix to a hex (`${color}aa`); use `color-mix(in srgb, ${color} 66.667%, transparent)` with the exact percentage, or a token.
- ❌ A literal hex colour in a class, an SVG attribute (`fill="#fff"`) or a JS table where a token holds the identical colour.
- ❌ Adding a colour to `theme.css` without its `tokens.ts` mirror, or the reverse.
- ❌ A colour prop typed `string` whose every caller passes a `tokens.*` value (R9).
- ❌ `style={{ … }}` holding a static value (`paddingBottom: 12`, a constant height) instead of a utility class (R10).
- ❌ A component stylesheet or CSS module (R11).
