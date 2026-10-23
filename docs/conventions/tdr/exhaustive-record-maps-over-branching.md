---
kind: pattern-apply-tdr-reference
id: exhaustive-record-maps-over-branching
title: Exhaustive record maps for per-member values, exhaustive switches for per-member behaviour
summary: A closed union's per-member value is a Record<Union, T> named VALUE_BY_KEY and indexed without fallback; per-member behaviour is a switch with no default; unions with a runtime list derive from it.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/engine/src/**/*.ts"
  - "packages/testing/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/docs/banner/**/*.tsx"
  - "tools/docs/*.config.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Exhaustive record maps for per-member values, exhaustive switches for per-member behaviour

## 1. Context

This file carries rules R1 through R9.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant; the kit's class maps keyed by a variant union are named `CLASSES_BY_<UNION>`. They bind `packages/engine/src` too, where the closed unions are the domain's own (`Sport`, `Gender`, `RaceDistance`, the energy methods, the effort signals): a per-member coefficient or bound is a `<VALUE>_BY_<KEY>` record (`BANISTER_BY_GENDER`, `METERS_BY_RACE_DISTANCE`), and per-member computation is an exhaustive `switch`. The series builders in `packages/testing/src` follow the same rules: a scenario that only differs in the fields it sets per member is a record map (`FIELDS_BY_INVALID_RECORD_KIND`).

Closed string unions drive most of the branching in this app: a sport, a colour mode, a lap source, an import phase, a camera fit. Whenever such a union gains a member, every place that answers "and what about this one?" must be revisited, and missing one costs a silent fallthrough — an empty label, a wrong colour, a lap set that is never built — rather than a compile error. This record fixes the two forms that make the compiler do that revisiting, and the criterion for choosing: a `Record<Union, T>` object literal when the per-member answer is a **value**, an exhaustive `switch` when it is **behaviour**.

Scope: all first-party source in `apps/web/src`. Out of scope: dictionaries keyed by an open type — an id, a `string`, a number window — which are `Record<K, V>` in syntax only, and maps deliberately declared `Partial<Record<Union, T>>`, which opt out on purpose and handle the missing key at the call site. The repository forbids ternaries in `.ts` files, which already pushes per-member choices toward these two forms.

The rules bind `tools/docs` as well (`tools/docs/banner/**`, `tools/docs/*.config.ts`), where the closed unions are the banner locale, the flow and tile keys and the shot fit: a per-locale value lives in the `Record<BannerLocale, …>` entry of that locale (`BANNER_TEXT_BY_LOCALE`, `BROWSER_LOCALE_BY_BANNER_LOCALE`), the flow and tile keys derive from their ordered runtime lists (`FLOW_KEYS`, `TILE_KEYS`), and per-key files and classes are `<VALUE>_BY_<KEY>` records (`FRAMES_BY_FLOW`, `SHOT_FILE_BY_TILE`, `CLASSES_BY_SHOT_FIT`).

