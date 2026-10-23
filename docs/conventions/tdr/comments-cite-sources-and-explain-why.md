---
kind: pattern-apply-tdr-reference
id: comments-cite-sources-and-explain-why
title: Engine comments cite a source or explain why; units live in names
summary: "In packages/engine and packages/gpx a comment is a @see [SourceKey] citation, the // Sources header or a why-note; banners, restating comments, @param prose and unit notes are not written, units go into names, and specs and config carry no comments; the packages/i18n build files, the packages/testing factories, tools/docs and tools/workbench carry only why-notes."
governs:
  - "packages/engine/src/**/*.ts"
  - "packages/gpx/src/**/*.ts"
  - "packages/engine/tests/**/*.ts"
  - "packages/gpx/tests/**/*.ts"
  - "packages/engine/vitest.config.ts"
  - "packages/gpx/vitest.config.ts"
  - "packages/i18n/vite.ts"
  - "packages/i18n/paraglide.config.ts"
  - "packages/i18n/scripts/**"
  - "packages/testing/src/**/*.ts"
  - "tools/docs/banner/**/*.ts"
  - "tools/docs/banner/**/*.tsx"
  - "tools/docs/banner/**/*.css"
  - "tools/docs/*.config.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
  - "tools/workbench/tests/**/*.ts"
  - "tools/workbench/site/src/**/*.astro"
  - "tools/workbench/site/src/**/*.css"
  - "tools/workbench/*.config.ts"
  - "tools/workbench/site/astro.config.mjs"
  - "tools/workbench/.dependency-cruiser.cjs"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Engine comments cite a source or explain why; units live in names

## 1. Context

This file carries rules R1 through R6.

The project's default is no comments: code says what it does through its names. `packages/engine` is the one place with a standing reason to annotate — its formulas come from published science, and `packages/engine/SOURCES.md` is the bibliography a reviewer checks them against. Before this record, the engine mixed those citations with section banners, JSDoc that restated the signature, `// sec/km` notes beside fields and step-by-step inline commentary; the useful part was hard to find and the rest drifted from the code.

This record keeps exactly what a name cannot carry: where a formula comes from, and why a choice was made. Everything a name can carry — above all the unit — goes into the name. Scope: engine source, engine specs and the engine's test config, plus the hand-written build files of `packages/i18n` (`vite.ts`, `paraglide.config.ts`, `scripts/`), where only R3 and R4 have a subject: they cite no science, so a comment there is a why-note or nothing.

The rules bind `packages/gpx` the same way (source, specs and `packages/gpx/vitest.config.ts`). gpx cites into the same `packages/engine/SOURCES.md`: its nearest-point search on a route uses the equirectangular approximation (`@see [Veness2019]`); its elevation gain and loss with a 3 m hysteresis is a heuristic, listed in that file's App-Specific Logic table and carrying no tag.

The factories and series builders in `packages/testing/src` are bound by R3, R4 and R5: they cite no science, so a comment there is a why-note or nothing, and a unit goes into the name. The why-notes of the synthetic record series stay — the cardiac drift the heart-rate target follows over a session, and the per-record jitter the TRIMP gender split needs. R6 is about specs and test configuration and has no subject in this package.

`tools/docs` (the banner capture, its page and configs: `tools/docs/banner/**`, `tools/docs/*.config.ts`) is bound by R3 and R4: it cites no science, so a comment there is a why-note or nothing. Its Playwright capture script and runner config are not specs in R6's sense; their why-notes (why the capture compares whole-window shots, why it runs the full Chromium build) stay.

`tools/workbench` (`scripts/`, `site/src/` including its stylesheet, `tests/` and its configs) is bound by R3, R4 and R6 like `tools/docs`: it cites no science, so a comment there is a why-note — a hook's contract, a framework quirk, a deliberate rule the code cannot show — or nothing; review and question tags (`R17`, `Q8`) are not reasons and are not written.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Every formula or constant derived from published science carries a `@see [SourceKey]` JSDoc tag whose key resolves in `packages/engine/SOURCES.md`. The tag stays when surrounding prose is removed. | manual |
| R2 | A module that predates per-symbol tags keeps its `// Sources: [Key], …` header with the `// See packages/engine/SOURCES.md for full citations.` line (or the app-specific-logic header that points at the same file). | manual |
| R3 | A comment that explains why stays and may be written: a choice between published variants, a deliberate non-obvious rule, an accepted approximation, a convention the type cannot express. It states the reason, not the mechanics. | manual |
| R4 | Do not write section banners, comments that restate what the next line does, or JSDoc `@param` / `@returns` prose. | proposed |
| R5 | Do not write a unit in a comment. Put it into the name in long form: `Sec`, `Min`, `Ms`, `Meters`, `Degrees`, `SecPerKm` for camelCase names, `_SEC`, `_MIN`, `_MS`, `_METERS`, `_DEGREES`, `_DAYS` for constants. A unit note on a persisted field stays until a store migration renames the field. | proposed |
| R6 | Specs and test configuration carry no comments; a reason a case needs is part of its title. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: "Whether a formula or constant is derived from published science is a domain judgement; SOURCES.md's Validation Summary is the checklist."
  enforcedBy: null
