---
kind: pattern-apply-tdr-reference
id: outcome-unions-over-exceptions
title: Expected failure is a returned outcome union, not a thrown exception
summary: Domain operations in src/lib and src/parsers return an explicit outcome union (failure members first, a 'success' member last) for anticipated failures and throw only for broken invariants or infrastructure; the engine warns on a broken input contract and throws only from an unreachable switch default.
governs:
  - "apps/web/src/lib/**/*.ts"
  - "apps/web/src/parsers/**/*.ts"
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R5, R6, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Expected failure is a returned outcome union, not a thrown exception

## 1. Context

This file carries rules R1, R2, R3, R5, R6, R7 and R8.

A domain operation in `apps/web/src/lib/` or `apps/web/src/parsers/` has two kinds of bad news: outcomes the domain anticipates (a FIT file the user dropped is corrupt, lacks a session, records an unsupported sport) and conditions that mean the program is broken (a profile without the threshold history every profile is created with, an archive entry the same listing just returned is gone, IndexedDB refusing a transaction). Collapsing both into `throw` erases the distinction at the call site: the caller cannot tell a user mistake from a bug without reading the message string, and nothing forces it to handle either. A returned union puts every anticipated failure in the signature, where the type checker makes the caller handle it before the value is usable.

Scope: domain operations in `apps/web/src/lib/` and `apps/web/src/parsers/`. HTTP transport in `apps/web/src/lib/intervals.ts` and `apps/web/src/lib/weather.ts` throws `FailedResponseError` per `authenticated-fetch-and-response-parsing`; Zod `safeParse` fallbacks for untyped input follow the root `CLAUDE.md` code rules. Outcome literals are lowercase strings; the project uses no enums.

R1, R3 and R5 bind `packages/engine/src` as well: its anticipated failures are insufficient data rather than user mistakes. An engine operation with two or more distinguishable failures returns a named outcome union (`StepLengthOutcome`, `DecouplingOutcome`, `EnergyOutcome`); an operation with a single "no result" case keeps `T | undefined`, and insufficient data degrades silently. A broken contract is different: an input that contradicts its declared type or a documented precondition is a bug upstream, and degrading silently hides it. The engine therefore logs such an input with `console.warn` before it degrades (R7), and the only throw in the engine is the unreachable `default` branch of a `switch` over a closed domain union (R8).

`packages/gpx/src` follows the engine's reading: it never throws, `parseGpx` returns `ParseGpxOutcome` for its three anticipated failures (`'malformed xml'`, `'not gpx'`, `'too few points'`), and its single-failure functions (`buildGpxString`, `buildRouteGeometry`, `pointAtRouteDistance`, `routeDistanceAtPosition`) keep their `T | null` return. The app maps each `parseGpx` failure member to its own message at the hooks that raise the import and edit-in-studio toasts (R6, `DESCRIPTION_BY_GPX_FAILURE` in `apps/web/src/microcopy/gpxImport.ts`).

In `tools/workbench` R1, R3 and R5 bind the board's line edits (`site/src/lib/writeBack.ts`, `EditOutcome`) and the scripts' git reading (`scripts/changedFiles.ts`, `GitChangesOutcome`), by owner decision; their callers keep every message, HTTP code and exit code. Its other single-failure helpers keep `T | undefined`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Model every anticipated failure of a domain operation in `apps/web/src/lib/` or `apps/web/src/parsers/` as a member of its declared return union, discriminated by an `outcome` field holding a lowercase string literal that names the failure (`'missing session'`, `'unsupported sport'`). | manual |
| R2 | Reserve `throw` for broken invariants, data that contradicts itself, and infrastructure failure — never for a refusal or a missing piece of input the caller is expected to survive. A FIT file missing a required field is an outcome, not an exception. | manual |
| R3 | Declare the union explicitly as a named type on the signature (`Promise<ParseFitFileOutcome>`), ordering failure members before the success member; the success member is `{ outcome: 'success', ... }` and carries the payload under a named field. | proposed |
| R5 | Handle every member of a returned outcome union at the call site before using the value — narrow with `if (x.outcome !== 'success')` or a `switch`; a `switch` omits the `default` clause so the compiler proves exhaustiveness. | proposed |
| R6 | Map outcome members to user-facing copy (Paraglide `m.*` messages) or toast variants only at the component boundary — never inside the parser or the lib function. | manual |
| R7 | In `packages/engine/src`, a branch that degrades because an input breaks its contract (a non-finite number, a non-positive threshold, thresholds that contradict each other, a distance running backwards) logs `console.warn('<function>: <condition>', <value>)` before it returns. A branch for insufficient data (too few records, an absent optional field or threshold) stays silent. | manual |
| R8 | In `packages/engine/src`, a `switch` over a closed domain union ends in `default: { const unreachable: never = <value>; throw new Error('<function>: unknown <union>', { cause: unreachable }); }`, so the compiler still proves exhaustiveness and a value from outside the type fails loudly at runtime. This is the engine's only `throw`. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    The violation is a function that SHOULD return an outcome but throws or returns a bare
    undefined for several distinguishable failures. Whether a failure is anticipated requires
    reading where its input comes from (user files and API data: anticipated; values the app
    itself wrote a statement earlier: invariant).
  enforcedBy: null
