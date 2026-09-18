---
kind: pattern-apply-tdr-reference
id: exhaustive-record-maps-over-branching
title: Exhaustive record maps for per-member values, exhaustive switches for per-member behaviour
summary: A closed union's per-member value is a Record<Union, T> literal indexed directly; its per-member behaviour is a switch with no default arm, so adding a member fails the compiler.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9]
adopted: 2026-09-17
---

# Exhaustive record maps for per-member values, exhaustive switches for per-member behaviour

## 1. Context

This file carries R1–R9.

Closed string unions drive most of the branching here: a sport, a zone name, a form status, a chart mode, a toast variant, a tab. Whenever such a union gains a member, every place that answers "and what about this one?" must be revisited, and the cost of missing one is a silent fallthrough — an empty cell, a missing icon, a component that renders nothing — rather than a compile error. This record fixes the two forms that make the compiler do that revisiting for you, and the criterion for choosing between them: a `Record<Union, T>` object literal when the per-member answer is a **value**, an exhaustive `switch` when the per-member answer is **behaviour**.

Scope: all of `src/`. Deliberately out of scope: dictionaries keyed by an open type — a session id, a FIT file's own sport string, a template-literal key — which are `Record<K, V>` in syntax only and carry no exhaustiveness guarantee; and maps deliberately declared `Partial<Record<Union, T>>`, which opt out on purpose and must then handle the missing key at the call site.

The precondition is already in place: `erasableSyntaxOnly` in `tsconfig.app.json` makes a TypeScript enum a compile error, so every union here is a closed string union and both forms below are compiler-checked.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare a closed union as a frozen `as const` object or array plus a derived type (`(typeof X)[keyof typeof X]` or `(typeof X)[number]`), or as a direct `type X = 'a' \| 'b'` where no runtime member list is needed. Never as a TS enum, never as a hand-maintained union duplicating a runtime list. | enforced |
| R2 | When every member of a closed union maps to a **value** that depends on nothing but the member — a label, an icon, a colour token, a number, a flag — express it as a single object literal typed `Record<Union, T>` and index it. Do not write a chain of conditionals to reach the same value. | manual |
| R3 | When the per-member answer is **behaviour** — a side effect, a `throw`, an `await`, an early return, a case that reads fields only that member carries, or several members sharing one arm by fall-through — use a `switch` on the discriminant with no `default` arm, and let the compiler fail on an unhandled member. A record map is not a substitute here. | proposed |
| R4 | Type the map by annotation (`const x: Record<Union, T> = {…}`) when the value type is the point. Use `} satisfies Record<Union, T>` (optionally after `as const`) when callers need the literal types of the entries. Never both, and never neither. | manual |
| R5 | Index a fully exhaustive map directly (`map[key]`). Do not soften the lookup with `??`, `?.` or a default entry: a fallback silently absorbs exactly the member the map was meant to force you to handle. | manual |
| R6 | When a map genuinely cannot cover every member, declare it `Partial<Record<Union, T>>` so the optionality is in the type and the call site is forced to handle `undefined`. Do not achieve the same by widening the key to `string`. | manual |
| R7 | Do not produce an exhaustive map by casting — `Object.fromEntries(…) as Record<Union, T>` asserts the guarantee instead of checking it. Build the literal, or accept a partial type and narrow. | manual |
| R8 | Where a value can be reached both by a `switch` and by a map, prefer the map: it is one declaration, it can be exported and reused by a sibling module, and it keeps the component body free of control flow. Split a map per axis (one for icons, one for colours, one for labels) rather than one map of composite objects, unless the axes are always consumed together. | manual |
| R9 | Put the map next to the union it keys, or in the module that owns the presentation concern; give it a name stating both sides of the mapping (`COLOR_BY_ZONE`, `labelByStatus`). Do not name it after the union alone. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "\\benum\\s+[A-Z]"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: "erasableSyntaxOnly in tsconfig.app.json — an enum fails pnpm check"
  falsePositives: "none known"
