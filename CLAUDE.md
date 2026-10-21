# PaceVault

**WHY:** PaceVault is a local-first Progressive Web App (PWA) for mapping, analysing and storing fitness/GPS activities (primarily parsed from `.FIT` binaries).
**WHAT:** A pnpm workspace driven by Vite+ (`vp`). The app is a pure client-side SPA in `apps/web`; its domain logic lives in workspace packages; the workbench (backlog board, hooks) and the docs tool live in `tools/`. App rules (stack, local-first, external services, palette, surfaces) are in `apps/web/CLAUDE.md`.

## 1. Repo map

| Path               | Package                | What it is                                                                                          |
| ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/web`         | `@pacevault/web`       | The PWA: React 19, routes, features, stores, e2e and app tests. Rules: `apps/web/CLAUDE.md`         |
| `packages/engine`  | `@pacevault/engine`    | Pure domain logic (metrics, zones, stress, GPS). Rules: `packages/engine/CLAUDE.md`                 |
| `packages/gpx`     | `@pacevault/gpx`       | Pure GPX parsing, building and route geometry. Rules: `packages/gpx/CLAUDE.md`                      |
| `packages/testing` | `@pacevault/testing`   | Test factories (records, GPS, sessions) for app and package tests                                   |
| `packages/i18n`    | `@pacevault/i18n`      | Translations (Paraglide.js messages, compile, Vite plugin). Rules: `packages/i18n/CLAUDE.md`        |
| `packages/ui`      | `@pacevault/ui`        | UI kit: Radix + Tailwind components, theme tokens, generic UI hooks. Rules: `packages/ui/CLAUDE.md` |
| `tools/workbench`  | `@pacevault/workbench` | Backlog board (Astro), its scripts, the Claude hooks and the backlog in `tools/workbench/backlog/`  |
| `tools/docs`       | `@pacevault/docs`      | Produces the docs assets; today the README banner in `docs/banners/`                                |
| `docs/`            | none                   | Generated docs assets (`docs/banners/`)                                                             |

- The root holds only the workspace: `package.json` (fan-out scripts; the test toolchain `vite-plus`, `vitest` and `@vitest/coverage-v8` is declared here only, so every package resolves the same copy and `vp test` also works inside a package), `pnpm-workspace.yaml` (catalog, overrides), `vite.config.ts` (`fmt` and `lint` for every package, plus `defaultPackage` and `test.projects` so bare `vp dev`/`vp build`/`vp test` work from the root), `tsconfig.json` (references), `.node-version`.
- Packages are imported by name with `.ts` subpaths (`@pacevault/engine/types.ts`); each package exports `"./*": "./src/*"` (except `@pacevault/i18n`, which exports its compiled messages, runtime and Vite plugin by name) and has no build step.
- Every package declares its own dependencies; shared tool versions come from the `catalog:` in `pnpm-workspace.yaml`.

## 2. Code rules (every TypeScript package)

- **Named exports only**: Use named exports everywhere.
- **Arrow functions only**: Never use the `function` keyword — use arrow functions (`const fn = () => {}`) everywhere.
- **No object destructuring** for component props and hook return values — access via `props.x` and `result.x` instead. Exception: a `packages/ui` wrapper may rest-destructure `props` to strip its own props before forwarding (`packages/ui/CLAUDE.md` § Rules).
- **Delete dead code**: Exported but never-imported code should be removed immediately, not left around.
- **No `as any` for external data**: Use Zod schemas with `safeParse` + `z.infer` to validate and type data from untyped sources (file parsers, IndexedDB, hook input, etc.). Schemas live next to the parser/consumer (e.g. `fitSchemas.ts`). On failure: return a safe fallback (`undefined`, `[]`), never throw.
- **No non-null assertion `!`**: Narrow with guards, defaults, optional chaining, `for…of` or type-guard filters, or early returns. `!` silences `noUncheckedIndexedAccess` without handling the missing case (lint: `no-non-null-assertion`).
- **No ternary operators in `.ts` files** (convention, not linter-enforced): Prefer `if/else` over `condition ? a : b` in `.ts` files (engine, lib, stores, hooks, scripts). Single-level ternaries are allowed in `.tsx` (JSX). Nested ternaries are banned everywhere.
- **No `Object.assign`**: Change state by assigning fields on the immer draft or by replacing the object outright. Store updates go through intent-named actions, never a generic partial patch.
- **Pure packages**: `packages/engine` and `packages/gpx` hold domain logic only: no React, no state, no app imports (see their CLAUDE.md). Presentation aggregations (e.g. per-sport TSS for chart colours), serialization (GPX export), format conversion and I/O stay out of the engine even when pure: they go to feature hooks or `apps/web/src/lib/`.
- **Syntax & Formatting**: Defer to Oxlint and Oxfmt (via Vite+, configured in the root `vite.config.ts`). Do not waste time manually formatting code or enforcing linting rules; focus on logic.

## 3. File Naming Conventions

| Category         | Convention                                              | Example                                    |
| ---------------- | ------------------------------------------------------- | ------------------------------------------ |
| React components | PascalCase                                              | `SessionDetailPage.tsx`, `StatTile.tsx`    |
| Hooks            | camelCase with `use` prefix                             | `useChartZoom.ts`                          |
| Stores           | camelCase                                               | `toast.ts`, `mapFocus.ts`                  |
| Engine modules   | camelCase                                               | `trainingEffect.ts`, `zoneDistribution.ts` |
| Lib utilities    | camelCase                                               | `chartData.ts`, `timeRange.ts`             |
| Tests            | Match source name + `.spec.ts` / `.integration.test.ts` | `trainingEffect.spec.ts`                   |
| Web Workers      | camelCase                                               | `gpsBuild.worker.ts`                       |

- Side-effect-only hooks (no return value) use `Effect` suffix: `useMapCameraEffect.ts`. Hooks that return data, refs, or callbacks keep normal `useSomething` naming.
- No kebab-case for TypeScript files.

## 4. Deep Context (Progressive Disclosure)

Read the CLAUDE.md of the area you work in:

- `@apps/web/CLAUDE.md`: app stack, local-first rule, external services, 0-is-data, FIT rules, colour palette, surfaces.
- `@apps/web/src/features/CLAUDE.md`: feature-level hooks and store colocation.
- `@apps/web/src/store/CLAUDE.md`: Zustand store scope-naming and persist middleware.
- `@apps/web/tests/CLAUDE.md`: the testing strategy (packages and lib vs. integration vs. e2e).
- `@packages/i18n/CLAUDE.md`: translation tone, placeholder rules, microcopy and how messages are compiled.
- `@packages/ui/CLAUDE.md`: UI kit rules (no app imports, no provider, slots), theme tokens and surfaces.
- `@packages/engine/CLAUDE.md`, `@packages/gpx/CLAUDE.md`, `@packages/testing/CLAUDE.md`: package rules.
- `@tools/workbench/CLAUDE.md`, `@tools/docs/CLAUDE.md`: tool rules.

## 5. Dev Workflow & Actionable Verification

> **Plan first, then build.** The owner creates branches and commits; Claude never commits or offers to, and leaves all changes in the working tree. Review changes with `git diff`.

All backlog work lives in `tools/workbench/backlog/<item>/` (`plan.md`, `tech.md`, `mockup/`, `research/`, `review/`); every item is a folder (there is no ideas list), and every agent decision goes to `review/decisions.md`. How the owner works with the backlog is in `tools/workbench/GUIDE.md`; how the board, the hooks and the status gates work is in `tools/workbench/README.md`. Start any backlog work (feature, bug, chore) through the `item` skill (`.claude/skills/item/SKILL.md`). It reads `status:` in the plan's frontmatter and hands over to the stage skill. `ready` and `done` are owner-only; a `PreToolUse` hook (`tools/workbench/scripts/statusGuard.ts`) enforces the status gates.

1. **Plan**: `tools/workbench/backlog/<item>/plan.md` with context, decisions, approach, files, tests and verification, plus `tech.md` from `tools/workbench/shared/tech-template.md`. Review it with the owner; no code before "lets dev". With several open topics, every topic gets its plan and an agreed order first, walked one at a time (short catch-up, then a questionnaire). A `size: small` item (owner-only, one-line bugs and chores) has no `tech.md`.
2. **Implement**: Write the code and the tests `apps/web/tests/CLAUDE.md` calls for.
3. **Verify**: Run all four from the root, never skip e2e (each script fans out to the workspace packages). Type the `vp` commands, never the pnpm script wrappers (`pnpm check`, …); Node is managed by vp too (`vp env`, pinned in `.node-version`):

   ```bash
   vp run check   # per package: vp check (fmt + lint + types); workbench: astro check
   vp run test    # vitest in every package with tests
   vp run e2e     # playwright e2e (apps/web)
   vp run build   # production build (apps/web)
   ```

   The bare built-ins work from the root as well: `vp check` (whole workspace), `vp test -- --run` (all test projects), `vp build` (apps/web). Playwright has no root config: run e2e with `vp run e2e` or `vp -C apps/web exec playwright test`. The root `vp run check` and `vp run test` compile the translations first (`vp run -F @pacevault/i18n compile`); before a bare `vp check` after translation keys changed, run that compile (the message types come from the generated files).

4. **Review**: every implemented plan delivers `tools/workbench/backlog/<item>/review/index.html` from `tools/workbench/shared/review-template.html`: each change labelled (C1, C2, …) with before/after screenshots (desktop and 390 px, via `vp run workbench:capture`) and 1–2 lines (what, `path:line`, which decision). The item folder is cleaned up only after the owner accepts (`tools/workbench/CLAUDE.md` Acceptance).
