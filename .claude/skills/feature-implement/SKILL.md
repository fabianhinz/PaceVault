---
name: feature-implement
description: 'Implements every ready PaceVault plan after the owner writes "lets dev": captures the "before" screenshots in the clean tree, then runs one feature-worker per plan in dependency order with the full verification suite, no stops. Use when the owner writes "lets dev", or a feature is at status ready or in-dev. Usually reached through the feature router. Never before "lets dev".'
---

# Feature implement

The owner said "lets dev"; now everything that is `ready` gets built, back to back, without stopping to ask.

## Standing rules

- **No code before "lets dev"** (`feedback_lets_dev_gate`). `ready` alone is not the go-ahead. Without "lets dev" in the conversation, tell the owner in one line what is ready and stop.
- **No stops between plans** (`feedback_impl_review_and_acceptance`): don't pause to report or ask. Questions, deviations and new failures go into each feature's review doc; the owner reviews everything at the end.
- The board (`vp run workbench`, Astro in `workbench/site/`) reads the files on every request and reloads by itself; there is nothing to regenerate. A `PostToolUse` hook runs the `workbench:check` rules after every Edit/Write of a `plan.md`, `tech.md` or `ideas.md` and reports errors at once. Before handing over, run `vp run workbench:check` (frontmatter, question rules, mockup ↔ plan, `tech.md` from `planned` on); it must pass.
- Status moves only as the status guard allows: `ready → in-dev` when a plan's work starts; `in-dev → planned` when the plan itself turns out wrong (then that plan stops and needs the owner's `ready` again; continue with the next one). `ready` and `done` are owner-only: propose them in one line, never set them.
- Never tick a `- [ ]` item; never commit (`feedback_no_commits`); never `git stash`, `checkout`, `restore`, `reset` or use a worktree.
- Every `path:line` you write is verified against the current file. Workbench paths override path mentions in memory files.
- Workers are spawned as `subagent_type: "feature-worker"`; it already carries the code rules (CLAUDE.md §2, `feedback_no_non_null_assertion`, `feedback_engine_scope`, `feedback_persist_migrations`) and the report headings. The prompt carries only the task.

## Progress

```
- [ ] 1. Gate and clean tree checked
- [ ] 2. Ready plans ordered
- [ ] 3. "Before" captured for every ready feature
- [ ] 4. Each plan implemented, verified, handed to feature-review
- [ ] 5. Owner told the round is ready
```

## Steps

1. **Gate and clean tree.** Confirm "lets dev" and run `git status --porcelain`. The tree must be clean, so the "before" shots show the base commit. If it isn't, list the dirty paths and ask the owner to commit first; don't start.

2. **Collect and order.** Every `workbench/*/plan.md` with `status: ready` (and any `in-dev` plan left from an interrupted run). Order them by `depends-on`: a dependency comes first. A dependency that is neither in this set nor `done` → note it for that feature's review doc and implement anyway unless the plan says it can't work without it.
   Done when you have the ordered list.

3. **"Before" for all of them, before any code change** (§9.3 of the workbench plan). For each feature whose plan changes UI:
   - Write `workbench/<f>/review/capture.spec.ts` from `.claude/skills/feature-review/references/capture-spec-template.ts`: one `shootAll` scene per screen the plan changes, showing the UI as it exists now. A worker may write the specs (one `feature-worker` per feature, in parallel, task: "write the capture spec only, change nothing else").
   - Run the captures one after another (they share port 5176): `WB_SHOTS=before vp run workbench:capture -- workbench/<f>/review`. The shots land in `workbench/<f>/review/before/`.
   - A feature without UI changes gets no spec and no shots.
     Done when every UI feature has its `before/` shots and no source file has changed yet (`git status --porcelain` shows only `workbench/` paths).

4. **One plan at a time, in order.** For each plan:
   1. Set `status: in-dev`; rewrite `next:` to `Implementing`.
   2. Spawn one `feature-worker` in the foreground with: the plan path, the `### New` and `### Changed` lists from `workbench/<f>/tech.md` (the files to create and modify; a departure from them is a deviation to report), "implement the plan completely and the tests `tests/CLAUDE.md` calls for", "run the full CLAUDE.md §5 suite", and what earlier plans in this run changed that touches this one.
   3. Read its report. Check the suite result yourself; for each failing test:
      - listed in `workbench/flaky.md` → re-run with `vp exec playwright test --last-failed --workers 1`; still failing is a new failure;
      - not listed → new failure: have the same worker (SendMessage) fix it when the change caused it, otherwise it goes into the review doc's Open points.
   4. Hand the feature to `feature-review` (first round) with the worker report: Deviations, Agent decisions, Open questions and Verification go into the review doc. `feature-review` captures "after" and sets `in-review`. Then continue with the next plan, no stop.
      Done when every plan is `in-review` (or back at `planned` with the reason in its review doc).

5. **Final suite and hand-off.** After the last plan, run the full CLAUDE.md §5 suite once more with `vp` commands (`feedback_use_vp_commands`, `feedback_run_e2e`; when translation keys changed, `vp build` before `vp check`, `feedback_paraglide_build`), since later plans can break earlier ones. New failures go into the affected review doc. Then tell the owner in a few lines: features in review, review doc paths, new failures, and "accept by deleting the card on the board, or send R-labelled findings".