R2:
  type: grep
  pattern: "^// Sources: \\["
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "Modules that carry per-symbol @see tags or no science at all need no header; read the module list in SOURCES.md."
R3:
  type: manual
  reason: "Telling a reason from a restatement needs a reader."
  enforcedBy: null
R4:
  type: grep
  pattern: "-{10,}|@param|@returns|^\\s*// (Compute|Calculate|Return|Get|Map|Convert|Test whether)"
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/i18n/vite.ts", "packages/i18n/paraglide.config.ts", "packages/i18n/scripts/**", "packages/testing/src/**/*.ts", "tools/docs/banner/**/*.ts", "tools/docs/banner/**/*.tsx", "tools/docs/banner/**/*.css", "tools/docs/*.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts", "tools/workbench/site/src/**/*.astro", "tools/workbench/site/src/**/*.css", "tools/workbench/*.config.ts", "tools/workbench/site/astro.config.mjs", "tools/workbench/.dependency-cruiser.cjs"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A why-note that happens to start with one of the verbs."
R5:
  type: grep
  pattern: "(//|/\\*\\*).*\\b(sec/km|m/min|seconds|minutes|metres|meters|degrees|unix ms|bpm)\\b"
  include: ["packages/engine/src/**/*.ts", "packages/gpx/src/**/*.ts", "packages/testing/src/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts", "tools/workbench/site/src/**/*.astro", "tools/workbench/site/src/**/*.css", "tools/workbench/*.config.ts", "tools/workbench/site/astro.config.mjs", "tools/workbench/.dependency-cruiser.cjs"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A citation or why-note that mentions a unit as part of its reason (\"6 min at VO2max\")."
R6:
  type: grep
  pattern: "^\\s*(//|/\\*|\\*)|[^:]// "
  include: ["packages/engine/tests/**/*.ts", "packages/gpx/tests/**/*.ts", "packages/engine/vitest.config.ts", "packages/gpx/vitest.config.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx", "tools/workbench/tests/**/*.ts", "tools/workbench/site/src/**/*.astro", "tools/workbench/site/src/**/*.css", "tools/workbench/*.config.ts", "tools/workbench/site/astro.config.mjs", "tools/workbench/.dependency-cruiser.cjs"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A URL containing `//` in a string."
```

## 4. Trade-offs

- **Good, because** the comments that remain are the ones a reviewer of a formula needs, and they are findable: every `@see` leads to one bibliography.
- **Good, because** a unit in a name travels to every reader and every call site; a unit in a comment stays beside the declaration and is lost at the first `const` that copies the value.
- **Bad, because** long-form unit names make some signatures and expressions longer (`slowestPaceSecPerKm`).
- **Bad, because** R3 needs judgement: a reviewer has to decide whether a note explains why or merely narrates.

## 5. Reference implementation

```ts
// Sources: [Banister1991], [CogganAllen2010], [Fellrnr], [Karvonen1957], [Swain1998]
// See packages/engine/SOURCES.md for full citations.

/** The ratio is clamped into (0, 1), so a later rest or max HR edit can't break the load. @see [Karvonen1957], [Swain1998] */
export const thresholdHrRatio = (thresholds: HrThresholds): number => { … };

interface HrReserveSample {
  durationMin: number;
  reserveShare: number;
}
```

## 6. Forbidden practices

- ❌ `// ----- GPS types -----` and other banners — the module and its names are the structure.
- ❌ `/** Computes pace from distance and time. @param distanceMeters - Distance in metres. */` — it restates the signature.
- ❌ `minPace: number; // sec/km` — the unit belongs in the field name.
- ❌ Dropping a `@see [SourceKey]` tag while cleaning up the prose around it.
- ❌ A comment in a spec explaining a case; put the reason in the `it(…)` title.
