---
title: Repo restructure
status: ready
created: 2026-10-19
depends-on: [vite-plus-upgrade]
next: Owner sets ready; implement after vite-plus-upgrade is done
---

# Restructure the repo into a pnpm monorepo

## Context

The repo started as one PWA at the root. Since then the skills, `scripts/`, `workbench/`, the Astro board (`workbench/site`) and the README banner pipeline (`scripts/readme`) have been added, all mixed in with the app's config at the root. The docs have drifted from the code. This plan moves files and fixes paths and docs only; the app's behaviour does not change. Plan 2 (`shared-ui-kit`) builds on it.

Audit and fact-check (2026-10-19): `src/packages/engine` imports only itself plus `@googlemaps/polyline-codec` and `simplify-ts` (`gps.ts:4-5`); `src/packages/gpx` imports engine plus `zod`, `simplify-ts`, `@googlemaps/polyline-codec`. This plan runs on the vite-plus version from `vite-plus-upgrade` (today 0.1.13 pinned, global CLI 1.3.0); workspaces are supported (`vp run -r`, `-F`, `pkg#task`; template `node_modules/vite-plus/templates/monorepo/` uses `apps/*`, `packages/*`, `tools/*`). Hard-coded paths sit in about 60 places (hooks, skills, CI, configs, tests, mockup/review HTML).

## Decisions (settled 2026-10-19)

