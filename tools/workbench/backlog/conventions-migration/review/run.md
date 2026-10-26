# How the run continues (for a session that picks it up)

The run implements the convention plans one at a time (plan.md Approach). Everything needed to continue is on disk:

- **Next plan:** among the files left in `docs/conventions/plans/`, the first one in the order below whose file still exists. Its `depends_on` plans are all deleted by then (a deleted plan = done). `tooling.md` is always last.
- **Done so far:** `review/progress.md` (one log line per plan); notes for later plans: `review/carryover.md`.
- **Before each plan:** nothing to set; the item stays `status: in-dev` for the whole run.
- **After each plan:** check the worker's report (suite green, plan file deleted, progress and carryover lines written); every few plans run `vp run check` and `vp run test` yourself.
- **After the last plan:** the final suite (`vp run check`, `vp run test`, `vp run e2e`, `vp run build`), the conventions check (`node tools/workbench/backlog/conventions-migration/research/conventionsCheck.mjs docs/conventions`, expect 0 plans), remove the empty `docs/conventions/plans/`, then hand over to `item-review` (after shots: `vp run workbench:capture -- tools/workbench/backlog/conventions-migration/review`).

## Order

1 authenticated-fetch-and-response-parsing · 2 component-declaration-shape · 3 context-provider-accessor-pairs · 4 engine-holds-domain-logic-only · 5 helpers-as-namespace-objects · 6 hook-results-bound-whole · 7 index-modules-are-not-barrels · 8 hook-directory-placement · 9 library-type-narrowing · 10 component-ref-handling-by-need · 11 mirrored-spec-layout · 12 assertion-vocabulary · 13 collaborators-replaced-with-mocks · 14 comments-cite-sources-and-explain-why · 15 behavioural-constants-hoisted-upper-snake · 16 boolean-names-without-is-prefix · 17 exhaustive-record-maps-over-branching · 18 colocated-types-module · 19 domain-error-subclasses · 20 native-date-and-duration-constants · 21 navigation-through-router-hooks · 22 one-hook-per-file · 23 one-server-call-per-hook-module · 24 hooks-return-the-fitting-shape · 25 render-through-provider-helpers · 26 accessible-queries-in-component-tests · 27 single-zustand-store-of-slices · 28 styled-api-over-sx · 29 test-data-from-mock-factories · 30 names-spell-out-their-meaning · 31 floating-promises-marked-void · 32 effects-are-rare · 33 spec-describe-and-case-titles · 34 user-facing-strings-in-copy-modules · 35 formatting-through-intl-namespace · 36 variant-unions-with-default-resolvers · 37 visible-copy-arrives-as-props · 38 zod-schema-naming-and-inference · 39 helpers-group-by-topic · 40 signature-parameter-shape · 41 cross-boundary-contracts-in-shared · 42 snackbar-feedback-via-feature-maps · 43 unit-length-discipline · 44 ui-primitives-from-react-ui · 45 component-directory-and-file-naming · 46 tooling

## Round 2 order (review findings R1–R3)

47 round2-tdr-decisions · 48 round2-missed-sites · 49 round2-features-into-components · 50 round2-lib-topic-folders · 51 round2-rules-and-gates. Same worker prompt; "Run <N> of 51". After the last one: final suite, conventions check (expect 0 plans), "after" capture, review doc round 2 (R1–R3 entries above Changes).

## Worker prompt (one `item-worker` per plan; replace `<N>` and `<plan>`)

```text
Implement ONE convention plan of the PaceVault conventions migration (backlog item `tools/workbench/backlog/conventions-migration/`, status in-dev, owner said "lets dev"). Repo /Users/fabianhinz/Documents/Dev/PaceVault. Run <N> of 46.

Plan: `docs/conventions/plans/<plan>.md`. Rule: `docs/conventions/tdr/<plan>.md` (read the TDR first, then the plan; tooling.md has no TDR).
Binding context: the item's `plan.md` (Decisions (settled), answered Q1–Q30, Approach steps 2–6) — answers win over the handover. Read `tools/workbench/backlog/conventions-migration/review/carryover.md` (what earlier plans changed) before starting.

Do:
1. Execute every Changes item of the plan and its Check. Line numbers may have moved: find code by symbol/text. Write the tests `apps/web/tests/CLAUDE.md` calls for; a value-sensitive refactor gets a temporary pin spec first, deleted inside this plan.
2. Run the full suite from the root: `vp run check`, `vp run test`, `vp run e2e`, `vp run build` (never skip e2e). Known flaky specs → rerun once, don't investigate: unit OP-69 (`records.computePbsForSessions`, `dynamicLaps`, `validation.integration`); e2e `mobile/map.spec.ts` "filter input stays in place while typing" and "chart scrub on touch moves the map circle". A failing e2e listed in `tools/workbench/backlog/flaky.md` is re-run with `vp -C apps/web exec playwright test --last-failed --workers 1`; an unlisted one that passes on rerun is noted as a suspected flake in your progress line. NEVER run a bare `vp fmt`; format only code paths. If a banner check rewrites `docs/banners/*.png`, write the committed bytes back (`git show HEAD:<path> > <path>`).
3. Open or unsure point → keep today's behaviour for that spot, append an `## OP-<next number> · <title>` entry (What / User impact / Options, same format) to `tools/workbench/backlog/conventions-follow-ups/research/open-points.md`, continue. Own decision that changes behaviour, look or scope → `tools/workbench/backlog/conventions-migration/review/decisions.md` per your agent rules (Edit tool only).
4. If the suite can't be made green within this plan: undo all your changes by hand (no git stash/checkout/restore/reset), record an OP entry, report "reverted".
5. When done and green: delete the plan file (rm, not git rm); append one line under `## Log` in `review/progress.md` in the format of the lines above (number <N>, per-package test counts with delta); append a `## <N>. <plan>` section to `review/carryover.md` (renamed/moved files and symbols later plans must know, or "nothing").
Never commit or stage; don't edit TDRs, `docs/conventions/CLAUDE.md`, the item's plan.md/tech.md, or other plans.

Report (≤ 150 words): status, items done, suite results, deviations, OP entries, agent decisions.
```
