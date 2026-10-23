---
kind: pattern-apply-tdr-reference
id: formatting-through-intl-namespace
title: User-facing formatting goes through the formatters module
summary: Every Intl formatter and plural selection live in apps/web/src/lib/formatters.ts as loose named exports with closed mode unions, built with getLocale(); call sites never construct Intl objects or call toLocale* on displayed values.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/lib/formatters.ts"
adopted_rules: [R1, R2, R3, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# User-facing formatting goes through the formatters module

## 1. Context

This file carries R1, R2, R3, R7 and R8. A shared collator for comparing displayed strings (R4) is not adopted; `apps/web/src/components/MetricLabel.tsx` keeps its `localeCompare(…, undefined, { sensitivity: 'base' })`. Every timestamp, date range, number, unit value and singular/plural choice a user sees is produced by one module, `apps/web/src/lib/formatters.ts`, which owns every `Intl.*` constructor. Without it each view picks its own field set and fraction digits, and the same value renders differently on two screens. The locale is the runtime Paraglide locale, read once per formatter with `getLocale()` from `@pacevault/i18n/runtime.js` (the app ships English and German); the module exports loose named functions, not a namespace object. Copy itself stays in Paraglide messages (`m.*`); `formatPlural` only chooses which message key to call.

Scope: `apps/web/src/`. Out of scope: machine-facing strings — the `YYYY-MM-DD` day keys built by `toDateString` with its fixed `'en'` formatter, ISO date comparisons, serialisation — and `packages/engine/src/formatter.ts`, the engine's own injected formatting strategy. Time arithmetic uses `MS_PER_*` from `packages/engine/src/time.ts` (`native-date-and-duration-constants`).

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Construct `Intl.*` objects (`DateTimeFormat`, `NumberFormat`, `Collator`, `PluralRules`) only inside `apps/web/src/lib/formatters.ts`. Call sites import its named formatters. | proposed |
| R2 | Never call `toLocaleDateString`, `toLocaleTimeString` or `toLocaleString` on a value that reaches the UI. Route it through `formatters.ts`. | proposed |
| R3 | Express the variations of a format as a closed mode union exported as a type (`DateFormatMode`, `DateRangeFormatMode`, `NumberFormatMode`, `UnitFormatMode`) with a default mode, backed by an exhaustive `Record<Mode, Intl.…>` — not as an options bag passed by the caller. | manual |
| R7 | Put singular/plural selection in `formatters.ts` (`formatPlural`, `Intl.PluralRules` with `getLocale()`) choosing between Paraglide keys, rather than branching on `count === 1` at call sites. | manual |
| R8 | Keep pure presentation in `formatters.ts`. Time arithmetic inside it uses `MS_PER_SECOND` / `MS_PER_MINUTE` / `MS_PER_HOUR` from `packages/engine/src/time.ts` and is not redefined with `60`/`3600` literals. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "new Intl\\.|Intl\\.(DateTimeFormat|NumberFormat|Collator|PluralRules|RelativeTimeFormat|ListFormat)\\("
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/lib/formatters.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags an `Intl.Segmenter` used for non-presentational text processing if one is ever
    introduced.
R2:
  type: grep
  pattern: "\\.toLocale(Date|Time)?String\\("
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/lib/formatters.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `Number.prototype.toLocaleString` for a thousands separator is caught by the same pattern — it
    is still a violation here (use `formatNumber`), but review before rewriting.
R3:
  type: manual
  reason: >
    Whether a formatter's variants are a closed union or an options bag is a signature shape, not a
    pattern; deciding that a new variant deserves a mode rather than a call-site option requires
    reading the call sites.
  enforcedBy: null
R7:
  type: manual
  reason: >
    An inline `count === 1` branch is indistinguishable by pattern from any other count-dependent
    branch; `rg -n "=== 1 \\?|=== 1\\)" apps/web/src` narrows the reading list.
  enforcedBy: null
R8:
  type: grep
  pattern: "(\\*|/|%) *(60|3600)\\b"
  include: ["apps/web/src/lib/formatters.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known; lookup-table keys such as `3600: '60 min'` do not match."
```

## 4. Trade-offs

- **Good, because** a single module decides the field set, fraction digits and locale, so the same value renders identically on every screen and a format change is one edit.
- **Good, because** formatter construction is hoisted out of render paths — each formatter is built once at module scope rather than per render.
- **Good, because** the mode unions make the formatting surface discoverable from one file: an agent reading `NumberFormatMode` sees every number format the app uses.
- **Bad, because** a fixed mode union means a genuinely one-off format cannot be expressed at the call site — it forces a new mode into the shared union, and the union accretes variants used once.
- **Bad, because** building formatters at module scope with `getLocale()` fixes them to the locale active at import time; a runtime language switch must re-evaluate the module, not just re-render.
- **Neutral, because** loose named exports keep each formatter tree-shakeable, at the cost of no single import that lists the whole surface.

## 5. Reference implementation

`apps/web/src/lib/formatters.ts` (excerpt):

```ts
import { getLocale } from '@pacevault/i18n/runtime.js';
import { MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from '@pacevault/engine/time.ts';

export type DateFormatMode =
  | 'date'
  | 'date-time'
  | 'short'
  | 'numeric-day'
  | 'numeric-month'
  | 'month-year'
  | 'hour-minute';

const DATE_FORMATS: Record<DateFormatMode, Intl.DateTimeFormat> = {
  date: new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric' }),
  'date-time': new Intl.DateTimeFormat(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }),
  short: new Intl.DateTimeFormat(getLocale(), { dateStyle: 'short' }),
  'numeric-day': new Intl.DateTimeFormat(getLocale(), {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }),
  'numeric-month': new Intl.DateTimeFormat(getLocale(), { month: 'numeric', year: 'numeric' }),
  'month-year': new Intl.DateTimeFormat(getLocale(), { month: 'long', year: 'numeric' }),
  'hour-minute': new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit' }),
};

export const formatDate = (value: number | Date, mode: DateFormatMode = 'date'): string =>
  DATE_FORMATS[mode].format(value);

export type NumberFormatMode =
  | 'integer'
  | 'one-decimal'
  | 'one-decimal-ungrouped'
  | 'fixed-one-decimal'
  | 'fixed-two-decimals'
  | 'signed-fixed-one-decimal'
  | 'percent';

const NUMBER_FORMATS: Record<NumberFormatMode, Intl.NumberFormat> = {
  integer: new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }),
  'one-decimal': new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }),
  'one-decimal-ungrouped': new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: 1,
    useGrouping: false,
  }),
  'fixed-one-decimal': new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
  'fixed-two-decimals': new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  'signed-fixed-one-decimal': new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'negative',
  }),
  percent: new Intl.NumberFormat(getLocale(), { style: 'percent' }),
};