- **Layout:** `apps/web`, `packages/engine`, `packages/gpx`, `packages/testing`, `tools/workbench`, `tools/docs`, `docs/banners`. `packages/ui` comes in plan 2.
- **Workbench:** one package `tools/workbench` holding the board (`site/`), scripts and hooks (`scripts/`), `shared/` (today's `_shared`), its tests, and the backlog content in `backlog/<item>/` (features and bugs). Owner: "the content for the workbench should be in the tools/workbench folder as well", "the features folder is actually a backlog folder".
- **Docs tool:** `tools/docs` produces the docs and their assets; the banner is its first job. Output stays in root `docs/` (`docs/banners/`). Owner: "lets go with docs/banners", "Actually i think about this as "tools/docs". Banner is just one feature of the docs" (Q6).
- **Firebase:** `firebase.json` and `.firebaserc` move to `apps/web`; the deploy action gets `entryPoint: apps/web`.
- **Folder name:** `tools/`, as in the Vite+ template.
- **Node:** vp only (Owner: "I'll use vp only"). The `.node-version` pin and CI's `node-version-file` land in `vite-plus-upgrade` (its Q1).
- **Packages:** imported by name with `.ts` subpaths (`@pacevault/engine/types.ts`), `exports: { "./*": "./src/*" }`, no build step (Q1). Factories in `packages/testing` (Q2). Dependency-cruiser config in `tools/workbench` (Q3). "Pure, no React" rule per package CLAUDE.md (Q4).
- **Board root:** `ideas.md`, `flaky.md` and `.trash/` live in `backlog/` next to the items; the board keeps one root (Q8).
- **Checks:** the workbench `check` script is `astro check` only (types, part of the code suite); the plan rules get their own script `plans:check` (Q9).
- **Toolchain first:** vite-plus and setup-vp are upgraded in a separate item `vite-plus-upgrade` before this plan (Q10).
- **Docs:** root CLAUDE.md shared, `apps/web/CLAUDE.md` app rules (Q5); every workspace package gets a README.md and CLAUDE.md modelled on the PWA's (Q7).
- **Skills:** only the paths change here. Renaming "feature" to "item" is a follow-up (`ideas.md`).
- **docs/:** stays top-level; `docs/conventions/` follows in the coming weeks and is not part of this plan.

## Target layout

```text
/                    package.json (workspace scripts), pnpm-workspace.yaml, vite.config.ts (fmt + lint),
                     tsconfig.json (references), .node-version (from vite-plus-upgrade), CLAUDE.md, README.md, .claude/, .github/
docs/banners/        de_banner.png, en_banner.png
apps/web/            @pacevault/web: src/, public/, messages/, project.inlang/, e2e/, tests/, scripts/,
                     index.html, vite/vitest/playwright/pwa-assets configs, tsconfig*.json,
                     firebase.json, .firebaserc, .env.example, README.md, CLAUDE.md
packages/engine/     @pacevault/engine: src/, tests/, vitest.config.ts, SOURCES.md, README.md, CLAUDE.md
packages/gpx/        @pacevault/gpx: src/, tests/ (__snapshots__, fixtures/route.gpx), vitest.config.ts,
                     README.md, CLAUDE.md
packages/testing/    @pacevault/testing: src/ (records, gps, sessions factories), README.md, CLAUDE.md
tools/workbench/     @pacevault/workbench: site/, scripts/, shared/, tests/,
                     backlog/{<item>/, ideas.md, flaky.md, .trash/ (ignored)},
                     .dependency-cruiser.cjs, playwright.review.config.ts, vitest.config.ts, README.md, CLAUDE.md
tools/docs/          @pacevault/docs: banner/{page/, tiles.ts, capture.ts, run.ts, env.ts, out/ (ignored)},
                     playwright.config.ts, vite.config.ts, README.md, CLAUDE.md
```

## Approach

Each step leaves the tree green (Verification) before the next one starts. Moves use `git mv` so history follows.

### 1. Workspace skeleton

- `pnpm-workspace.yaml` (exists, `packages: [workbench/site]`): rewrite to `apps/*`, `packages/*`, `tools/*`.
- Root `package.json` → workspace manifest (`private`, `packageManager`, devDep `vite-plus`); app deps and scripts → `apps/web/package.json`. Each package declares its own deps (pnpm doesn't resolve them from the root): engine `@googlemaps/polyline-codec`, `simplify-ts`; gpx `zod`, `simplify-ts`, `@googlemaps/polyline-codec`, `@pacevault/engine`; workbench `zod`, `yaml`, `dependency-cruiser`, `@playwright/test`; docs see step 5.
- Root scripts fan out: `vp run check -r`, `vp run test -r`, `vp run build -r`, `vp run -F @pacevault/web e2e`, `vp run -F @pacevault/workbench dev`, `docs:banner`.
- Root `vite.config.ts`: only the `fmt` and `lint` blocks (today `vite.config.ts:20-80`). Ignore patterns: `tools/workbench/backlog/*/mockup`, `tools/workbench/backlog/*/review/deps.*` (fmt); `**/dist`, `**/paraglide`, `apps/web/project.inlang`, `apps/web/e2e`, `tools/workbench/backlog`, `tools/workbench/shared`, `.claude/skills/*/references` (lint). The scripts in `tools/workbench/scripts` stay linted, as today via `tsconfig.node.json`.

### 2. packages/engine, packages/gpx, packages/testing

- `git mv src/packages/engine packages/engine/src`, same for gpx. `src/packages/engine/CLAUDE.md` → `packages/engine/CLAUDE.md`; the "pure, no React, no app imports" rule of `src/packages/CLAUDE.md` goes into it and a new `packages/gpx/CLAUDE.md`; `src/packages/CLAUDE.md` is deleted (Q4). Its "imports only zod" wording is corrected to the real deps.
- gpx's `../engine/*` imports (`routeGeometry.ts:2-4`, `routeProfile.ts:1`) → `@pacevault/engine/<mod>.ts`.
- App imports `@/packages/engine/<mod>.ts` / `@/packages/gpx/<mod>.ts` (137 files under `src/`; 284 engine, 36 gpx import lines) → `@pacevault/engine/<mod>.ts` / `@pacevault/gpx/<mod>.ts`. Relative imports in `e2e/helpers/seed.ts:5,7` (`'../../src/packages/engine/...'`) likewise.
- `AboutSection.tsx:9-10` (`SOURCES_URL`) and `README.md:43` link `src/packages/engine/SOURCES.md` on GitHub → `packages/engine/SOURCES.md`.
- Tests: `tests/packages/engine` and `tests/packages/gpx` → `packages/*/tests/`, except `metricsCoaching.integration.test.ts` and `stressPipeline.integration.test.ts` (import `@/lib`), which stay in `apps/web/tests/packages/engine/` (Q2). Moved tests switch `@/packages/engine/...` imports to relative `../src/...`.
- `packages/engine/vitest.config.ts` (node env, `globals: true`); `packages/gpx/vitest.config.ts` (jsdom, `parseGpx.ts:85` uses `DOMParser`). Neither uses the app's `tests/setup.ts`; if a moved test depends on its fixed date, that test sets it itself.
- `packages/testing`: `tests/factories/{records,gps,sessions}.ts` → `packages/testing/src/` (import only engine). `tests/factories/profiles.ts` imports `@/types/index.ts` and stays in `apps/web/tests/factories/`. 24 files importing these via `@tests/factories/*` plus 4 via relative path (`tests/features/dashboard/hooks/useFilteredMetrics.spec.ts:3`, `tests/features/trips/tripStats.spec.ts:3`, `tests/lib/moreStats.spec.ts:5`, `tests/lib/gpxExport.spec.ts:6-7`) → `@pacevault/testing/<factory>.ts`. The 4 profile-only importers stay unchanged.
- `routeCut.spec.ts:32` reads `e2e/fixtures/route.gpx`; copy the fixture into `packages/gpx/tests/fixtures/`.

### 3. apps/web

- `git mv` into `apps/web/`: `src`, `public`, `messages`, `project.inlang`, `e2e`, `tests` (without `tests/scripts`, `tests/packages` except the two above, and the moved factories), `index.html`, `vite.config.ts` (app part), `vitest.config.ts`, `playwright.config.ts`, `pwa-assets.config.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json`, `firebase.json`, `.firebaserc`, `.env.example`; `scripts/generateDemoRoutes.ts` → `apps/web/scripts/`.
- Paths stay relative to the app, so the `@` alias, paraglide `outdir`, `index.html` entry and cwd-relative test reads (`tests/lib/tokens.spec.ts:27`, `tests/parsers/fit.spec.ts:129`, `fitThresholds.integration.test.ts:11`, `intervalsImport.integration.test.ts:11`, `intervalsSync.integration.test.ts:22`, `reprocessSessions.integration.test.ts:51`) keep working when vitest runs from `apps/web`.
- `vitest.config.ts:18` coverage include `src/engine/**` (never existed) is dropped; engine coverage runs in the package.
- `playwright.config.ts:45` webServer `pnpm dev` → `vp dev`.
- A local `.env.local` moves to `apps/web/` (Vite env dir); the app README says so.
- `apps/web/package.json` `exports` for `tools/docs` only: `./demo/schedule` → `src/features/demo/demoSchedule.ts`, `./store/layout` → `src/store/layout.ts`, `./e2e/openMeteo` → `e2e/helpers/openMeteo.ts`, plus `./index.css`, `./components/ui/*`, `./lib/utils.ts` for the banner page until plan 2.
- Root `tsconfig.json` references the app's and the packages' tsconfigs.

### 4. tools/workbench

- `git mv workbench/site tools/workbench/site`; `workbench/_shared` → `tools/workbench/shared`; feature folders, `ideas.md` and `flaky.md` → `tools/workbench/backlog/` (Q8); `README.md` → `tools/workbench/`; `playwright.review.config.ts` → `tools/workbench/`; `.dependency-cruiser.cjs` → `tools/workbench/` (Q3).
- `workbench/site/package.json` → `tools/workbench/package.json`; `astro dev` / `astro check` get `--root site`. Scripts: `check` = `astro sync && astro check --root site` (code suite); `plans:check` = `node scripts/check.ts` (plan rules, Q9); root `workbench:check` runs both.
- `scripts/{workbenchFrontmatter,workbenchCleanup,workbenchDeps,workbenchIndexHook,statusGuard,workerGitGuard}.ts` → `tools/workbench/scripts/` (`frontmatter.ts`, `cleanup.ts`, `deps.ts`, `indexHook.ts`, `statusGuard.ts`, `workerGitGuard.ts`). `workbench/site/src/check.ts` → `tools/workbench/scripts/check.ts`.
- `tests/scripts/*` (7 specs) → `tools/workbench/tests/` with `tools/workbench/vitest.config.ts` and a `test` script; imports `../../scripts/...` and `../../workbench/site/src/...` (`check.spec.ts:4`, `writeBack.spec.ts:11`) → new paths; old-path fixtures in `workbenchDeps.spec.ts` (24 `src/` fixtures), `workbenchCleanup.spec.ts`, `workbenchFrontmatter.spec.ts`, `check.spec.ts:22`, `writeBack.spec.ts`, `statusGuard.spec.ts` → new paths.
- Board (site): frontmatter imports `'../../../(../)scripts/workbenchFrontmatter.ts'` (`content.config.ts:3`, `pages/index.astro:5`, `actions/index.ts:13`, `lib/board.ts:16`, `components/{Board,InboxDialog,CheckRow}.astro:2`) → `../../scripts/frontmatter.ts` (depth per file); `'../check.ts'` (`pages/index.astro:6`, `actions/index.ts:14`) → `../../scripts/check.ts`; content root `astro.config.mjs:6`, `content.config.ts:7` → `../backlog` (`!site/**` excludes at `content.config.ts:11,16` go); `astro.config.mjs:10` (`_shared` server root) stays at the workbench folder, and its route prefix `/_shared/` (`:27`) → `/shared/`; `pages/index.astro:13` CSS import → `../../../shared/workbench.css`.
- Scripts: `check.ts:13-14` root `'../..'` → `../backlog`; `check.ts:23-31` folder excludes match the new root; `cleanup.ts:5` (check import), `:41`, `:62` (`REPO_ROOT` → `'../../..'`), `:64` (`WORKBENCH` → `tools/workbench/backlog`), `:74`, `:80`; `deps.ts:263` (`REPO_ROOT`), `:265` (`CRUISE_ARGS`: config `tools/workbench/.dependency-cruiser.cjs`, targets `apps/web/src`, `packages`), `:269` (depcruise bin from the workbench package), `:298`, `layerOf` `:71-76` and the `src/` filters `:150`, `:178` → app and package paths; `indexHook.ts:4` (check import), `:17-18`, `:32`; `statusGuard.ts:38,73,116,118` regexes anchored to `tools/workbench/backlog/`; `frontmatter.ts:239,267,291` (template path → `tools/workbench/shared/tech-template.md`).
- `shared/capture.ts:21-25` → `../../../apps/web/e2e/helpers/…`; `:39` `repoRoot` → `'../../..'`; `:43` → `apps/web/messages`.
- `playwright.review.config.ts:11` testDir → `./backlog`; `:30` webServer `vp dev` gets `cwd: '../../apps/web'` (new key).
- `.dependency-cruiser.cjs`: `:9-17` `engine-is-pure` → `^packages/engine/`; `:15`, `:22-23` → `^apps/web/src/store/`, `^apps/web/src/features/`; `:28` → `^apps/web/src/paraglide/`; `:29` `tsConfig` → `apps/web/tsconfig.app.json`.
- Mockup and review HTML: `../../_shared/…` → `../../../shared/…` in `onboarding-redesign/mockup/index.html:8,1042`, `onboarding-redesign/review/index.html:8,2155`, `training-load-recompute/review/index.html:8,511`, `shared/review-template.html:8,283`, `.claude/skills/feature-explore/references/mockup-example.html:10,182`, `.claude/skills/feature-review/references/capture-spec-template.ts:4`.
- `.claude/settings.json:9,18,29` hook commands → `tools/workbench/scripts/*`.
- `.gitignore`: `workbench/site/.astro` → `tools/workbench/site/.astro`; `workbench/.trash/` → `tools/workbench/backlog/.trash/` (`actions/index.ts:43` writes it under the board root).
- Display strings `workbench/...` in components and `writes.ts:98-116` are updated (cosmetic).

### 5. tools/docs (banner)

- `scripts/readme/banner/*` → `tools/docs/banner/page/`; `scripts/readme/{capture.readme.ts,run.ts,env.ts,tiles.ts}` → `tools/docs/banner/` (`capture.readme.ts` → `capture.ts`); `scripts/readme/playwright.config.ts` → `tools/docs/playwright.config.ts` (`:5` `repoRoot` → `'../..'`).
- `tools/docs/package.json`: depends on `@pacevault/web` (`workspace:*`), `react`, `react-dom`, `lucide-react`, `zod`, `@playwright/test`, `@tailwindcss/vite`, `@vitejs/plugin-react`.
- Capture imports the app entry points (step 3) instead of `../../src/…` / `../../e2e/…` (`capture.ts:8,13,307`); messages from `apps/web/messages/` (`:27`); `:19` `repoRoot` → `'../../..'`; `:20` `OUT_DIR` stays `banner/out`; `:21` final PNG → `docs/banners/<locale>_banner.png`; `:595` banner URL → the banner server's `/banner/page/index.html`.
- Two `webServer` entries: the web app's `vp dev` with `cwd: '../../apps/web'` (port `env.ts:13`), and `tools/docs`' own `vp dev` for the banner page (second port added to `env.ts`). The browser-side `import('/src/store/layout.ts')` (`capture.ts:315`) keeps hitting the web app's server.
- `tools/docs/vite.config.ts`: React, `@tailwindcss/vite`, alias `@` → `../../apps/web/src` (needed because `Card.tsx:1`, `Typography.tsx:2` import `@/lib/utils.ts`; plan 2 removes it). The page CSS adds `@source "../../../apps/web/src/components/ui"`. `tools/docs/tsconfig.json` gets the same `@/*` path. `Banner.tsx:23` raw-shot URL → served from `banner/out/` by the banner server.
- `git mv docs/readme docs/banners`; `README.md:5` image path and `:73-80` banner section (command `vp run docs:banner`, paths) rewritten.
- Remove `scripts/readme/banner` from `tsconfig.app.json:35` and `tsconfig.node.json:31`.
- `.gitignore:30` `scripts/readme/out/` → `tools/docs/banner/out/`.

### 6. CI, deploy, ignore files

- `ci.yml`, `deploy.yml`: commands as filtered or recursive `vp run`; `paraglide:compile` with `-F @pacevault/web`; `playwright install` (`ci.yml:30`) runs in `apps/web`. `node-version-file: .node-version` (set by `vite-plus-upgrade`) stays valid at the root.
- `deploy.yml:30-35`: `entryPoint: apps/web`.
- `.gitignore`: `src/paraglide` → `apps/web/src/paraglide`; root-anchored `/test-results/`, `/playwright-report/`, `/blob-report/`, `/playwright/.cache/` (`:33-36`) → unanchored.
- Delete the obsolete `.prettierignore` (fmt reads `vite.config.ts`) and the empty untracked `.firebase/`.

### 7. Docs

- Root `CLAUDE.md`: repo map and the rules for every TS package (named exports, arrow functions, no destructuring, Zod for external data, no ternaries in `.ts`), the verification suite, the dev workflow. App rules (§1 stack, local-first, 0-is-data, required FIT data, palette §6, surfaces §7) → `apps/web/CLAUDE.md` (Q5).
- Drift fixes while moving: §1 lint and format live in `vite.config.ts` (no `.oxlintrc.json` / `.oxfmtrc.jsonc`); storage row lists all `src/lib/db.ts` stores; §3 naming examples that don't exist; §4 links every package CLAUDE.md; §5 lists `tech.md`; `src/store/CLAUDE.md:5` names `createGuardedSessionsStorage`; `README.md:27` "Try demo data"; workbench README lists `research/`.
- The verification suite and the "board reads the files" paragraph live in one place each (root `CLAUDE.md`, `tools/workbench/README.md`); skills and `feature-worker.md` link instead of copying.
- README.md and CLAUDE.md per workspace package, modelled on the PWA's (Q7): `apps/web`, `packages/{engine,gpx,testing}`, `tools/{workbench,docs}`. README: what it is, how to run and test it, what depends on it. CLAUDE.md: WHY/WHAT header, its rules, its verification commands, link to the root CLAUDE.md for shared rules.
- Skills and `.claude/agents/feature-worker.md`: every `workbench/<feature>/`, `workbench/site/`, `workbench/_shared/`, `src/...`, `scripts/...`, `vp run workbench:*` path updated. Wording "feature" stays.
- Memory files outside the repo: fix stale commands and paths (`feedback_run_e2e`, `feedback_paraglide_build`, `feedback_engine_scope`, `feedback_impl_review_and_acceptance`, `feedback_lets_dev_gate`, `feedback_terse_plans`, `user_no_gh_cli`), add `feedback_max_effort.md` to the index; then drop the "Stale memory paths" bullet from `ideas.md`.

## Files

**Create:** `package.json`, `tsconfig.json`, `README.md`, `CLAUDE.md` for `apps/web`, `packages/{engine,gpx,testing}`, `tools/{workbench,docs}` (workbench's `package.json` from `workbench/site/package.json`; engine's CLAUDE.md is moved); `apps/web/vite.config.ts` (app part); `packages/{engine,gpx}/vitest.config.ts`; `tools/workbench/vitest.config.ts`; `tools/docs/vite.config.ts`; `packages/gpx/tests/fixtures/route.gpx`.

**Move:** everything listed in Approach 2–5.

**Modify:** root `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `tsconfig.json`, `.gitignore`, `.claude/settings.json`, `.github/workflows/{ci,deploy}.yml`, `src/features/settings/AboutSection.tsx`, the path sites in Approach 2–5, `CLAUDE.md`, `README.md`, all nested `CLAUDE.md`, `.claude/skills/feature*/**`, `.claude/agents/feature-worker.md`.

**Delete:** `.prettierignore`, `.firebase/`, `src/packages/CLAUDE.md`, and the emptied `workbench/`, `scripts/`, `tests/scripts/`, `src/packages/`.

## Tests

- No new behaviour, so no new tests. Every existing test moves with its code and must pass in its new place, with the fixture paths rewritten (Approach 4).
- `statusGuard.spec.ts` and the index-hook cases cover the rewritten regexes.

## Verification

1. After each Approach step: `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build` (from the root via the fan-out scripts once step 1 is done).
2. `vp run workbench:check` (types + plan rules) passes; a deliberately broken plan frontmatter fails `plans:check` but not `vp run check -r`; the board starts and shows every backlog item, `ideas.md` and `flaky.md`; a delete and Undo on the board use the new `.trash`.
3. Hook smoke test: editing a `tools/workbench/backlog/*/plan.md` triggers the status guard and index hook; editing a file under `tools/workbench/scripts/` does not.
4. `vp run docs:banner --locale en` writes `docs/banners/en_banner.png`, styled as before.
5. `vp run workbench:capture` against one backlog item still produces screenshots.
6. A mockup and a review doc open with their shared CSS/JS.
7. CI run on the branch is green (owner pushes).

## Delivery and acceptance

Review doc in `tools/workbench/backlog/repo-restructure/review/index.html`: before/after tree, the moved-path table, verification output, CI link. No UI change, so no screenshots. Cleanup only via `feature-done` after the owner accepts.

## Open questions

- **Q1** · answered 2026-10-19 · How do the app and gpx import the packages? → (a) Workspace package `@pacevault/engine`, `exports` pointing at the `.ts` sources, no build step. Owner: "Workspace package (Recommended)"
- **Q2** · answered 2026-10-19 · Where do the 8 engine tests go that use app test factories or `@/lib`? → Factories get their own package `packages/testing`; the 2 tests using `@/lib` stay in the app. Owner: "sounds like another package for testing factories"
- **Q3** · answered 2026-10-19 · Where does the dependency-cruiser config live? → (a) `tools/workbench/`, cruises `apps/web/src` and `packages/*/src`. Owner: "tools/workbench (Recommended)"
- **Q4** · answered 2026-10-19 · Where does the "no React, no app imports" rule live? → (a) In each pure package's CLAUDE.md; no shared `packages/CLAUDE.md`. Owner: "Rule per pure package (Recommended)"
- **Q5** · answered 2026-10-19 · Split of the root CLAUDE.md → (a) Root: repo map, code rules for every TS package, verification suite, dev workflow; `apps/web/CLAUDE.md`: stack, local-first, 0-is-data, FIT rules, palette, surfaces. Owner: "Root = shared, app = app (Recommended)"
- **Q6** · answered 2026-10-19 · Where does the banner pipeline live? → New package `tools/docs` (banner is its first job); output stays in root `docs/`; `apps/web` exports the test entry points the capture needs. Owner: "banner is not the correct name. Actually i think about this as "tools/docs". Banner is just one feature of the docs", then "yes" to output in root `docs/` and explicit exports.
- **Q7** · answered 2026-10-19 · Docs for the new packages → every new tool and package gets a `README.md` and a `CLAUDE.md` following the PWA's. Owner: "we should also ensure that those "new" tooling and packages have propper readme.md files and claude.md files, following our project (the pwa one)"
- **Q8** · answered 2026-10-19 · Where do `ideas.md`, `flaky.md` and `.trash` go, given the board's single root? → (a) Into `tools/workbench/backlog/`. Owner: "Into backlog/ (Recommended)"
- **Q9** · answered 2026-10-19 · Plan rules in the code suite? → (a) Split: `check` = `astro check`, plan rules in `plans:check`. Owner: "Split (Recommended)"
- **Q10** · answered 2026-10-19 · When to upgrade vite-plus 0.1.13 and `setup-vp@v1`? → (a) Separate item `vite-plus-upgrade` before this plan. Owner: "Separate item first (Recommended)"

## Agent decisions

- [x] **The factories package is `packages/testing` (`@pacevault/testing`).** Agent: short, says what it is for; it can hold more test helpers later.
- [x] **Package names use the `@pacevault/` scope.** Agent: matches the existing `@pacevault/workbench`.
- [x] **Scripts lose the `workbench` prefix inside `tools/workbench/scripts/`.** Agent: the folder already says it; `vp run workbench:*` names stay for the owner.
- [ ] **Rule-vs-code contradictions are not fixed here** (rest-spread in `src/components/ui`, gpx snapshot test, `function` in tests, `src/hooks/` next to `src/lib/hooks/`). Agent: they change code or rules, not paths; spun off to `ideas.md`.
- [x] **Package tests don't use the app's `tests/setup.ts`.** Agent: it seeds app stores; a package test that needs a fixed date sets it itself.

## Risks

- `vp check` per package: the 1.3.0 docs (`guide/check.md:32`, `monorepo.md:9-13`) say a package-level `vp check` uses the root `fmt`/`lint` blocks and resolves TS projects from the package folder; re-check against the version `vite-plus-upgrade` lands on.
- The status guard regexes match path suffixes; keep them anchored to `tools/workbench/backlog/`.
- The banner page borrows `@` and Tailwind sources from `apps/web` until plan 2; a missing `@source` shows up only as lost styles, so Verification 4 compares the PNG.
- `apps/web` gains `exports` used only by `tools/docs`; they must not leak into app code paths.
- The board and the hooks break mid-move (step 4); don't run the board until step 4 is complete.
- `packages/engine` (devDependency) ↔ `packages/testing` (dependency) form a dev-only cycle; pnpm warns but resolves it. If `vp run -r` ordering trips over it, the engine tests import the factories by relative path.
- 137 files of import rewrites in one step; mechanical, checked by `vp check`.
