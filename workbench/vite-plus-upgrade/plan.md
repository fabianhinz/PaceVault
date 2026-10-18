---
title: vite-plus upgrade
status: in-review
created: 2026-10-19
next: Owner reviews round 1
---

# Upgrade vite-plus and setup-vp

## Context

The repo pins `vite-plus` `^0.1.13`, `vite` `^8.0.2`, `vitest` `^4.1.1`, `@vitest/coverage-v8` `^4.1.1` (`package.json:82,90,92,93`); the global CLI on the owner's machine is 1.3.0. CI uses `voidzero-dev/setup-vp@v1` with `node-version: '24'` (`.github/workflows/ci.yml:20-22`, `deploy.yml:20-22`); the `v1` tag no longer gets updates (Vite+ 1.3.0 docs, `guide/ci.md`). `repo-restructure` depends on this item so it runs on the documented monorepo version.

Facts from the Vite+ 1.3.0 docs (`guide/upgrade-project.md`, `migrate.md`, `vitest-v5.md`, `migrate-rules.md`), the 1.3.0 migrator source and the setup-vp README (fact-check 2026-10-19):

- `vp migrate` with a global CLI newer than the project upgrades the project to that version. In default mode it:
  - writes `vite@*: npm:@voidzero-dev/vite-plus-core@1.3.0` and `vitest@*: 5.0.5` under `overrides` in `pnpm-workspace.yaml`, and moves `vite-plus`, `@vitest/coverage-v8` (aligned to 5.0.5) and likely `vite`/`vitest` to `catalog:` references with a `catalog:` block there;
  - rewrites every `from 'vitest'` import to `vite-plus/test` (135 test files incl. `tests/setup.ts:2`) and `vitest/config` to `vite-plus` (`vitest.config.ts:2`), then runs `vp fmt` on the changed files; `vitest` stays a direct devDep because `tsconfig.test.json` types `vitest/globals`;
  - adds `.vitest/` to `.gitignore`;
  - replaces `setup-vp@v1` with `v1.21.2` (`SETUP_VP_VERSION` in the migrator source);
  - downloads pnpm and runs the install itself (needs network).
    It skips git hooks, `.vscode`, agent files, lint config, tsconfig `baseUrl` and `.nvmrc` conversion (those are `--full`).
- Vite+ 1.0 bundles Vitest 5 (breaking). The migration reads the old runner from the lockfile (`vitest` locked at 4.1.1), so it must run before deps are touched. For this repo it adds only `clearMocks: false` (no Temporal polyfill, projects, browser mode or coverage thresholds), possibly also as a new `test` block in `vite.config.ts`. Expected v5 breakage: 0–2 files; the 4 files asserting on mock calls create their mocks per test (`tests/lib/intervals.spec.ts:19-23`, `tests/lib/weather.spec.ts:332-339`, `tests/features/records/hooks/usePersonalBests.spec.ts:18-23`, `tests/features/sessions/createIngestBatcher.integration.test.ts:42`).
- Node `^22.18.0 || ^24.11.0 || >=26.0.0` is required.
- setup-vp (`v1.21.2`) has a `node-version-file` input that accepts `.node-version` (setup-vp README); without it, vp's shims would also find `.node-version`.
- `vp env pin 24` most likely writes an exact version (`env.md`: pins resolve to an exact version), so it can't produce the `24` from Q2.
- No other Node pins exist (no `engines`/`devEngines`, Dockerfile, firebase or `.vscode` setting).

## Decisions (settled)

- Separate item before `repo-restructure`. Owner: "Separate item first (Recommended)" (repo-restructure Q10).
- Node via vp only. Owner: "I'll use vp only".
- **Node pin lives here:** `.nvmrc` → `.node-version` containing `24`; CI reads it via `node-version-file`. `repo-restructure` drops that step (Q1, Q2).
- **Vitest 5 defaults now:** the v4 compatibility settings the migration adds are removed in this item; tests that relied on v4 behaviour get fixed (Q3).
- **setup-vp:** the exact release tag `vp migrate` writes (Q4).
- **Test imports:** `vite-plus/test` is the convention from now on (Q5).

## Approach

1. **Migrate.** At the root, with the original lockfile and `node_modules` in place: `vp migrate --no-interactive` (default mode, not `--full`) using the global 1.3.0 CLI. Read the file-specific review report; resolve blockers and rerun if it stops.
2. **Coverage plugin.** Migrate aligns `@vitest/coverage-v8` to 5.0.5; only if it doesn't, bump it to `vp toolchain vitest`.
3. **Install and fix.** `vp install`, then the verification suite with the compatibility settings still in place, so pure upgrade breaks show up first.
4. **Adopt v5 defaults** (Q3). Remove each compatibility setting the migration added (expected: `clearMocks: false` in `vitest.config.ts`, and a `test` block in `vite.config.ts` if it adds one), one at a time, following the checks in `vitest-v5.md` ("Remove unneeded compatibility settings"); fix the tests that rely on v4 behaviour (e.g. mock calls from setup or earlier tests for `clearMocks`), smallest change per test. The suite is green after each removal.
5. **Node pin** (Q1, Q2): write `.node-version` with `24` by hand (not `vp env pin`, which writes an exact version), delete `.nvmrc`; `vp env current` shows source `.node-version`.
6. **CI.** `ci.yml:22`, `deploy.yml:22`: `node-version: '24'` → `node-version-file: .node-version`; keep the exact setup-vp version migrate wrote (Q4).
7. **Docs.** Root `CLAUDE.md` §1 tech stack row (Vite+ version, Vitest 5); `README.md` contributing: Node from `.node-version`, managed by vp.
8. **workbench/site.** The `vite@*` override also replaces Astro 7.4's own `vite ^8.3.4` with vite-plus-core 1.3.0 (bundles Vite 8.3.4). `vp run workbench:check` and `vp run workbench` (board starts, a write-back works) must pass; if Astro breaks, stop and report.
9. **Imports** (Q5): keep the migrator's `vite-plus/test` / `vite-plus` imports; add one line to `tests/CLAUDE.md`: test APIs are imported from `vite-plus/test`.