R2:
  type: grep
  pattern: "if \\([a-zA-Z.]+ === '[a-z_]+'\\)[\\s\\S]{0,80}else if \\([a-zA-Z.]+ === '"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A conditional chain whose arms do different work, rather than returning per-member values, is
    R3's territory and matches here too.
R3:
  type: grep
  pattern: "^\\s+default:"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A switch over an *open* value — a raw string from a parsed FIT file, a DOM event key — needs
    its default and is out of scope. Read the discriminant's type.
R4:
  type: grep
  pattern: ": Record<[A-Za-z]+, [^>]+> = \\{[\\s\\S]*?\\} satisfies"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R5:
  type: grep
  pattern: "\\[[a-zA-Z.]+\\]\\s*\\?\\?|\\?\\.\\[[a-zA-Z.]+\\]"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `noUncheckedIndexedAccess` is on in `tsconfig.app.json`, so indexing an array or a
    `Partial<Record<…>>` legitimately needs `??`. Only a *fully exhaustive* map's lookup is a
    violation.
R6:
  type: grep
  pattern: "Record<string, "
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A dictionary genuinely keyed by an open id is correct and matches; check whether the keys are
    a closed set.
R7:
  type: grep
  pattern: "Object\\.fromEntries\\([\\s\\S]{0,200}\\) as Record<"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R8:
  type: manual
  reason: >
    Whether a value could have been a map rather than a switch, and whether two axes are always
    consumed together, is a reading of the call sites.
  enforcedBy: null
R9:
  type: manual
  reason: >
    Whether a name states both sides of a mapping is a reading of the name.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** adding a union member produces a compile error at every place that must answer for it, which is the only mechanism that scales past two or three call sites.
- **Good, because** a map is one declaration a sibling module can import and reuse, where a switch is control flow locked inside the function that holds it.
- **Bad, because** `noUncheckedIndexedAccess` is on in this project, so R5's "index directly" reads as a fight with the compiler in every case where the map is *not* fully exhaustive — the two rules have to be held apart carefully.
- **Bad, because** R3's no-`default` requirement only pays off while the discriminant really is closed; a union widened later turns a compile error into a runtime `undefined` with no arm to catch it.
- **Neutral, because** R8's per-axis split produces several small maps where one map of composite objects would have been fewer declarations.

## 5. Reference implementation

A value map, keyed exhaustively, indexed directly, named for both sides:

```ts
export const ZONE_NAMES = ['recovery', 'endurance', 'tempo', 'threshold', 'vo2max'] as const;
export type ZoneName = (typeof ZONE_NAMES)[number];

const COLOR_BY_ZONE: Record<ZoneName, string> = {
  recovery: tokens.zoneRecovery,
  endurance: tokens.zoneEndurance,
  tempo: tokens.zoneTempo,
  threshold: tokens.zoneThreshold,
  vo2max: tokens.zoneVo2max,
};

const color = COLOR_BY_ZONE[zone];
```

Behaviour per member — a switch with no `default`:

```ts
switch (status) {
  case 'fresh':
    return buildFreshPlan(profile);
  case 'fatigued':
    return buildRecoveryPlan(profile);
  case 'detrained':
    return buildRampPlan(profile);
}
```

## 6. Forbidden practices

- ❌ A `default:` arm on a switch over a closed union — it absorbs exactly the member you forgot.
- ❌ An `if`/`else if` chain returning a per-member value; nothing tells you when a member stops being covered.
- ❌ `COLOR_BY_ZONE[zone] ?? tokens.surface` on a map that already covers the union — the fallback makes the exhaustiveness check unobservable.
- ❌ `Record<string, T>` for what is really a closed union; the key type gives away the guarantee to save a rename.
- ❌ `Object.fromEntries(…) as Record<Union, T>` — the cast asserts the coverage the literal would have proved.
- ❌ One map of composite objects where three per-axis maps would each be consumed separately.
- ❌ Naming a map after its union alone (`ZONES`) — the name says what it is keyed by and not what it yields.