The rules bind `tools/workbench` as well (`scripts/`, `site/src/`), where the closed unions are the item statuses, types and areas (`scripts/frontmatter.ts`), the board's buckets, slots and reasons (`site/src/lib/vocabulary.ts`) and the dependency graph's layers.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare a closed union that has, or is checked against, a runtime list as an `as const` array or object plus a derived type (`(typeof X)[number]` or `(typeof X)[keyof typeof X]`) — `SPORTS`/`Sport` is the model. Never a TS enum, never a hand-maintained union duplicated by a separate runtime list. | proposed |
| R2 | When every member of a closed union maps to a **value** that depends on nothing but the member — a label, an icon, a colour token, a number, an accessor — express it as one object literal typed `Record<Union, T>` and index it. Do not write a chain of conditionals to reach the same value. | manual |
| R3 | When the per-member answer is **behaviour** — a computation over the member's payload, an early return, a case reading fields only that member carries, or several members sharing one arm by fall-through — use a `switch` on the discriminant with no `default` arm, in a function with an explicit return type, so an unhandled member fails `vp check`. A record map is not a substitute here. | proposed |
| R4 | Type the map by annotation (`const x: Record<Union, T> = {…}`) when the value type is the point. Use `} satisfies Record<Union, T>` when callers need the literal types of the entries and still want the exhaustiveness check. Never both, and never neither. | manual |
| R5 | Index a fully exhaustive map directly (`map[key]`). Do not soften the lookup with `??`, `?.` or a default entry. | manual |
| R6 | When a map genuinely cannot cover every member, declare it `Partial<Record<Union, T>>` so the optionality is in the type and the call site handles `undefined`. Do not achieve the same by widening the key to `string`. | manual |
| R7 | Do not produce an exhaustive map by casting — `Object.fromEntries(…) as Record<Union, T>`, `{} as Record<Union, T>` — it asserts the guarantee instead of checking it. Build the literal, or accept a partial type and narrow. | manual |
| R8 | Where a value can be reached both by a `switch` and by a map, prefer the map. Split a map per axis (one for labels, one for colours) rather than one map of composite objects, unless the axes are always consumed together. | manual |
| R9 | Put the map next to the union it keys or in the module that owns the presentation concern (copy maps in `apps/web/src/microcopy/<topic>.ts`); name it for both sides of the mapping (`LABEL_BY_SPORT`, `ZONE_VALUE_BY_METRIC`), not after the union alone. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^\\s*(export\\s+)?(const\\s+)?enum\\s"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Covers only the enum half. A union declared as a bare type alias next to a separately written
    runtime array (`as const satisfies readonly X[]` elsewhere, or an `a === 'x' || a === 'y'` list)
    is not flagged; grep `satisfies readonly \\w+\\[\\]` and `=== '\\w+' \\|\\| \\w+ === '` for that half.
R2:
  type: grep
  pattern: "if \\((\\w+(?:\\.\\w+)*) === '[\\w-]+'\\) return [^;]+;\\n\\s*if \\(\\1 === '[\\w-]+'\\) return"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Needs multiline PCRE (`rg -nUP`). Flags chains over an open type (a free string such as
    `LapAnalysis.intensity`) where no exhaustiveness is available, and chains whose arms compute from
    the member's payload — those are R3 cases. Confirm the discriminant is a closed union and each
    arm yields a plain value before reporting.
R3:
  type: grep
  pattern: "if\\s*\\(\\s*(\\w+(\\.\\w+)*)\\s*===\\s*'[^)]*\\)[\\s\\S]{0,400}?(else if|if)\\s*\\(\\s*\\1\\s*==="
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A candidate finder for conditional chains that should be switches; also matches the R2 value
    chains and chains over open types. The `default`-arm half of the rule is `rg -n "default:"`
    inside a `switch`, which also matches object keys named `default`.
R4:
  type: grep
  pattern: "satisfies Record<[A-Z][A-Za-z0-9]*,|:\\s*Record<[A-Z][A-Za-z0-9]*,"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Inventory signal only; cannot see an untyped object literal that should have carried one of the
    two forms, which is the real R4 violation.
R5:
  type: grep
  pattern: "\\b[A-Za-z_][A-Za-z0-9_]*\\s*\\[[^\\]]+\\]\\s*(\\?\\?|\\|\\||\\?\\.\\()"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Most hits are array index access and lookups into genuinely partial or open-keyed maps, which
    must keep their fallback. Only a fallback on an index into a total `Record<Union, T>` violates.
R6:
  type: grep
  pattern: "Record<string,\\s*[^>]+>\\s*=\\s*\\{"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Flags legitimate open-keyed dictionaries (FIT sub-sport codes, store names). A hit is a
    violation only when every key in the literal is a member of a known union.
R7:
  type: grep
  pattern: "as\\s+Record<[A-Z][A-Za-z0-9]*,|as\\s+[A-Z]\\w*\\[\\]\\)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/engine/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A cast onto an open key type is an ordinary dictionary assertion. `Object.keys(x) as Union[]` is
    the companion cast and matches the second alternative.
