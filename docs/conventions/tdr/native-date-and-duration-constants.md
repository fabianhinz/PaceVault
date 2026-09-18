---
kind: pattern-apply-tdr-reference
id: native-date-and-duration-constants
title: Native Date with composed millisecond duration constants
summary: Points in time are native Date, durations are milliseconds composed from shared MS_PER_* constants, and no date library is on the dependency graph.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "tests/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-09-17
---

# Native Date with composed millisecond duration constants

## 1. Context

This file carries R1–R5.

Every duration in this application — a cache lifetime, a debounce delay, a time-range window, an elapsed-time computation — is a number of milliseconds, and every point in time is a native `Date` or a unix-millisecond number. There is no date or duration library on the dependency graph, and adding one is the decision this record closes: the cost of a dependency that every module would then reach for outweighs the arithmetic it saves, because the arithmetic this application actually performs is subtraction and division by a unit.

The unit is named rather than spelled out. A duration is built by composing the `MS_PER_SECOND` / `MS_PER_MINUTE` / `MS_PER_HOUR` / `MS_PER_DAY` constants in `src/lib/duration.ts`, which are themselves defined by composition so the unit is readable at the point of use. Without this the same quantity appears as `86400000`, as `24 * 60 * 60 * 1000` and as `1000 * 60 * 60 * 24` in three modules, and a reviewer has to do the multiplication to find out whether two of them agree.

This sits alongside the engine's own unit discipline (`src/packages/engine/CLAUDE.md`), which fixes seconds for durations and unix milliseconds for timestamps inside the engine. Rendering a `Date` or a duration as text for a human is a separate concern and belongs to the intl-namespace record.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Do not add a date, time or duration library to `package.json`. Points in time are native `Date` or unix-millisecond numbers; durations are numbers of milliseconds. | manual |
| R2 | Express a duration of a second or more by multiplying an `MS_PER_*` constant from `src/lib/duration.ts`. Do not write the unit conversion inline. | proposed |
| R3 | Bind every duration that is not already an `MS_PER_*` expression to a named constant whose name carries the unit. Do not pass a bare numeric literal as a timeout, interval, debounce delay, cache lifetime or expiry at the call site. | manual |
| R4 | Compute an interval between two points in time as the difference of their `.getTime()` values (or of two unix-millisecond numbers), then divide by the `MS_PER_*` constant for the unit wanted. | manual |
| R5 | Treat a `Date` as immutable. Derive a new point in time with `new Date(base.getTime() ± duration)`; never call a `set*` mutator on an existing instance. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "\"(date-fns|dayjs|luxon|moment|js-joda|@js-joda/core)\""
  include: ["package.json"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: grep
  pattern: "(1000 \\* 60|60 \\* 1000|60 \\* 60 \\* 1000|24 \\* 60 \\* 60|3600 \\* 1000|86400000|3600000)"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/duration.ts", "src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Misses a conversion written in an order this pattern does not list, and flags a literal that
    is genuinely a frequency or a byte count rather than a duration — read the surrounding line.
R3:
  type: grep
  pattern: "(setTimeout|setInterval)\\([^,]+,\\s*[0-9]+\\s*\\)|(staleTime|gcTime|maxAgeSeconds):\\s*[0-9]+"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/duration.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `setTimeout(fn, 0)` as a macrotask yield is not a duration and needs no name. Does not see a
    delay passed through an intermediate variable that is itself a bare literal.
R4:
  type: manual
  reason: >
    Confirming that an elapsed-time computation divides by the right unit constant, rather than by
    a number that happens to equal it, is a reading of the expression.
  enforcedBy: null
R5:
  type: grep
  pattern: "\\.set(FullYear|Month|Date|Hours|Minutes|Seconds|Milliseconds|Time|UTC[A-Za-z]+)\\("
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a `.setTime(` on a non-Date object and any user-defined `setDate` action on a store
    slice — check the receiver's type.
```

## 4. Trade-offs

- **Good, because** the unit is readable at the point of use, so two modules expressing the same window are comparable by eye rather than by arithmetic.
- **Good, because** there is no date library to disagree about, no second formatting stack, and nothing added to a bundle that ships to a browser.
- **Bad, because** genuinely calendar-aware arithmetic — "the same day last month", DST boundaries, week starts — has to be written by hand against `Date`, and `src/lib/weekKey.ts` already carries some of that. This record does not make that easier; it just declines to buy a library for it.
- **Neutral, because** every duration becomes a multiplication rather than a literal, which is longer to write and clearer to read.

## 5. Reference implementation

`src/lib/duration.ts` — each constant composed from the one below it:

```ts
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
```

A named duration at a call site, and an elapsed-time computation:

```ts
const WEATHER_CACHE_MS = 7 * MS_PER_DAY;

const elapsedDays = (from: number, to: number): number => (to - from) / MS_PER_DAY;
```

## 6. Forbidden practices

- ❌ Adding `date-fns`, `dayjs`, `luxon` or `moment` to solve an arithmetic problem this record already answers.
- ❌ `24 * 60 * 60 * 1000` written inline — the reader has to multiply before they know what window this is.
- ❌ `86400000` as a literal, named or not; the composed constant says "a day" and the number does not.
- ❌ A bare numeric literal as the second argument to `setTimeout`/`setInterval`, or as a `staleTime`/`gcTime`, where nothing names the unit.
- ❌ `d.setDate(d.getDate() + 7)` — it mutates a value another holder may still be reading. Derive a new `Date` instead.
