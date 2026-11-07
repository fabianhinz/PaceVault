---
title: Item history
status: planned
created: 2026-10-23
type: chore
areas: [workbench, skills, repo, docs]
next: 'Q&A on Q1, Q2'
---

# Keep an item's intended behaviour after its folder is cleaned up

## Context

`vp run workbench:cleanup` deletes the whole item folder (`tools/workbench/scripts/cleanup.ts:121`), so owner answers, confirmed agent decisions and review findings survive only in git history. Future agents and the owner can't tell whether a behaviour is on purpose or a bug.
This item adds a memory-style decision log in `docs/decisions/`, written by `item-done` before the cleanup, and gates the cleanup on it.

## Decisions (settled)

- **Memory-style layout** (owner, 2026-11-07: "yes"): one file per topic decision, not per item, named by topic (`docs/decisions/<name>.md`). A newer item updates or deletes an existing file instead of adding a contradicting one; git keeps the history.
- **Frontmatter:** `name` (equals the file name), `description` (one line, read in the index), `items` (list of item folder names that shaped it, at least one), `updated` (`YYYY-MM-DD`). Body: the decision, then `**Why:**` and `**Where:**` lines (code paths, the owner's words if useful).
- **Generated index** `docs/decisions/CLAUDE.md`, one line per file (`- [name](name.md) · items: a, b: description`), sorted by name, built like `docs/conventions/CLAUDE.md` (`tools/workbench/scripts/conventionsIndex.ts`): `vp run decisions:index` writes it, `vp run check` fails when it is out of date or a file's frontmatter is invalid.
- **Discovery by pointer, not import** (owner, 2026-11-07: "1. fair"): one line in the root `CLAUDE.md` and one in `apps/web/CLAUDE.md` point at the index; it is not `@`-imported, so it doesn't load into every session.
- **Every item leaves a datapoint:** `workbench:cleanup` refuses to delete a done folder unless at least one `docs/decisions/*.md` lists it in `items:`. A tiny item adds itself to a related file or gets a one-line file.
- **Owner confirms:** `item-done` shows the planned new, updated and deleted decision files in the chat and writes them only after the owner's OK, then runs the cleanup.
- No new TDRs and no rule changes beyond the two pointer lines.
- **Item statistics survive the cleanup** (owner, 2026-11-07: "mhm lets add this statistics part to the plan for our item history"): before the folder is deleted, `item-done` records the item's numbers, counted by a script from the folder and git, not estimated: days from `created:` to done; questions (total, answered); findings (total, fixed, declined) and review rounds; agent decisions (confirmed, superseded, open); owner quotes in plan and findings; screenshots (before, after, MB); review doc entries; research notes; words in plan, findings, decisions and tech; code diff of the item's files against the backlog folder's own lines. Numbers only: no place names, no paths into `research/`, nothing from screenshots. Example (`session-segments`): 6 days, 109/109 questions, R1–R99 (92 fixed, 7 declined), 216 decisions (164 superseded, 50 confirmed), 409 shots (71 MB), code +10,235 / −993 against +20,522 backlog lines.

## Approach

1. `decisionsIndex.ts` (workbench scripts): zod schema for the frontmatter, `decisionsIndex(records)` returns `{ index, errors }` (pure, tested), `itemsWithDecisions(records)` returns the set of item names found in `items:`. `main` checks or writes (`--write`), same shape as `conventionsIndex.ts`.
2. `cleanup.ts`: each item carries `recorded: boolean` (its folder is in `itemsWithDecisions`); `selectDeletions` gets a fourth bucket `unrecorded` for done folders without a decision file (checked after `undecided`, before the git state), and `main` warns `skipped …: no docs/decisions/*.md lists it in items: (run item-done to record it)`.
3. Scripts: workbench `decisions` / `decisions:write`, root `decisions:index`, and `vp run -F @pacevault/workbench decisions` appended to the root `check`.
4. `docs/decisions/CLAUDE.md` created with the header and no entries, so the check passes on an empty log.
5. `item-done` skill: new step 1 "Record decisions" before the reference grep: read `plan.md` (Decisions, answered questions), `review/decisions.md` (ticked items), `review/findings.md`; read `docs/decisions/CLAUDE.md` and the matching files; propose per topic: new file, update (add the item to `items:`, rewrite body, bump `updated`), or delete when superseded; show the proposal, write after the owner's OK, run `vp run decisions:index`. Then the existing steps.
6. `itemStats.ts` (workbench scripts): `itemStats({ folder, files, diff })` returns the numbers above from the parsed `plan.md`, `review/findings.md`, `review/decisions.md`, the file list of `review/before|after/` and `research/`, and `git diff --numstat` of the merge-base (pure, tested); `main` takes the item name and prints or writes the record (storage per Q2). `item-done` runs it in its new record step, shows the numbers with the decision proposal, and writes both after the owner's OK.
7. Docs: root `CLAUDE.md` repo-map row for `docs/` ("generated docs assets and the decision log `docs/decisions/`") and a §4 pointer ("Before treating behaviour as a bug, check `docs/decisions/CLAUDE.md`"); same pointer in `apps/web/CLAUDE.md`; workbench `README.md` (scripts list, commands, cleanup line), `GUIDE.md` (done row), `FLOWS.md` §10 (record step and the new skip reason), `tools/workbench/CLAUDE.md` Acceptance line.

## Files

**Create:** `tools/workbench/scripts/decisionsIndex.ts`, `tools/workbench/tests/scripts/decisionsIndex.spec.ts`, `docs/decisions/CLAUDE.md`, `tools/workbench/scripts/itemStats.ts`, `tools/workbench/tests/scripts/itemStats.spec.ts`, the stats file per Q2.

**Modify:**

- `tools/workbench/scripts/cleanup.ts:8,46-63,93-122`: `recorded` on `CleanupItem`, `unrecorded` bucket, warning.
- `tools/workbench/tests/scripts/cleanup.spec.ts`: new fields and cases.
- `tools/workbench/package.json:15-16`: `decisions`, `decisions:write`, `stats`.
- `package.json:8-9`: `decisions` in `check`, root `decisions:index`.
- `.claude/skills/item-done/SKILL.md`: the record step.
- `CLAUDE.md:18` and §4; `apps/web/CLAUDE.md`: pointer lines.
- `tools/workbench/README.md`, `tools/workbench/GUIDE.md:15`, `tools/workbench/FLOWS.md:345-370`, `tools/workbench/CLAUDE.md:11` (Acceptance) and the Dependency rules line (names `conventionsIndex.ts`; add `decisionsIndex.ts`).

**Delete:** nothing.

## Tests

- `decisionsIndex.spec.ts`: one sorted line per file with its items; `name` not matching the file name is an error; missing frontmatter, empty `items` or a malformed `updated` is an error and the file is left out; `itemsWithDecisions` collects the union over all files.
- `itemStats.spec.ts`: counts from a fixture folder (questions by state, findings by state and round, decisions by `[ ]`/`[x]`/`[~]`, owner quotes, shots before/after, research notes, words); a missing `review/` gives zeros, not an error; `created:` to the done date in whole days.
- `cleanup.spec.ts`: a clean done folder without a record lands in `unrecorded`, with a record in `remove`; an unrecorded folder with open decisions stays `undecided`; non-done items are ignored whatever `recorded` says. Existing cases get `recorded: true`.

## Verification

1. `vp run check`, `vp run test`, `vp run e2e`, `vp run build`.
2. Manual: a scratch done item without a decision file → `vp run workbench:cleanup` skips it with the new warning; add a file listing it, `vp run decisions:index` → cleanup deletes it (restore with git afterwards). Hand-edit `docs/decisions/CLAUDE.md` → `vp run check` fails.

## Delivery and acceptance

- Review doc in `tools/workbench/backlog/item-history/review/index.html` from `tools/workbench/shared/review-template.html`: changes labelled C1…, terminal output of the manual check instead of screenshots (no UI).
- Cleanup only via `item-done` after the owner accepts; this item is the first to go through the new record step.

## Open questions

- **Q1** · open · Should `item-plan` read `docs/decisions/CLAUDE.md` when it drafts a plan, so a plan that would undo an earlier decision says so? (a) Yes: one line in its step 1, "read the index; name every decision the plan touches under Decisions (settled) and say whether it keeps or replaces it". Example: a plan to make the map light in light theme would list `light-theme-map-stays-dark` as replaced. (b) No: only the pointer lines in `CLAUDE.md`; agents look it up when they suspect a bug.
- **Q2** · open · Where do the item statistics live? (a) One generated table `docs/decisions/items.md`, one row per item (`| session-segments | 2026-11-02 → 2026-11-07 | 6 d | 109 Q | 99 R (92 fixed) | 216 decisions (164 superseded) | 409 shots | +10,235 / −993 code | +20,522 backlog |`), regenerated from one small JSON file per item in `docs/decisions/items/`; easy to compare items and to quote. (b) A `stats:` block in the frontmatter of the item's topic decision files; no new file, but an item with several topics repeats its numbers and there is no overview. (c) Only in the commit message `item-done` suggests; nothing in the repo, history only in git.

## Risks

- Summary quality depends on the `item-done` agent's judgement in matching topics; the owner's OK is the check.
- Files drift from the code over time; `updated` and `items` show their age, and a newer item replaces them.
