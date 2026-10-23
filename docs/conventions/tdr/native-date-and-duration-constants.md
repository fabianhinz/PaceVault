---
kind: pattern-apply-tdr-reference
id: native-date-and-duration-constants
title: Native Date with composed millisecond duration constants
summary: Points in time are native Date, durations are milliseconds built from MS_PER_SECOND/MINUTE/HOUR/DAY in packages/engine/src/time.ts, bound to unit-named constants, with no date or duration library.
governs:
  - "package.json"
  - "apps/web/package.json"
  - "packages/*/package.json"
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "apps/web/tests/**/*.ts"
  - "apps/web/tests/**/*.tsx"
  - "packages/engine/src/**/*.ts"
  - "packages/engine/tests/**/*.ts"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/ui/tests/**/*.ts"
  - "packages/ui/tests/**/*.tsx"
  - "packages/testing/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/docs/*.config.ts"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Native Date with composed millisecond duration constants

## 1. Context

This file carries R1–R5 (R5 in this project's narrowed form). Every duration in the app — a poll interval, a camera animation, a timeout, an elapsed-time computation — is a number of milliseconds, and every point in time is a native `Date` or a unix-ms number (session and lap dates, `packages/engine/CLAUDE.md` Units). There is no date or duration library on the dependency graph, and adding one is the decision this record closes: the arithmetic the app performs is subtraction and division by a unit.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant. The test factories and series builders in `packages/testing/src` follow R2 and R3 as well, importing the constants as `@pacevault/engine/time.ts` (the package already depends on the engine). `tools/docs` (the banner capture `tools/docs/banner/**/*.ts` and `tools/docs/*.config.ts`) follows R3 like the kit: it does not depend on the engine, so a Playwright timeout or wait is a unit-named literal constant (`const UI_READY_TIMEOUT_MS = 15_000;`), never a bare number at the call site.

The unit is named rather than spelled out. A duration is built by composing `MS_PER_SECOND` / `MS_PER_MINUTE` / `MS_PER_HOUR` / `MS_PER_DAY` from `packages/engine/src/time.ts` — the widest runtime that needs them, pure and importable from the app, the workers and the tools as `@pacevault/engine/time.ts`. Without this the same quantity appears as `86_400_000`, as `24 * 60 * 60 * 1000` and as a local `DAY_MS` in several modules, and a reviewer has to do the multiplication to find out whether two of them agree.

Local-calendar steps are the exception this project keeps: "next day" or "start of day" across a daylight-saving boundary is not a fixed number of milliseconds, so a `set*` call on a freshly constructed copy stays the sanctioned way to take such a step (R5). Rendering a `Date` or a duration as text is `formatting-through-intl-namespace`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Do not add a date, time or duration library to any `package.json` of the workspace. Points in time are native `Date` (or unix ms); durations are numbers of milliseconds. | manual |
| R2 | Express a duration of a second or more by multiplying a `MS_PER_*` constant from `packages/engine/src/time.ts`. Do not write the unit conversion inline (`* 1000`, `/ 1000`, `60_000`, `3600 * 1000`). `packages/ui` does not depend on `@pacevault/engine` and takes no dependency for this: a kit duration is a unit-named literal constant (`const TOAST_DURATION_MS = 4000;`, R3). | proposed |
| R3 | Bind every duration that is not already a `MS_PER_*` expression to a named constant whose name carries the unit (`…_MS`). Do not pass a bare numeric literal as a timeout, interval, delay, animation duration, cache lifetime or expiry at the call site. | manual |
| R4 | Compute an interval between two points in time as the difference of their `.getTime()` values (or unix-ms numbers), then divide by the `MS_PER_*` constant for the unit wanted. | manual |
| R5 | Treat a `Date` that came from elsewhere as immutable. Derive a new point in time for a fixed duration with `new Date(base.getTime() ± duration)`. A `set*` mutator is allowed only on a copy constructed in the same function, for a local-calendar step (start/end of day, next/previous calendar day). | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "\"(date-fns|date-fns-tz|dayjs|moment|moment-timezone|luxon|@js-joda/[a-z-]+|js-joda|@formatjs/intl-durationformat|temporal-polyfill|humanize-duration|pretty-ms|ms)\" *:"
  include: ["package.json", "apps/web/package.json", "packages/*/package.json"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A transitive dependency is not a violation; only a direct entry counts. The bare key `ms` must be matched exactly."
R2:
  type: grep
  pattern: "[0-9_]+ *\\* *(60|24|1000|1_000) *\\* *[0-9_]+|(\\*|/) *1000\\b|\\b(60_000|3_600_000|86_400_000|86400000|3600000)\\b"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "apps/web/tests/**/*.tsx", "packages/engine/src/**/*.ts", "packages/engine/tests/**/*.ts", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/ui/tests/**/*.ts", "packages/ui/tests/**/*.tsx", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/*.config.ts"]
  exempt: ["packages/engine/src/time.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Flags metre/kilometre conversions (`distance / 1000`, `thresholdKm * 1000`, pace in sec/km) and byte arithmetic. Read the surrounding identifier before treating a hit as a duration."
R3:
  type: grep
  pattern: "(setTimeout|setInterval)\\([^)]*, *[0-9][0-9_]{2,}\\)|(staleTime|gcTime|refetchInterval|retryDelay|timeout|duration|maximumAge|[Dd]elay|ttl) *: *[0-9][0-9_]{2,}|\\}, *[0-9][0-9_]{3,}\\);"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/ui/tests/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/*.config.ts"]
  exempt: ["apps/web/src/features/demo/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Noisy. `duration` is also a seconds field on workout and demo data. A literal on the right-hand side of a named-constant declaration is the sanctioned form. Treat every hit as a question, not a finding."
R4:
  type: grep
  pattern: "(valueOf\\(\\) *-|\\+[a-zA-Z_$][\\w$]* *-|Number\\([a-zA-Z_$][\\w$]*\\) *- *Number\\()"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/docs/banner/**/*.ts", "tools/docs/*.config.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Unary-plus and Number() coercion are used on plenty of values that are not dates. This entry only surfaces the coercion alternatives for a human to judge."
R5:
  type: grep
  pattern: "\\.(setDate|setHours|setMinutes|setSeconds|setMilliseconds|setMonth|setFullYear|setTime|setUTCDate|setUTCHours)\\("
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "packages/engine/src/**/*.ts", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/ui/tests/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/*.config.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Every hit is a candidate: a setter on a `new Date(…)` built earlier in the same function for a calendar step is allowed. Only a setter on a `Date` received as a parameter, read from state or shared is the violation."
```

## 4. Trade-offs

- **Good, because** a duration reads as its unit at the point of use: `15 * MS_PER_MINUTE` needs no arithmetic to review, and two modules that mean the same interval are textually comparable.
- **Good, because** the dependency surface stays flat. Nothing needs a library upgrade to keep computing an elapsed interval, and no bundle pays for a locale database it does not use.
- **Bad, because** anything calendar-aware or timezone-aware has to be hand-rolled, and millisecond arithmetic is quietly wrong for it. "One day later" is not always `+ MS_PER_DAY` across a daylight-saving boundary; this project therefore keeps `set*` on a fresh copy for local-calendar steps (R5), which a reader must distinguish from a fixed-duration step.
- **Bad, because** seconds-domain values (record `timestamp`, `durationSec`) and millisecond values coexist, so a conversion still appears at every boundary — now as `* MS_PER_SECOND`, but still one per crossing.
- **Neutral, because** short sub-second intervals (`600`, `800`, `900` ms) stay plain literals bound to `…_MS` names; the rule's value concentrates at second scale and above.

## 5. Reference implementation

`packages/engine/src/time.ts`:

```ts
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = MS_PER_SECOND * 60;
export const MS_PER_HOUR = MS_PER_MINUTE * 60;
export const MS_PER_DAY = MS_PER_HOUR * 24;
```

Consumption — named durations, an interval as a difference divided by the unit, a seconds field crossing into milliseconds:

```ts
import { MS_PER_DAY, MS_PER_MINUTE, MS_PER_SECOND } from '@pacevault/engine/time.ts';

const POLL_MS = 15 * MS_PER_MINUTE;
const GEOLOCATION_TIMEOUT_MS = 10 * MS_PER_SECOND;

const days = Math.round((range.to - range.from) / MS_PER_DAY);
const sessionEndMs = sessionDateMs + durationSec * MS_PER_SECOND;
```

A local-calendar step on a fresh copy (allowed) next to a fixed-duration step (millisecond arithmetic):

```ts
const endOfDay = (date: Date): number => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
};

const cutoff = new Date(Date.now() - 6 * 7 * MS_PER_DAY);
```

## 6. Forbidden practices

- ❌ Adding `date-fns`, `dayjs`, `moment`, `luxon`, `@js-joda/*` or a Temporal polyfill — time handling is native `Date` plus millisecond arithmetic, and one such import makes every subsequent module's choice ambiguous.
- ❌ Writing the unit conversion inline (`durationSec * 1000`, `15 * 60_000`, `24 * 60 * 60 * 1000`) — the factors carry no unit, the operand order varies between authors, and two modules meaning the same interval stop being comparable by reading.
- ❌ A bare millisecond literal at a call site — `timeout: 10_000`, `duration: 1200`, a `60_000` vitest timeout argument. Bind it to a named constant whose name states the unit.
- ❌ A pre-multiplied literal as a "constant" (`const DAY_MS = 86_400_000`, `const HOUR_MS = 3_600_000`) — naming it fixes the call site but leaves the reader verifying the multiplication at the declaration.
- ❌ Mutating a `Date` received from elsewhere with `setDate`, `setHours` or `setTime` — the instance may be shared state or props, and in-place mutation makes the change invisible to every other holder.
- ❌ Coercing dates for arithmetic via unary `+` or `Number()` instead of `.getTime()` — it reads as a numeric cast rather than as taking a timestamp, and silently produces `NaN` on a non-date.
- ❌ Adding a second module of duration constants, or re-declaring a `MS_PER_*` or `DAY_MS` value locally — there is one shared time module and the constants come from it.
