---
name: item-review
description: "Builds the labelled review doc for an implemented PaceVault backlog item (tools/workbench/backlog/<item>/review/index.html with before/after screenshots) and runs review rounds on the owner's R-labelled findings. Use after a plan has been implemented, when an item is at status in-review, or when the owner sends review findings. Usually reached through the item router or item-implement. Not for planning or first implementation."
---

# Item review

The owner checks the result on the item's Review tab: the review doc, the agent decisions (`review/decisions.md`) and the findings (`review/findings.md`); you build the doc and work their findings in rounds. Acceptance is the owner's: they press Mark done in the panel footer of the in-review item on the board (or set `status: done` by hand).

## Standing rules

- The board (`vp run workbench`, Astro in `tools/workbench/site/`) reads the files through the dev server and updates by itself; there is nothing to regenerate. A `PostToolUse` hook runs the `workbench:check` rules after every Edit/Write of a `plan.md`, `tech.md` or `review/decisions.md` and reports errors at once. Before handing over, run `vp run workbench:check` (frontmatter, question rules, mockup ↔ plan, `tech.md` from `planned` on except for `size: small`); it must pass.
- Status moves only as the status guard allows: `in-dev → in-review` when the doc is ready; `in-review → in-dev` while a review round reworks code, then back to `in-review`; `in-dev | in-review → planned` when a finding changes the plan itself (then it needs the owner's `ready` again). `ready` and `done` are owner-only: propose them in one line, never set them.
- Never tick a `- [ ]` item under `## Real-data checks` (plan) or in `review/decisions.md`; never commit (root `CLAUDE.md` §5); never delete the mockup, plan or review (that is `item-done`, after acceptance).
- Smallest fix for each finding: a copy update beats new plumbing, an existing UI state beats a new toast; no extra toasts or notifications. Check how the UI actually behaves before rating a finding's severity. Nothing adjacent.
- Every `path:line` in the doc is verified against the current file (the review doc and its screenshots are committed).
- Workers are spawned as `subagent_type: "item-worker"`; the prompt carries only the task.

## The review doc

`tools/workbench/backlog/<f>/review/index.html`, copied from `tools/workbench/shared/review-template.html` (its stylesheet href `../../../shared/review.css` already fits). Keep the template's markup and classes; replace its demo entries.

- **Header:** `.rv-over` "Review · round n", H1 = the plan's long title, 1–2 lines on what changed.
- **Sections, in this order:** (`Review round n`, later rounds only, newest on top) · Changes · Changes without UI · Deviations · Open points · Verification · How to check.
- **Entry** (`article.rv-entry`): chip label, title, 1–2 lines (what, which decision, e.g. Q4), `.rv-refs` with `path:line`, then the comparison:
  - desktop: `.rv-swipe` slider with `before/<name>.png` and `after/<name>.png`; an after-only shot is a plain `.rv-stage` with the After tag;
  - phone: `.rv-pair` with Before/After figures.
- **Labels:** first-round changes are `C1, C2, …`; review-round entries use the owner's `R` labels as given.
- **Open points:** boundary violations from `vp run workbench:deps` (rule, from → to), the workers' open questions (options, recommendation first), owner steps (what the status guard kept from the agents), new test failures, and real-data checks still to do. Agent decisions are not copied into the doc: they live in `review/decisions.md`, and the owner confirms them by ticking them on the Review tab.
- **Verification:** command table of the CLAUDE.md §5 suite with pass/fail; failures marked known or new per `tools/workbench/backlog/flaky.md`; the `workbench:deps` run (import graph, components, files, interfaces; see Actuals).
- **How to check:** numbered steps the owner can do in the running app.
- **`size: small`:** only Changes, Verification and How to check (before/after shots for a UI bug); no `workbench:deps` run.

## Screenshots per item type

- **PWA screens** (`apps/web`): `review/capture.spec.ts` from `references/capture-spec-template.ts` (`shootAll`, desktop and phone, en and de; app dev server on port 5176).
- **The board** (`tools/workbench/site`): `review/capture.spec.ts` from `references/board-capture-template.ts` (`shoot`, one 1280×800 shot per scene (the board laid out at 1600×1000, saved at 0.8 scale), an element or the page; the board on port 4321, a running one is reused).
- **No UI change**: no spec and no shots; the doc says "No UI change, no screenshots" under Changes without UI.

`vp run workbench:capture -- tools/workbench/backlog/<f>/review` runs either kind (`tools/workbench/playwright.review.config.ts` starts the app and the board).

## Actuals (Tech tab: Planned | Actual)

Every round, before writing the doc, run `vp run workbench:deps -- <f>` for every item with a `tech.md` (skip for `size: small`: `deps.ts` exits without a tech.md); it writes all Actual sides of the Tech tab into `tools/workbench/backlog/<f>/review/`:

- `deps.mmd`, `deps.json`: the import graph (dependency-cruiser with `tools/workbench/.dependency-cruiser.cjs` over the folders of the plan's `areas:` and of the planned TypeScript paths), focused on every `### New` and `### Changed` path of `tech.md`, with counts, added, missing and the boundary result (the boundary rules are checked over `apps/web/src` and `packages/`). Exit 1 means a boundary rule (`engine-is-pure`, `store-no-features`) is violated: the printed line goes into Open points; it is a finding, not something to fix outside the plan.
- `components.mmd`: the component tree of the New / Changed `.tsx` files and the `.tsx` files they import (counts in `deps.json`).
- `files.json`: the files changed since the base (committed and uncommitted) against the planned New / Changed: changed and planned, changed not planned, planned untouched. The base is the merge-base with `main`; set `WB_BASE=<rev>` when the branch carries other work (for example the commit before the item's first implementation commit). Files under `tools/workbench/backlog/` count only when planned.
- `interfaces.md`: every export of the changed TypeScript files (the change list of `files.json`, deleted files left out; a file no planned path covers is headed `· not planned`) with the type the checker prints; planned TypeScript paths nobody changed under `## Missing` (also alone: `vp run workbench:interfaces -- <f>`, same base). tech.md's `## Interfaces` stays the planned record and is not edited to match.

Name the run under Verification of the doc: modules and imports drawn, boundary line, components, files (planned / not planned / untouched, base), interfaces (planned and not planned files and exports, missing). Data flow has no actual side.

## Decision sweep

Before every hand-over, read `tools/workbench/backlog/<f>/review/decisions.md` against the plan's answered questions and decisions and the newer agent decisions: every open decision a later one replaced becomes `- [~] … Superseded by: <pointer>` (with Edit; only `[ ]` → `[~]` plus the pointer, the status guard checks it). Decisions are only what changes behaviour, look or scope, with the kind first (`**(behaviour) …**`); implementation details a worker reported as decisions go under Deviations in the doc instead, never into decisions.md.

### First round (from `item-implement` or `status: in-dev` without a doc)

1. **Doc.** Run `vp run workbench:deps -- <f>` first (see Actuals; skip for `size: small`). `cp tools/workbench/shared/review-template.html tools/workbench/backlog/<f>/review/index.html`, then fill it in small Edit steps from the plan and the worker report: one C entry per UI or flow change, Changes without UI as short entries saying what the owner can observe, Deviations and Owner steps from the report. Agent decisions the worker reported but did not write go to `review/decisions.md`, not into the doc.
2. **Capture "after".** If `review/capture.spec.ts` doesn't exist (no "before" was taken) and the item changes UI, write it from the template for its type (see Screenshots per item type). Extend it with a scene for every C entry. Run `vp run workbench:capture -- tools/workbench/backlog/<f>/review`; the shots land in `review/after/`.
3. **Check the doc.** Every `<img>` points at a file that exists, and every PNG in `before/` and `after/` is referenced or listed as unused. Open the doc headless and check `naturalWidth > 0` for every image when unsure.
4. **Sweep decisions.** See Decision sweep.
5. **Hand over.** Set `status: in-review`; rewrite `next:` to `Owner reviews round 1`. One line to the owner: the doc path, "accept with Mark done in the panel footer on the board, or send R-labelled findings".

### Review round n (the owner sends R-labelled findings)

Findings arrive in the chat or as `- **Rn** · open · on <entry> · …` lines in `tools/workbench/backlog/<f>/review/findings.md` (written by an agent or by hand); work the open ones from both.

1. **Start.** Set `status: in-dev`; rewrite `next:` to `Review round n rework`. Move the shots: `rm -rf tools/workbench/backlog/<f>/review/before && cp -R tools/workbench/backlog/<f>/review/after tools/workbench/backlog/<f>/review/before`.
2. **Sort each finding:**
   - unclear → ask the owner in the `item-plan` question format; "i don't get it" keeps it open, explain again with a concrete example;
   - changes a settled plan decision → record it in the plan (quote the owner) and, if the approach must be replanned, move to `planned` and stop for this item;
   - otherwise → a fix.
3. **Fix.** One `item-worker` per item with the R items, the plan path and "smallest fix per item, full CLAUDE.md §5 suite". Failures: listed in `tools/workbench/backlog/flaky.md` → re-run with `vp -C apps/web exec playwright test --last-failed --workers 1`; not listed → new, into Open points.
4. **Recapture and document.** Re-run `vp run workbench:deps -- <f>` (see Actuals; skip for `size: small`). Extend `capture.spec.ts` for any new scene, run the capture, add a "Review round n" section above Changes with one R entry per finding (fixed: before/after; not fixed: why), update Deviations, Open points and Verification.
5. **Sweep decisions.** See Decision sweep.
6. **Hand over.** Set `status: in-review`; rewrite `next:` to `Owner reviews round n`. One line to the owner, as in the first round.

### Acceptance

When the owner says it's accepted, propose in one line: "Press Mark done in the panel footer on the board (or set `status: done` in `tools/workbench/backlog/<f>/plan.md`); say \"clean up\" and `item-done` removes the folder." Never set it yourself.
