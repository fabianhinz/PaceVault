---
kind: pattern-apply-tdr-reference
id: formatting-through-intl-namespace
title: User-facing date and locale formatting goes through the intl namespace
summary: Every Intl formatter and locale-aware comparison lives in one namespace module that owns the locale; call sites name a mode, never a locale or an options bag.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8]
adopted: 2026-09-17
---

# User-facing date and locale formatting goes through the intl namespace

## 1. Context

This file carries R1–R8.

Every timestamp, relative time, plural noun phrase and locale-aware sort order a user sees is produced by one module — a single `intl` namespace object in `src/lib/intl.ts` that owns the `Intl.*` constructors and the active locale. Without it, each view picks its own field set and hour cycle, and the same instant renders three different ways on three screens; worse, the locale becomes an implicit per-call-site decision that nobody can audit.

The locale is decided *inside* the module, from Paraglide's `getLocale()`. No exported method accepts a locale argument and no call site passes one. This is the same rule the convention was drawn from, with the locale source inverted: that project hardcoded one locale because it was English-only by construction; this one is multi-locale, and the constant is replaced by one read from the i18n runtime — in the same one place.

Scope: user-facing presentation. Deliberately out of scope: pure numeric formatting — pace, distance, duration, speed — which constructs no `Intl` formatter and lives as loose exports in `src/lib/formatters.ts`; and machine-facing string comparison (sorting opaque identifiers, diffing, serialisation), which is not presentation and must not be routed through the collator.

Time arithmetic uses the shared duration constants and is not redefined here. Translation of the surrounding sentence is Paraglide's; this module formats the values inside it.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Construct `Intl.*` formatters only inside `src/lib/intl.ts`. Call sites import the namespace object and call its methods. | proposed |
| R2 | Never call `toLocaleDateString`, `toLocaleTimeString`, `toLocaleString` or a bare `localeCompare` on a value that reaches the UI. Route it through the namespace. | proposed |
| R3 | Express the variations of a format as a closed mode union exported as a type, with a default mode — not as an options bag passed by the caller. Adding a format means adding a mode. | manual |
| R4 | Sort user-visible lists with the shared collator instance (`intl.collator.compare`), not with `localeCompare` or a bare `.sort()`. | proposed |
| R5 | Hold the locale inside the module, read once from the i18n runtime. Do not accept a locale argument at any exported method, and do not read it from the environment or the browser at a call site. | proposed |
| R6 | Export the surface as a single namespace object at the module's end; keep the individual formatter functions module-private so the object is the only entry point. | manual |
| R7 | Put singular/plural noun-phrase selection in the same namespace rather than inlining a ternary on `length === 1` at call sites. | manual |
| R8 | Keep pure presentation in this module. Time arithmetic uses the shared duration constants and is not redefined here, and pure numeric formatting stays in its own module. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "new Intl\\."
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/intl.ts", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: grep
  pattern: "toLocaleDateString|toLocaleTimeString|toLocaleString|\\.localeCompare\\("
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/intl.ts", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A `localeCompare` on an opaque identifier for a stable machine sort is out of scope and matches
    too; read what is being compared.
R3:
  type: grep
  pattern: "formatDate\\([^,)]+, \\{"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: grep
  pattern: "\\.sort\\(\\)|\\.sort\\(\\(a, b\\) => a\\.[a-zA-Z]+\\.localeCompare"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/intl.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A bare `.sort()` over numbers or over machine-facing strings is not a user-visible list.
R5:
  type: grep
  pattern: "locale(: string)?[,)]"
  include: ["src/lib/intl.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    The module's own internal `const locale = getLocale()` matches; only an exported method's
    parameter is a violation.
R6:
  type: grep
  pattern: "^export "
  include: ["src/lib/intl.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    The mode type is a legitimate second export alongside the namespace object; expect two.
R7:
  type: grep
  pattern: "length === 1 \\?"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/intl.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A `length === 1` test that selects behaviour rather than a noun phrase also matches.
R8:
  type: manual
  reason: >
    Whether something in the module is arithmetic rather than presentation is a reading of it.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the same instant renders identically everywhere, and changing how dates look is one edit rather than a search for field sets.
- **Good, because** the locale is auditable: exactly one module decides it, so a locale bug has one place to be.
- **Bad, because** the mode union makes a one-off format a change to the shared module rather than a local call, so a chart axis that wants an unusual form has to negotiate for a mode.
- **Bad, because** routing through a namespace object costs tree-shaking for the module, and a page that formats one date keeps every formatter reachable.
- **Neutral, because** it splits `src/lib/formatters.ts` in two along a line — "does it construct an `Intl` formatter" — that is precise but not obvious from a function's name.

## 5. Reference implementation

`src/lib/intl.ts`:

```ts
import { getLocale } from '@/paraglide/runtime.js';

export type DateFormatMode = 'date' | 'date-short' | 'date-time' | 'precise';

const formatterFor = (mode: DateFormatMode): Intl.DateTimeFormat => { … };

const formatDate = (timestamp: number, mode: DateFormatMode = 'date'): string =>
  formatterFor(mode).format(new Date(timestamp));

const collator = new Intl.Collator(getLocale(), { sensitivity: 'base' });

const pluralise = (count: number, one: string, many: string): string =>
  count === 1 ? one : many;

export const intl = { formatDate, collator, pluralise };
```

A call site names a mode, never a locale or an options bag:

```ts
const label = intl.formatDate(session.startTime, 'date-short');
const sorted = [...trips].sort((a, b) => intl.collator.compare(a.name, b.name));
```

## 6. Forbidden practices

- ❌ `new Intl.DateTimeFormat(...)` outside the intl module — a second field set nobody can reconcile with the first.
- ❌ `d.toLocaleDateString(undefined, { … })` in a component; `undefined` defers to the browser's locale, which is not the app's.
- ❌ An options bag parameter on a formatter — the call site then decides the format and no two call sites agree.
- ❌ A `locale` parameter on any exported method; the locale is the module's decision and threading it through call sites undoes the whole record.
- ❌ `list.sort((a, b) => a.name.localeCompare(b.name))` for a user-visible list — it builds a collator per comparison and ignores the app's locale.
- ❌ `count === 1 ? 'session' : 'sessions'` inline at a call site.
- ❌ Moving the numeric pace and distance formatters into this module because they are "formatting"; they construct no `Intl` formatter and have no locale.
