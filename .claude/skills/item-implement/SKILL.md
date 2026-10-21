---
name: item-implement
description: 'Implements every ready PaceVault plan after the owner writes "lets dev": captures the "before" screenshots while the source is unchanged, then runs one item-worker per plan in dependency order with the full verification suite, no stops. Use when the owner writes "lets dev" (also "lets dev, only <item>"), or an item is at status ready or in-dev. Usually reached through the item router. Never before "lets dev".'
---

# Item implement

The owner said "lets dev"; now everything that is `ready` gets built, back to back, without stopping to ask.

## Standing rules

- **No code before "lets dev"** (root `CLAUDE.md` §5). `ready` alone is not the go-ahead. Without "lets dev" in the conversation, tell the owner in one line what is ready and stop.
- **No stops between plans:** don't pause to report or ask. Questions, deviations and new failures go into each item's review doc; the owner reviews everything at the end.
- **Holds:** "lets dev, only <item>" (or "only <item>" during a run) builds that item and stops after it; the other `ready` items stay `ready` and are named in the hand-off.
- **Owner steps are a hand-over, not a failure.** What the status guard blocks for agents (setting `ready` or `done`, ticking checks or agent decisions, `rm`/`mv` of a backlog folder or of a backlog file such as a plan) is listed under "Owner steps" in the review doc and the hand-off. Don't retry it another way.
- The board (`vp run workbench`, Astro in `tools/workbench/site/`) reads the files through the dev server and updates by itself; there is nothing to regenerate. A `PostToolUse` hook runs the `workbench:check` rules after every Edit/Write of a `plan.md`, `tech.md` or `review/decisions.md` and reports errors at once. Before handing over, run `vp run workbench:check` (frontmatter, question rules, mockup ↔ plan, `tech.md` from `planned` on except for `size: small`, agent-decision format); it must pass.
- Status moves only as the status guard allows: `ready → in-dev` when a plan's work starts; `in-dev → planned` when the plan itself turns out wrong (then that plan stops and needs the owner's `ready` again; continue with the next one). `ready` and `done` are owner-only: propose them in one line, never set them.
- Never tick a `- [ ]` item; never commit (root `CLAUDE.md` §5); never `git stash`, `checkout`, `restore`, `reset` or use a worktree.
- Every `path:line` you write is verified against the current file.
- Workers are spawned as `subagent_type: "item-worker"`; it already carries the code rules (root `CLAUDE.md` §2, `apps/web/src/store/CLAUDE.md`), the report headings and the rule that its agent decisions go to `tools/workbench/backlog/<f>/review/decisions.md` (only behaviour, look or scope, with the kind first; implementation details go under Deviations). The prompt carries only the task.

## Progress

```
- [ ] 1. Gate and unchanged source checked
- [ ] 2. Ready plans ordered (holds applied)
- [ ] 3. "Before" captured for every item with a UI change
- [ ] 4. Each plan implemented, verified, handed to item-review
- [ ] 5. Owner told the round is ready
```

## Steps

1. **Gate and unchanged source.** Confirm "lets dev" (and any hold) and run `git status --porcelain`. Paths under `tools/workbench/backlog/` may be dirty (plans, reviews, decisions); any other dirty path means the "before" shots would not show the base commit: list those paths and ask the owner to commit first; don't start.

2. **Collect and order.** Every `tools/workbench/backlog/*/plan.md` with `status: ready` (and any `in-dev` plan left from an interrupted run), limited to the held item if there is a hold. Order them by `depends-on`: a dependency comes first. A dependency that is neither in this set nor `done` → note it for that item's review doc and implement anyway unless the plan says it can't work without it. Items without a dependency between them whose `tech.md` `### New` / `### Changed` lists (the plan's `## Files` for a `size: small` item) share no file and that need no common port may run in parallel (one worker each); captures always run one after another.
   Done when you have the ordered list.

3. **"Before" for all of them, before any code change** (§9.3 of the workbench plan). Pick the capture by what the item changes:
   - **PWA screens** (`apps/web`): `tools/workbench/backlog/<f>/review/capture.spec.ts` from `.claude/skills/item-review/references/capture-spec-template.ts`, one `shootAll` scene per screen the plan changes, showing the UI as it exists now. The app dev server runs on port 5176.
   - **The board** (`tools/workbench/site`): `capture.spec.ts` from `.claude/skills/item-review/references/board-capture-template.ts`, one scene per board view the plan changes. The board runs on port 4321 (a board the owner already runs is reused).
   - **No UI change**: no spec and no shots; the review doc says so explicitly ("No UI change, no screenshots").

   A worker may write the specs (one `item-worker` per item, in parallel, task: "write the capture spec only, change nothing else"). Run the captures one after another: `WB_SHOTS=before vp run workbench:capture -- tools/workbench/backlog/<f>/review`. The shots land in `tools/workbench/backlog/<f>/review/before/`.
   Done when every item with a UI change has its `before/` shots and no source file has changed yet (`git status --porcelain` shows no new path outside `tools/workbench/backlog/`).

4. **One plan at a time, in order** (or in parallel per step 2). For each plan:
   1. Set `status: in-dev`; rewrite `next:` to `Implementing`.
   2. Spawn one `item-worker` in the foreground with: the plan path, the `### New` and `### Changed` lists from `tools/workbench/backlog/<f>/tech.md` (for a `size: small` item the plan's `## Files`; the files to create and modify; a departure from them is a deviation to report), "implement the plan completely and the tests `tests/CLAUDE.md` calls for", "run the full CLAUDE.md §5 suite", and what earlier plans in this run changed that touches this one.
   3. Read its report. Check the suite result yourself; for each failing test:
      - listed in `tools/workbench/backlog/flaky.md` → re-run with `vp -C apps/web exec playwright test --last-failed --workers 1`; still failing is a new failure;
      - not listed → new failure: have the same worker (SendMessage) fix it when the change caused it, otherwise it goes into the review doc's Open points.
   4. Hand the item to `item-review` (first round) with the worker report: Deviations, Open questions, Owner steps and Verification go into the review doc; its agent decisions are in `review/decisions.md` (add any it reported but did not write). `item-review` captures "after" and sets `in-review`. Then continue with the next plan, no stop (unless held).
      Done when every plan is `in-review` (or back at `planned` with the reason in its review doc).

5. **Final suite and hand-off.** After the last plan, run the full root `CLAUDE.md` §5 suite once more with `vp` commands (all four, never skip e2e; `vp run check` compiles the translations first, before a bare `vp check` run `vp run -F @pacevault/i18n compile`), since later plans can break earlier ones. Skip it when the round built a single `size: small` item (its worker already ran the suite). New failures go into the affected review doc. Then tell the owner in a few lines: items in review, review doc paths, new failures, owner steps, items held back, and "accept with Mark done in the panel footer on the board, or send R-labelled findings".