export const formatNumber = (value: number, mode: NumberFormatMode = 'integer'): string =>
  NUMBER_FORMATS[mode].format(value);

const pluralRules = new Intl.PluralRules(getLocale());

export const formatPlural = (
  count: number,
  forms: { one: () => string; other: () => string },
): string => {
  if (pluralRules.select(count) === 'one') {
    return forms.one();
  }
  return forms.other();
};

export const formatDuration = (seconds: number): string => {
  const ms = seconds * MS_PER_SECOND;
  const h = Math.floor(ms / MS_PER_HOUR);
  const mins = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  const s = Math.floor((ms % MS_PER_MINUTE) / MS_PER_SECOND);
  if (h > 0) return `${h}h ${mins}m`;
  if (mins > 0) return `${mins}m ${s}s`;
  return `${s}s`;
};
```

Call sites:

```ts
formatDate(lastUpdated, 'date-time');
formatNumber(weight, 'one-decimal');
formatUnit(temperature, 'celsius');
formatPlural(sessionCount, {
  one: () => m.ui_count_sessions_one(),
  other: () => m.ui_count_sessions_other({ count: String(sessionCount) }),
});
```

## 6. Forbidden practices

- ❌ `new Intl.DateTimeFormat(...)` / `new Intl.NumberFormat(...)` / `new Intl.Collator(...)` in a component, hook or lib module other than `formatters.ts` — the field set and digits escape review and diverge silently.
- ❌ `date.toLocaleDateString()` or `value.toLocaleString()` anywhere in the UI — it reads the browser's locale instead of the app's Paraglide locale.
- ❌ An options bag on a shared formatter (`formatDate(ts, { includeTime: true })`) — add a mode to the union instead, so every variant is listed in one type.
- ❌ Inlining `count === 1 ? m.x_one() : m.x_other({ count })` at a call site instead of `formatPlural` — it hard-codes English plural rules.
- ❌ Re-deriving time units inside `formatters.ts` with `/ 3600`, `% 60` or `* 60` — use the `MS_PER_*` constants.
