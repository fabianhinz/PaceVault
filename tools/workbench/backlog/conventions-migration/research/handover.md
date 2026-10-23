# Handover: how the conventions migration was planned (session 2026-10-23)

Read this before planning the item. It records where the plans came from, every owner decision, the choices agents made on their own, and the blank spots.

## 1. What exists

- `docs/conventions/plans/`: 47 convention plans + `tooling.md` (48 files, ~544 Changes steps). One plan per convention. Each plan is self-contained (Depends on, Changes with exact files / before-after / check, Open items, Done) and is **deleted by the executing agent once its steps check out**. `depends_on` in the frontmatter gives the execution order; `tooling.md` (9 lint gates in the root `vite.config.ts`) depends on every other plan and runs last.
- `docs/conventions/tdr/`: 47 TDR references, the durable rule text (rules, detection signals, reference implementation, forbidden practices, `governs` globs). They stay after the migration.
- `docs/conventions/CLAUDE.md`: generated index, one line per `governs` glob → TDR. The root `CLAUDE.md` imports it (`@docs/conventions/CLAUDE.md`, last line), so the rules are **already live for every agent** (owner decision: keep it live during `session-3d-map`).
- Tools (not vendored, live in the owner's skills): `~/.claude/skills/pattern-apply/scripts/build_plan_index.py docs/conventions` validates plans ↔ TDRs; `~/.claude/skills/pattern-apply/scripts/sync_claude_md.py . docs/conventions` regenerates the index. Run both from the repo root with `uv run` after editing any plan or TDR. Last result: "checked 48 plan(s) — all valid".
- Sibling item `conventions-follow-ups`: 18 points deliberately left out of the migration (possible bugs, hook/parser quirks, invisible API-shape changes).

## 2. Where the rules came from

The `pattern-apply` skill (`~/.claude/skills/pattern-apply/`) compared each package against a local knowledge base of conventions extracted from two earlier reference projects (`~/.claude/skills/pattern-extractor/tdr/`, registry `config.json`):
- an **application** (Next / React 19 / MUI / tanstack-query / zustand / zod / Prisma / vitest): source for `apps/web`, `packages/engine`, `packages/gpx`, `packages/testing`, `packages/i18n`, `tools/*`;
- a **React component library** (MUI / emotion, published): additional source for `packages/ui`.

Every rule was triaged as Portable / Moot (missing infrastructure: server, API routes, Prisma, MUI, Storybook, slots, …) / Blocked (parameter, applicability, conflict). Moot records got no file. Blocked items went to the owner in rounds of ≤4 questions. By design the files never name the source projects: the rules read as PaceVault's own.

Order of the runs: apps/web → packages/ui → packages/engine → packages/gpx → packages/testing → packages/i18n → tools/docs → tools/workbench. Later runs **extended** the existing plan/TDR of the same convention (labelled "(packages/ui)", "(tools/docs)" … in Changes, globs added to `governs`) instead of creating per-package files.

## 3. Owner decisions (binding for the plans)

### Process rules
- Precedent vs. a documented PaceVault convention: decided per conflict (not "precedent always wins").
- Originally "refactoring only"; the owner then adopted the behaviour-changing steps too: "we can just do them and double check with our test / review infra / process". Stored-data renames were dropped instead.
- `react-use` allowed workspace-wide. No MUI/emotion. No other new runtime dependencies (dev/test deps OK).
- Styling values without an identical token: **add exact-value tokens** (px tokens named after their value, e.g. `w-440px`, `rounded-10px`; exact alpha; exact colours) so output stays pixel-identical.
- Persisted/stored field names stay (TrainingSession flags, `PrescribedWorkout.isTaper`, `RoutePoint`, `RouteElevationStats`).
- Comments: owner global rule "no comments"; kept are `@see [SourceKey]` citations, `// Sources:` headers, rationale ("why") notes and a few tool-behaviour notes; removed are banners, restating comments, unit notes (units go into names).

### apps/web
- Function size ≤ ~12 statements, nesting ≤ 3 (components 2); no file line budget; one component per module, strict (no private sibling components).
- Hooks placed by owning concept; `lib/hooks/` only for generic primitives (rewrites `apps/web/CLAUDE.md:36`, `features/CLAUDE.md:3`).
- Split `lib/` topics merged into one module per topic.
- Runtime map: engine + gpx = pure/shared, `apps/web/src/lib` = browser, `tools/*` = Node.
- Zod: type = schema name minus `Schema`, schemas renamed to match the type.
- Test factories `createMock*` in place; `@pacevault/testing` stays.
- Query keys always a `<name>QueryKey` builder; reads in `src/queries/`, writes in `src/mutations/`.
- Components `export const X: FC<XProps>`.
- Env facade `lib/env.ts`, zod-validated, **fails at import**.
- Intl only in `lib/formatters.ts`, loose named exports, runtime `getLocale()`.
- Page registry + own router hooks in `src/routing/`; `PageLink` replaces `Link`/`NavLink`.
- Fetch throws a typed error on `!ok`; FIT missing data → outcome union; destructured parameter objects for ≥ 2 inputs.
- Per-scope zustand stores stay (no global store); only selector/immer-draft rules and `INITIAL_*_STORE_STATE`.
- One `tests/` tree, `vite-plus/test` imports, `.spec` naming with qualifiers; component render tests through provider helpers; mocked collaborators (`vitest-mock-extended`); no destructuring of render/hook results (no exemption).
- Radix never imported in the app; Paraglide stays; `set*` allowed for calendar math (DST).
- OP-7 worker contracts: types only, no runtime parse. OP-12 exhaustive error map only after the typed error class. OP-15 connect mutation awaited inside the existing try/catch.

### packages/ui
- One directory per component with `pv` prefix: `components/pvDialog/PvDialog.tsx`, export `PvDialog`; every consumer renamed. Props stay in the component module.
- Surface classes UPPER_SNAKE in `lib/surfaces.ts`; visible copy arrives as props (ui drops `@pacevault/i18n`); the three sheet contexts in one `BottomSheetProvider.tsx` with throwing accessors + `useUnstable*Context` for desktop callers; variant resolvers adopted; `TOAST_DURATION_MS` local; colour props typed as token keys where possible; all comments removed; relative imports; no safe-Omit helper, no controlled/uncontrolled triple, no `should …` titles.

### packages/engine
- Presentation and serialization move to `apps/web/src/lib` (zone colours/labels, ACWR/TE colours, `buildSessionGPS`/`decodeTrackForRendering`); engine loses its npm deps.
- Outcome unions replace `T | undefined` / `T | null`; shared types in `types.ts`; unused constants unexported (spec-only exports stay); every ≥ 2-input callable takes an object (hot loops too); long unit suffixes `_SEC/_MIN/_METERS/_MS`; shared factories in specs; one top-level `describe(Unit.name)`; clock stays in `computeMetrics`; "broken contracts are loud" (console.warn at contract violations).

### packages/gpx
- Treated like engine. GPX parse/build stays in gpx (root `CLAUDE.md:34` fixed); polyline encoding moves to `apps/web/src/lib/gpsTrack.ts`; GPX golden file stays a file snapshot; shared factories (testing depends on gpx); GPX-format field names (`lon`, `ele`, `desc`, `seg`) stay; citations added.

### packages/testing, packages/i18n, tools/docs, tools/workbench
- testing: two why-comments kept; all signatures converted; one `series.ts`; option names with units (`baseHrBpm`, `basePowerWatts`, `baseSpeedMetersPerSec`).
- i18n: plural keys `_one/_other`; `ui_btn_close` / `ui_btn_save` merge duplicates; `engine_te_*` → `ui_te_*`; key rules in `packages/i18n/CLAUDE.md`.
- tools/docs: fitting TDRs apply; `.parse` kept (fail fast, documented); `bannerLocale.ts` shared; `capture.ts` split into topic modules; Playwright helpers `fn({ … }, page)`; text zoom as class; `useLayoutEffect` unchanged.
- tools/workbench: fitting TDRs apply; topic splits of `frontmatter.ts`, `board.ts`, `deps.ts`; `scripts/paths.ts`; shared contract for `deps.json`/`files.json`; `@scripts/` and `@site/` aliases. Hook entry files keep their paths; `.claude/settings.json` is never edited by the plans.

## 4. Blank spots and risks

1. **Plans are pinned to the tree of 2026-10-23.** Every `path:line`, importer list and count was taken before `session-3d-map`. That item touches map/session code many plans also change (`MapBackground.tsx`, map hooks, `SessionDetailPage.tsx`, GPS track code). Step 1 of this item: fact-check every plan (item-plan step 4) and rewrite drifted items.
2. **Size and order.** ~544 steps; the engine chain (domain-only → index-modules → comments → constants → booleans → maps → colocated-types → outcome-unions → names → helpers → signatures → unit-length) runs long, and other plans' app/ui steps are queued behind it via `depends_on`. The Pv rename (`component-directory-and-file-naming`, ~50 steps) runs late and depends on 17+ plans.
3. **Concurrent edits.** Several agents extended the same plans; `styled-api-over-sx.md` was emptied and rebuilt once. Its structure validated, but read it before executing.
4. **Behaviour changes adopted** (verify with targeted specs, not only screenshots): effects → queries (caching, background jobs, hover prefetch), weather fails as a whole on one bad cluster, env facade fails at import, `PageLink` history/active-tab behaviour, snackbar dedup by key, throwing context accessors, engine/kit `console.warn`, required aria-labels, Textarea `HelperText` (+16 px), Typography wrappers, kit `SegmentedControl` in the workbench, `void requestPersistentStorage()` (unhandled rejection), three distinct GPX failure messages.
5. **Temporary pinned specs** (inline snapshots of today's outputs) are created and deleted inside several plans (engine, gpx, banner). They must not survive.
6. **Two TDRs govern folders that do not exist yet** (`accessible-queries-in-component-tests` → `apps/web/tests/**/*.spec.tsx`; `one-server-call-per-hook-module` → `src/queries/**`, `src/mutations/**`, workbench `app/hooks/**`): they reach no code until their plans run (owner: leave).
7. **Live rules before the migration.** Agents working on `session-3d-map` read rules that describe the post-migration state (e.g. `PvDialog`, `src/queries/`, `MS_PER_*` from `time.ts`). New code may land half-migrated; the fact-check (1) must cover it.
8. **Review evidence.** Most steps are refactoring, so before/after captures should be identical; differences can only come from the adopted behaviour changes (4) or exact-token swaps. The workbench hook probe (35 inputs, stdout/stderr/exit codes) and the banner pixel diff are built into their plans.
9. `docs/conventions/` and this item are untracked in git so far.

## 5. Working rules that emerged in this session (do's and don'ts)

### Deciding

- Never let a precedent override a documented PaceVault convention silently; each conflict goes to the owner.
- Ask in rounds of ≤ 4 questions, each with concrete before/after code or a path:line example. When the owner says "I don't get it" / "I need more context", explain again with the actual code, never repeat the abstract question.
- Pre-filter long lists to the few items that matter; group open points by type, severity and source so a reviewer stays in one context area.
- Every choice an agent makes without asking is reported and lands as an open question or agent decision, never buried in a plan.

### Scoping

- Classify behaviour impact **before** writing steps, not after: a rule whose only implementation changes behaviour must be flagged at triage. (This session wrote such steps first and later moved 63 points out and back in.)
- No plan without steps: a rule the code already follows becomes a TDR directly (`governs` on existing files), never an empty plan.
- No TDR whose rules are all moot; check that `governs` matches real files.
- Stored data shapes are never renamed here. No new runtime dependency except `react-use`. No MUI.
- Bugs and quirks found along the way go to `conventions-follow-ups`, not into the migration.

### Writing plans

- Every step: exact files, exact before/after, exact check (command + expected clean result). Verify every `path:line` against the current file.
- Value-sensitive refactors are pinned first by a temporary spec (inline snapshot of today's output) and the pin is deleted inside the same plan.
- Visual-adjacent steps: workbench capture / banner pixel diff must be identical; behaviour changes need a spec that pins the new behaviour.
- Hooks (`tools/workbench/scripts/statusGuard.ts`, `indexHook.ts`, `workerGitGuard.ts`): stdout, stderr and exit codes stay identical (probe built into the workbench items); hook entry paths never move; `.claude/settings.json` is never edited by a plan.
- No source-project names, source paths or source config in any file; no code comments in snippets (except the agreed citations).

### Running agents

- One agent per file set. Never let two agents extend the same plan or TDR at the same time; sequence the runs, and re-read every file fresh before editing.
- After every change to plans/TDRs: run the validator and the index sync (section 1).
- Workbench `plan.md` / `review/decisions.md` only via Edit/Write (the status guard blocks shell writes). Python only via `uv run` (never a global `python3`), Node via `vp`. No staging, no commits, no dev/preview servers unless the owner asks.

## 6. Choices agents made without asking (to confirm)

Listed as open questions Q1–Q12 in `../plan.md`. More detail on each lives in the named plan.
