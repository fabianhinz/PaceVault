---
name: feature-review
description: "Builds the labelled review doc for an implemented PaceVault feature (workbench/<feature>/review/index.html with before/after screenshots) and runs review rounds on the owner's R-labelled findings. Use after a plan has been implemented, when a feature is at status in-review, or when the owner sends review findings. Usually reached through the feature router or feature-implement. Not for planning or first implementation."
---

# Feature review

The owner checks the result against the decisions in a local review doc; you build it and work their findings in rounds. Acceptance is the owner's: they delete the card on the board (or set `status: done` by hand).

## Standing rules

- The board (`vp run workbench`, Astro in `workbench/site/`) reads the files on every request and reloads by itself; there is nothing to regenerate. A `PostToolUse` hook runs the `workbench:check` rules after every Edit/Write of a `plan.md`, `tech.md` or `ideas.md` and reports errors at once. Before handing over, run `vp run workbench:check` (frontmatter, question rules, mockup ↔ plan, `tech.md` from `planned` on); it must pass.
- Status moves only as the status guard allows: `in-dev → in-review` when the doc is ready; `in-review → in-dev` while a review round reworks code, then back to `in-review`; `in-dev | in-review → planned` when a finding changes the plan itself (then it needs the owner's `ready` again). `ready` and `done` are owner-only: propose them in one line, never set them.
- Never tick a `- [ ]` item under `## Real-data checks` or `## Agent decisions`; never commit (`feedback_no_commits`); never delete the mockup, plan or review (that is `feature-done`, after acceptance).
- Smallest fix for each finding (`feedback_minimal_fixes`); nothing adjacent.
- Every `path:line` in the doc is verified against the current file. Workbench paths override path mentions in memory files (the review doc and its screenshots are committed).
- Workers are spawned as `subagent_type: "feature-worker"`; the prompt carries only the task.

## The review doc

`workbench/<f>/review/index.html`, copied from `workbench/_shared/review-template.html` (its stylesheet href `../../_shared/review.css` already fits). Keep the template's markup and classes; replace its demo entries.

- **Header:** `.rv-over` "Review · round n", H1 = the plan's long title, 1–2 lines on what changed.
- **Sections, in this order:** (`Review round n`, later rounds only, newest on top) · Changes · Changes without UI · Deviations · Open points · Verification · How to check.
- **Entry** (`article.rv-entry`): chip label, title, 1–2 lines (what, which decision, e.g. Q4), `.rv-refs` with `path:line`, then the comparison:
  - desktop: `.rv-swipe` slider with `before/<name>.png` and `after/<name>.png`; an after-only shot is a plain `.rv-stage` with the After tag;
  - phone: `.rv-pair` with Before/After figures.
- **Labels:** first-round changes are `C1, C2, …`; review-round entries use the owner's `R` labels as given.
- **Open points:** first the plan's open `## Agent decisions` items (decision + reason, "confirm by ticking it in the plan"), then boundary violations from `vp run workbench:deps` (rule, from → to), the workers' open questions (options, recommendation first), new test failures, and real-data checks still to do.
- **Verification:** command table of the CLAUDE.md §5 suite with pass/fail; failures marked known or new per `workbench/flaky.md`.
- **How to check:** numbered steps the owner can do in the running app.

## Steps

## Actual import graph

Every round, before writing the doc, run `vp run workbench:deps -- <f>`. It cruises `src/` with `.dependency-cruiser.cjs`, focuses on the `### New` paths of `workbench/<f>/tech.md` (`### Changed` when New is empty) and writes `review/deps.mmd` (Mermaid) and `review/deps.json` (counts, added, missing, boundary result). Exit 1 means a boundary rule (`engine-is-pure`, `store-no-features`) is violated: the printed line goes into Open points; it is a finding, not something to fix outside the plan.

### First round (from `feature-implement` or `status: in-dev` without a doc)

1. **Doc.** Run `vp run workbench:deps -- <f>` first (see Actual import graph). `cp workbench/_shared/review-template.html workbench/<f>/review/index.html`, then fill it in small Edit steps from the plan and the worker report: one C entry per UI or flow change, Changes without UI as short entries saying what the owner can observe, Deviations and Agent decisions from the report.
2. **Capture "after".** If `review/capture.spec.ts` doesn't exist (no "before" was taken), write it from `references/capture-spec-template.ts`. Extend it with a scene for every C entry. Run `vp run workbench:capture -- workbench/<f>/review`; the shots land in `review/after/`.
3. **Check the doc.** Every `<img>` points at a file that exists, and every PNG in `before/` and `after/` is referenced or listed as unused. Open the doc headless and check `naturalWidth > 0` for every image when unsure.
4. **Hand over.** Set `status: in-review`; rewrite `next:` to `Owner reviews round 1`. One line to the owner: the doc path, "accept by deleting the card on the board, or send R-labelled findings".

### Review round n (the owner sends R-labelled findings)

Findings arrive in the chat or as `- **Rn** · open · on <entry> · …` lines in `workbench/<f>/review/findings.md` (written by an agent or by hand); work the open ones from both.

1. **Start.** Set `status: in-dev`; rewrite `next:` to `Review round n rework`. Move the shots: `rm -rf workbench/<f>/review/before && cp -R workbench/<f>/review/after workbench/<f>/review/before`.
2. **Sort each finding:**
   - unclear → ask the owner in the `feature-plan` question format; "i don't get it" keeps it open, explain again with a concrete example;
   - changes a settled plan decision → record it in the plan (quote the owner) and, if the approach must be replanned, move to `planned` and stop for this feature;
   - otherwise → a fix.
3. **Fix.** One `feature-worker` per feature with the R items, the plan path and "smallest fix per item, full CLAUDE.md §5 suite". Failures: listed in `workbench/flaky.md` → re-run with `vp exec playwright test --last-failed --workers 1`; not listed → new, into Open points.
4. **Recapture and document.** Re-run `vp run workbench:deps -- <f>`. Extend `capture.spec.ts` for any new scene, run the capture, add a "Review round n" section above Changes with one R entry per finding (fixed: before/after; not fixed: why), update Deviations, Open points and Verification.
5. **Hand over.** Set `status: in-review`; rewrite `next:` to `Owner reviews round n`. One line to the owner, as in the first round.

### Acceptance

When the owner says it's accepted, propose in one line: "Delete the card on the board (or set `status: done` in `workbench/<f>/plan.md`); `feature-done` then cleans up." Never set it yourself.