## Files

**Create:** `.node-version`.

**Modify:** `package.json` (`catalog:` references, `vite-plus`, `vitest`, `@vitest/coverage-v8`), `pnpm-workspace.yaml` (`overrides` `vite@*`/`vitest@*`, `catalog:`), `pnpm-lock.yaml`, `.gitignore` (`.vitest/`), `vitest.config.ts` (import, compatibility setting added then removed), `vite.config.ts` (only if migrate adds a `test` block), 135 test files and `tests/setup.ts` (import rewrite), `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `CLAUDE.md`, `README.md`, `tests/CLAUDE.md`, tests that break under Vitest 5 (unknown until the run).

**Delete:** `.nvmrc`.

## Tests

No new tests. All existing unit, integration and e2e tests pass on Vitest 5 with its defaults; tests changed for v5 behaviour are listed in the review doc.

## Verification

1. `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.
2. `vp run test:coverage` (coverage plugin changes major version).
3. `vp run workbench:check`; the board starts and a write-back works; `vp run readme:banner --locale en` still renders.
4. `vp env current` shows Node from `.node-version`.
5. CI and deploy workflows green on the branch (owner pushes).

## Delivery and acceptance

Review doc in `workbench/vite-plus-upgrade/review/index.html`: version table before/after, the migration report summary, compatibility settings added, tests changed, CI link. No UI change, so no screenshots. Cleanup only via `feature-done` after the owner accepts.

## Open questions

- **Q1** · answered 2026-10-19 · Where does the `.nvmrc` → `.node-version` switch live? → (a) Here, with CI reading `node-version-file: .node-version`; repo-restructure drops it. Owner: "Move it here (Recommended)"
- **Q2** · answered 2026-10-19 · Which pin goes into `.node-version`? → (a) `24`. Owner: "24 (Recommended)"
- **Q3** · answered 2026-10-19 · Keep the Vitest-4 compatibility settings? → (b) Remove them in this item and fix the tests. Owner: "Remove now"
- **Q4** · answered 2026-10-19 · How is setup-vp pinned? → (a) Exact release tag. Owner: "Exact tag (Recommended)"
- **Q5** · answered 2026-10-19 · Keep the migrator's `vitest` → `vite-plus/test` import rewrite? → (a) Accept as the new convention, one line in `tests/CLAUDE.md`. Owner: "Accept as convention (Recommended)"

## Agent decisions

- [ ] **`.node-version` is written by hand.** Agent: `vp env pin 24` resolves to an exact version, which contradicts Q2.
- [ ] **The stale `.oxlintrc.json` / `.oxfmtrc.jsonc` mention in `CLAUDE.md:22-23` stays for `repo-restructure` step 7.** Agent: scoped branches; that plan already fixes it.
- [ ] **`vp migrate` ran with `--no-hooks --no-agent --no-editor`.** Agent: the 1.3.0 help lists `--hooks` as the non-interactive default; the plan expects default mode to skip hooks, agent files and editor config, so the flags pin that.
- [ ] **The oxfmt 0.73 reformat of `useVolumeSeries.ts`, `workbench/repo-restructure/tech.md` and this plan is kept.** Agent: the new formatter flags them and `vp check` fails otherwise; whitespace and trailing commas only.
- [ ] **The migrator's `peerDependencyRules` (allowAny `vite`/`vitest`) in `pnpm-workspace.yaml` is kept.** Agent: part of the migrator output; it silences peer-range warnings against the aliased core.
- [ ] **The board was checked through astro's `dev()` API on port 4322; the write-back was not exercised.** Agent: a board started before the upgrade holds 4321 and `astro dev` refuses a second instance; a write-back would change a real plan file.

## Risks

- The docs describe 0.3 → 1.0; the repo is on 0.1.13. The migrator identifies the old runner from the lockfile, but an untested jump may need a manual step (stop and report if it does).
- Vitest 5 changes defaults (mock history cleared per test, strict locators, shared Vite server for inline projects, fake timers mock Temporal). The number of tests that rely on v4 behaviour is unknown until the run; if one setting needs extensive test changes, stop and ask before going on (Q3).
- The `vite@*` override applies to every workspace package, including `workbench/site` (Astro). `workbench/site` has no vitest, so the `vitest@*` override doesn't touch it.
- `@vitejs/plugin-react`, `@tailwindcss/vite` and `vite-plugin-pwa` (already today) may warn on peer ranges against the aliased core; warnings, not failures.
