---
kind: pattern-apply-tdr-reference
id: user-facing-strings-in-copy-modules
title: Flat snake_case message keys, state-keyed copy maps in topic modules
summary: Paraglide message keys are flat snake_case, state-keyed maps of m.* messages live in apps/web/src/microcopy topic modules rather than in components, and unused keys are deleted.
governs:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/microcopy/*.ts"
  - "packages/i18n/messages/*.json"
adopted_rules: [R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Flat snake_case message keys, state-keyed copy maps in topic modules

## 1. Context

This file carries rules R5, R6 and R7.

All user-facing copy is a Paraglide message in `packages/i18n/messages/{en,de}.json`, called as `m.<key>()` from `@pacevault/i18n/messages.js`. That already gives wording one reviewable home and keeps assertions and renders on the same key. What remains is how keys are named, where state-dependent copy tables live, and keeping dead keys out. A key is a flat snake_case identifier naming the role and place of the copy. A table that picks copy by state (`Record<Sport, () => string>`) is declared once in a topic module under `apps/web/src/microcopy/`, not beside the component that renders it, so sibling components showing the same state share one table and a missing state shows up at the declaration. Feedback toasts are out of scope here; runtime value formatting goes through `apps/web/src/lib/formatters.ts`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R5 | Name every message key flat snake_case — lowercase words joined by `_`, no camelCase segment, no nesting — naming the role and place of the copy (`ui_color_by_reason_no_gps`, `exp_avg_hr_short_label`), not an abbreviation of the sentence. The first segment is the surface that shows the copy (`ui_`, `toast_`, `exp_`, `coach_`), never the package that computes the value (no `engine_`). A count-dependent message is a pair `<key>_one` / `<key>_other`, never `_count` or `_plural`. A label with the same role and the same text in every locale is one key (`ui_btn_close`, `ui_btn_save`), not a copy per screen. | manual |
| R6 | Declare a state-keyed map of `m.*` messages (`Record<State, () => string>`, or one nested level mirroring a state axis) in a topic module `apps/web/src/microcopy/<topic>.ts`, named for both sides of the mapping (`LABEL_BY_SPORT`), not as a component-local constant beside the component that renders it. | proposed |
| R7 | Delete a message key from every `messages/<lang>.json`, and a topic map or module once its last entry goes, when nothing references it. | manual |

## 3. Detection

```yaml
R5:
  type: manual
  reason: "Whether a key names the role and place of its copy or paraphrases the sentence is a judgement. The mechanical half — flat snake_case — is checked by parsing packages/i18n/messages/en.json and matching every non-$ key against ^[a-z0-9]+(_[a-z0-9]+)*$; any key that fails is a violation. Also mechanical: a key starting with engine_, a key ending in _plural, or a {count} key ending in _count is a violation; two keys whose values are identical in every locale file are a candidate for one shared key, which a reviewer confirms by their role."
  enforcedBy: null
R6:
  type: grep
  pattern: "const\\s+\\w+\\s*:\\s*Record<[^>]+,\\s*(?:\\(\\)\\s*=>\\s*string|\\{[^}]*\\(\\)\\s*=>\\s*string)"
  include: ["apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/microcopy/*.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Misses an untyped object literal of m.* references and a map typed with satisfies. A Record<…, string> of non-copy values (class names, colours, endonyms such as English/Deutsch) is correctly component-local and does not match the () => string shape."
R7:
  type: manual
  reason: "For each key in packages/i18n/messages/en.json, count `m.<key>` references across apps/web, packages/ui and tools (excluding the generated src/paraglide); zero means delete it from every locale file. Mechanical but multi-step."
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a state-keyed table declared once covers every state, which makes a missing state visible at the declaration, and sibling components rendering the same state cannot drift into two wordings.
- **Good, because** flat snake_case keys are greppable as one token and sort by surface prefix, so a reviewer finds every `toast_` or `exp_` key together.
- **Bad, because** the indirection means reading a component no longer shows which message a state renders — the table is a second file to open.
- **Bad, because** message keys outlive their call sites silently; nothing fails when the last reference disappears, so the message files accumulate dead copy that still reads as current product wording.
- **Neutral, because** this is a copy-placement seam on top of Paraglide, not a second localisation layer: the tables hold message functions, so the locale is still resolved at call time.

## 5. Reference implementation

`apps/web/src/microcopy/sports.ts`:

```ts
import { m } from '@pacevault/i18n/messages.js';
import type { Sport } from '@pacevault/engine/types.ts';

export const LABEL_BY_SPORT: Record<Sport, () => string> = {
  running: m.ui_sport_running,
  cycling: m.ui_sport_cycling,
};

export const RECORDS_SUBTITLE_BY_SPORT: Record<Sport, () => string> = {
  running: m.ui_records_running_subtitle,
  cycling: m.ui_records_cycling_subtitle,
};
```

One nested level mirroring a state axis (`apps/web/src/microcopy/laps.ts`):

```ts
export const NUDGE_BY_EFFORT_LIMITER: Record<
  EffortLimiter,
  { precise: () => string; detect: () => string }
> = {
  ftp: { precise: m.ui_laps_efforts_precise_ftp, detect: m.ui_laps_efforts_detect_ftp },
  thresholdPace: {
    precise: m.ui_laps_efforts_precise_threshold_pace,
    detect: m.ui_laps_efforts_detect_threshold_pace,
  },
};
```

Consumer:

```tsx
<Typography>{LABEL_BY_SPORT[props.sport]()}</Typography>
```

## 6. Forbidden practices

- ❌ A component-local `Record<State, () => string>` of messages — it hides state-keyed copy from review and invites a sibling component to write its own variant of the same table (three identical sport-name tables existed before this record).
- ❌ A camelCase segment in a message key (`exp_avgHr_shortLabel`) or a nested message object — keys are one flat snake_case token.
- ❌ Keys that paraphrase the sentence instead of naming its role and place — paraphrase keys have to be renamed whenever the wording changes.
- ❌ A key prefixed by the computing package (`engine_te_overreaching`) — the engine holds no copy; the prefix names the surface (`ui_te_effect_overreaching`).
- ❌ A plural pair named `x` / `x_plural` or `x_one` / `x_count` — the pair is `x_one` / `x_other`, the shape `formatPlural` takes.
- ❌ A per-screen copy of a shared label (`ui_import_close` beside `ui_btn_close`, same text in every locale) — one role, one key.
- ❌ A catch-all `microcopy/index.ts`, `common.ts` or `shared.ts` collecting tables from several topics — topic modules stay importable by name.
- ❌ Leaving a message key in `en.json`/`de.json` after its last `m.<key>` reference is gone.