R2:
  type: grep
  pattern: "throw new (Error|[A-Z][A-Za-z]*Error)\\("
  include: ["apps/web/src/lib/**/*.ts", "apps/web/src/parsers/**/*.ts", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts"]
  exempt: ["apps/web/src/lib/debug/**", "apps/web/src/lib/fetchResponse.ts", "apps/web/src/lib/intervals.ts", "apps/web/src/lib/weather.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    High. Most matches are legitimate invariant throws (`lib/thresholdsAt.ts`, `lib/archive.ts`).
    A throw is a violation when the failing condition is reachable from a user file or API payload.
R3:
  type: grep
  pattern: "outcome: 'success'"
  include: ["apps/web/src/lib/**/*.ts", "apps/web/src/parsers/**/*.ts", "packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Inverted detector — it finds conforming modules, so a no-match on a module with no anticipated
    failure mode is spurious. Read the union type to confirm failures come first.
R5:
  type: lint
  pattern: "typescript/switch-exhaustiveness-check"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Not configured in the root `vite.config.ts` lint block today (proposed in the tooling plan).
    Blind to the if/else shape; for that, check by hand that every `parseFitFile(` call is followed
    by an `outcome !== 'success'` branch before `.parsed` is read.
R6:
  type: grep
  pattern: "from '@pacevault/i18n/messages.js'"
  include: ["apps/web/src/parsers/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Catches copy inside parsers only; copy inside a lib domain function needs a read."
R7:
  type: manual
  reason: >
    Whether a degrading branch is a broken contract or insufficient data needs a read of where its
    input comes from. Review queue: `rg -n "return (undefined|null);" packages/engine/src` against
    `rg -n "console\\.warn" packages/engine/src`.
  enforcedBy: null
R8:
  type: manual
  reason: >
    Review queue: every `rg -n "switch \\(" packages/engine/src` hit must end in a default branch
    that assigns to never and throws; `rg -n "throw " packages/engine/src` must list only those.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the return type is the documentation: a reader of the signature sees every way the call can fail without opening the body, and the type checker refuses to let `parsed` be used before the outcome has been discriminated.
- **Good, because** the parser states *what* happened in domain terms, and only the component decides whether a failure is a counter in the import summary, a toast, or a log line.
- **Bad, because** a string literal carries no stack trace. When something does go wrong there is no capture point to attach a trace to; members that need detail carry it in a field (`detail`).
- **Bad, because** the outcome must be threaded by hand through every caller: a throw unwinds for free, a union has to be re-narrowed at each hop.
- **Bad, because** the compiler's exhaustiveness guarantee only covers a `switch`; the `if (outcome !== 'success')` shape compiles fine whatever members exist, which is acceptable only when every failure is handled the same way.
- **Neutral, because** the literals are ad hoc per operation rather than drawn from a shared vocabulary, which keeps each signature self-describing at the cost of wording drift between modules.

## 5. Reference implementation

```ts
export type ParseFitFileOutcome =
  | { outcome: 'unreadable'; detail: string }
  | { outcome: 'missing session' }
  | { outcome: 'unsupported sport' }
  | { outcome: 'missing start time' }
  | { outcome: 'missing timer time' }
  | { outcome: 'invalid record'; detail: string }
  | { outcome: 'invalid lap'; detail: string }
  | { outcome: 'success'; parsed: ParsedFitResult };

export const parseFitFile = async (
  arrayBuffer: ArrayBuffer,
  fileName: string,
  profileAt: (date: number) => FitParseProfile,
  meta?: { name?: string },
): Promise<ParseFitFileOutcome> => {
  const fitSession = data.sessions?.[0];
  if (!fitSession) return { outcome: 'missing session' };
  const sport = mapFitSportToAppSport(fitSession.sport);
  if (!sport) return { outcome: 'unsupported sport' };
  return { outcome: 'success', parsed: { session, records, laps, fingerprint } };
};
```

At the boundary, every member is handled before the payload is used:

```ts
const outcome = await parseFitFile(data, fileName, toFitParseProfile(profile));
if (outcome.outcome !== 'success') {
  failed++;
} else {
  await batcher.add({ ...outcome.parsed, rawData: data, fileName, source: { kind: 'file' } });
}
```

## 6. Forbidden practices

- Throwing a bare `Error` whose message describes an anticipated condition (`Failed to parse FIT file "run.fit": start_time is missing`) — the caller has to string-match the message to recover, and a missing `catch` turns a bad user file into a crash.
- Returning a bare `null` or `undefined` to mean failure when more than one failure is possible.
- Returning a boolean success flag, or `{ ok: false }` without a discriminating member.
- A `switch` over an outcome union with a `default` clause (the engine's R8 `default` over a closed domain union, which assigns to `never`, is the one exception).
- A silent `return undefined` in the engine for an input that breaks its contract, or a `console.warn` for ordinary insufficient data.
- A `throw` in the engine anywhere but an R8 `default` branch.
- Reading `.parsed` (or any success payload) before the outcome has been narrowed.
- Paraglide messages, toast calls or UI copy inside a parser or a lib domain function.