R8:
  type: manual
  reason: >
    Deciding that a switch's arms are constant enough to become a map, or that a composite map should
    be split per axis, requires reading every arm and its consumers.
  enforcedBy: null
R9:
  type: manual
  reason: >
    Placement and naming are judgements about which module owns the concern.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** adding a member to a union turns into a list of compile errors, one per map and one per switch, each pointing at the exact place a decision is missing.
- **Good, because** a map is a declaration, not control flow: it can be exported, reused by a sibling module, iterated, and read as a table.
- **Bad, because** an object literal evaluates every entry eagerly. Values that are expensive, read state, or must not run for the non-selected members have to be thunks — which is why copy maps hold `m.*` functions, not called messages.
- **Bad, because** a map cannot narrow. A case needing the member's own payload fields must use a switch.
- **Bad, because** the guarantee is exactly as closed as the union. A union widened to `string` anywhere along the way makes both forms look safe while checking nothing.
- **Neutral, because** presentation code tends to answer "what does this member look like" with maps and orchestration code "what does this member do" with switches, so the criterion rarely has to be argued.
- **Neutral, because** `satisfies` keeps literal types at the cost of a noisier declaration; both forms check exhaustiveness identically.

## 5. Reference implementation

```ts
export const LAP_SOURCES = ['off', 'device', 'splits', 'efforts'] as const;
export type LapSource = (typeof LAP_SOURCES)[number];

export const LABEL_BY_IMPORT_PHASE: Record<ImportPhase, () => string> = {
  preparing: m.ui_import_phase_preparing,
  importing: m.ui_import_phase_importing,
  saving: m.ui_import_phase_saving,
};

const ZONE_VALUE_BY_METRIC: Record<TrackMetric, (record: SessionRecord) => number | undefined> = {
  hr: (record) => record.hr,
  power: (record) => record.power,
  pace: (record) => record.speed,
  speed: (record) => record.speed,
};

export const acwrFill = {
  green: tokens.statusSuccessStrong,
  yellow: tokens.statusWarningStrong,
  red: tokens.statusDangerStrong,
} satisfies Record<ReturnType<typeof getACWRColor>, string>;

const PRECIPITATION_BY_CONDITION: Partial<Record<WeatherCondition, PrecipitationType>> = {
  drizzle: 'rain',
  rain: 'rain',
  snow: 'snow',
  thunderstorm: 'thunderstorm',
};
```

The behavioural counterpart:

```ts
export const formatPBValue = (pb: PersonalBest): string => {
  switch (pb.category) {
    case 'peak-power':
      return `${pb.value}W`;
    case 'fastest-distance':
      return formatDuration(pb.value);
    case 'longest':
      return formatDistance(pb.value);
    case 'most-elevation':
      return `${formatDistance(pb.value)} ↑`;
  }
};
```

## 6. Forbidden practices

- ❌ An `if` chain over a union's members with a trailing `return` that silently serves the last member — nothing fails when a member is added.
- ❌ A `switch` over a union carrying a `default` arm. It converts the missing-member error into a runtime fallback.
- ❌ Indexing a total `Record<Union, T>` and then writing `?? fallback` or `?.()` — the fallback can only fire for a member the type says cannot exist.
- ❌ Asserting a map into existence with `as Record<Union, T>` over `{}`, a `reduce` or `Object.fromEntries`.
- ❌ Widening a map's key to `string` (`Record<string, string>` keyed by sport or status). Key it by the union, or use `Partial<Record<Union, T>>` and handle `undefined`.
- ❌ Declaring the union as a TS enum, or as a type alias shadowed by a separately maintained runtime array or `=== … ||` list.
- ❌ A map whose values are already-called messages or computed results rather than functions or plain data — every member pays the cost, and called messages freeze the locale at module load.
- ❌ Forcing a behavioural dispatch into a map of callbacks when the arms need the narrowed payload.
- ❌ One map of composite objects covering several unrelated presentation axes, consumed a field at a time.
