---
title: Workbench flow
status: done
created: 2026-10-19
type: chore
areas: [workbench, skills]
next: Owner reviews round 3
---

# Lighter item flow: fast lane and in-repo rules

## Context

Folds fast-lane and memory-rules-to-skills: both change the item skills (`.claude/skills/item*`) and the workbench flow.

- **Fast lane:** the full flow (tech.md, fact-check worker, deps graph, suite twice) outweighs a one-line fix, so small bugs wait (flow review, 2026-10-20).
- **Memory rules:** the skills and `.claude/agents/item-worker.md` tag 15 `feedback_*` memory files that live outside the repo, on this machine only. The skills already restate each rule inline; the tags are the only link.

## Decisions (settled)

- Fast lane: `size: small` skips tech.md, the fact-check worker and the deps graph, and the suite runs once; before/after screenshots stay for UI bugs; the `ready` gate stays (Q1).
- Memory-only rules move into the repo: workflow rules as plain text in the skills, code and UI rules in the area CLAUDE.md files (Q2).
- Rules already in a repo CLAUDE.md: memory file deleted, the skill tag points to the CLAUDE.md section (Q3). `persist_migrations` belongs here: `apps/web/src/store/CLAUDE.md:4` already says "bumps the version and ships a `migrate`".
- `no_attribution` is dropped; `one_board_server` goes into the repo (Q4). `user_no_gh_cli` is dropped; root CLAUDE.md §5 only says to review changes with `git diff` (owner, 2026-10-21: "lets drop the gh cli thingy. Just declare "git diff" as the way to go."). `max_effort` is dropped too: the project neither sets the effort level nor mentions it (owner, 2026-10-21: "we'll just do nothing about the effort level. This project will not set it, nor say anything about it").
- `size:` is owner-only: the status guard refuses any agent change to the line (Q5).
- A small card looks different on the board: subtle accent background and outline, no extra chip (Q6). Replaced in review (R1, 2026-10-21): the tint was not recognizable (owner: "how would anyone see that the blue thingy is actually a smaller item?"); a small card keeps the normal tile and gets a yellow "Fast" tag with a Zap icon on its top-right corner, half outside the card (owner picked "Corner tag"). Replaced again (R2, 2026-10-21) by a simpler look: the small card sits on a yellow backdrop that shows a full-width "Fast" banner above it, attached; no extra list padding (owner: "way too complicated. Lets make this kiss --> a fast item gets a littler backdrop banner with the fast label. No extra padding, the item just gets a full width banner that lives outside of the item but is attached to it"). Then (R3, 2026-10-21) the banner moved inside: it is the card's top strip, edge to edge, and the card's border takes the banner's colour (owner: "the banner of the item size=small should live inside the item. The item should have an outline/border matching the fast banner astetics").
- A small item's review doc keeps only Changes, Verification and How to check (Q7).

## Approach

### 1. Fast lane

- `tools/workbench/scripts/frontmatter.ts`: optional `size: z.enum(['small'])` in `planFrontmatterSchema` (`:61`); `checkPlan` (`:305`) skips the tech.md rule (`:332`) when `size` is `small`.
- `frontmatter.ts`: `readSize(text)` next to `readStatus` (`:126`).
- `tools/workbench/scripts/statusGuard.ts`: `decidePlan` (`:85`) refuses when `readSize(before) !== readSize(after)` (adding, changing or removing `size:`), and in the new-plan branch (`:92-95`) when the new plan has `size:`; message "size: is owner-only … Ask the owner." The header comment (`:18-32`) gains the rule.
- `tools/workbench/site/src/app/ItemCard.tsx` (`:42`, `:46-56`): when `props.item.data.size === 'small'`, the card gets a yellow "Fast" banner with a Zap icon as its top strip, edge to edge, and a border in the banner's colour (`border-status-warning-muted`) (R3; replaces the R2 attached banner, the R1 corner tag and the planned accent tint). No list padding in `tools/workbench/site/src/app/Columns.tsx`. No `board.ts` change: `ItemView.data` is the parsed schema (`tools/workbench/site/src/lib/board.ts:171`).
- `item-backlog`: documents `size: small` (one-line bugs and chores); the agent may suggest it to the owner, never write it. Its `workbench:check` line (`.claude/skills/item-backlog/SKILL.md:12`) gains "except `size: small`".
- `item-plan`: a small item has no tech.md and no fact-check worker (`.claude/skills/item-plan/SKILL.md:46`, `:54`); the agent verifies its own `path:line`s. The plan's `## Files` is the change list.
- `item-implement`: the worker gets the plan's `## Files` instead of tech.md `### New`/`### Changed` (`.claude/skills/item-implement/SKILL.md:49`), and the parallel-run rule (`:36`) compares `## Files` for a small item; "before" shots only when the item changes UI (unchanged rule, `:38-45`); the final suite (`:56`) is skipped when the round built a single small item.
- `item-review`: no `workbench:deps` run for a small item (`deps.ts` exits on a missing tech.md): the first-round and review-round steps (`.claude/skills/item-review/SKILL.md:58`, `:74`) say "skip for `size: small`", the check line (`:12`) gains the exception; a small item's doc has only Changes, Verification and How to check (before/after shots for UI bugs).
- `tools/workbench/README.md` (`:5`, `:49`), `tools/workbench/GUIDE.md` (`:11`): the "tech.md from planned on" lines gain the `size: small` exception; one line each on the fast lane.

### 2. Rules into the repo

| Memory rule                                                          | Goes to                                                                                                                                                                                 |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| terse_plans, scoped_branches, minimal_fixes                          | text stays in the skills, tag removed (`item-backlog`, `item-plan`, `item-review`, `item-worker.md`); minimal_fixes gains "check the actual UI before rating severity; no extra toasts" |
| no_reduced_motion, banners_top_of_page, consistent_action_placement  | `apps/web/CLAUDE.md`, new "UI rules" list                                                                                                                                               |
| no_marketing_tone                                                    | `packages/i18n/CLAUDE.md` Tone rule (`:20`): "states facts, never sells or nudges (free and open source)"                                                                               |
| no_non_null_assertion, engine_scope                                  | tag → "root CLAUDE.md §2"                                                                                                                                                               |
| no_commits, lets_dev_gate, run_e2e, use_vp_commands, paraglide_build | tag → "root CLAUDE.md §5"; §5 gains "run all four, never skip e2e" and "vp commands, never the pnpm script wrappers"                                                                    |
| impl_review_and_acceptance                                           | tag → root CLAUDE.md §5 step 4 (review doc) and `tools/workbench/CLAUDE.md` Acceptance (cleanup after acceptance)                                                                       |
| persist_migrations                                                   | tag → `apps/web/src/store/CLAUDE.md`                                                                                                                                                    |
| one_board_server                                                     | `tools/workbench/CLAUDE.md` Rules: one `astro dev` per site, reuse the running board, never `--ignore-lock`                                                                             |
| user_no_gh_cli                                                       | dropped; root CLAUDE.md §5: review changes with `git diff`                                                                                                                              |
| max_effort                                                           | dropped                                                                                                                                                                                 |
| no_attribution                                                       | dropped                                                                                                                                                                                 |

- The line "Workbench paths override path mentions in memory files" leaves all 6 skills and `.claude/agents/item-worker.md:25`.
- Last step: delete every `feedback_*.md` and `user_no_gh_cli.md` in `~/.claude/projects/-Users-fabianhinz-Documents-Dev-PaceVault/memory/` and their `MEMORY.md` lines (outside the repo, not in the diff).

## Files

- **Changed:** `tools/workbench/scripts/frontmatter.ts`, `tools/workbench/tests/frontmatter.spec.ts`, `tools/workbench/scripts/statusGuard.ts`, `tools/workbench/tests/statusGuard.spec.ts`, `tools/workbench/tests/boardRead.spec.ts`, `tools/workbench/site/src/app/ItemCard.tsx`, `.claude/skills/item-backlog/SKILL.md`, `.claude/skills/item-explore/SKILL.md`, `.claude/skills/item-plan/SKILL.md`, `.claude/skills/item-implement/SKILL.md`, `.claude/skills/item-review/SKILL.md`, `.claude/skills/item-done/SKILL.md`, `.claude/agents/item-worker.md`, `CLAUDE.md`, `apps/web/CLAUDE.md`, `packages/i18n/CLAUDE.md`, `tools/workbench/CLAUDE.md`, `tools/workbench/README.md`, `tools/workbench/GUIDE.md`.
- **New / deleted in the repo:** none.

## Tests

- `tools/workbench/tests/frontmatter.spec.ts`: `checkPlan` at `planned` without tech.md → error; same with `size: small` → no error; `size: big` → schema error.
- `tools/workbench/tests/statusGuard.spec.ts`: an Edit adding, changing or removing `size:` is refused; an Edit that keeps it passes; a Write creating a plan at `status: idea` with `size: small` is refused.
- `tools/workbench/tests/boardRead.spec.ts`: `readItem` keeps `data.size === 'small'`; a small item at `planned` without tech.md has no check error.
- `grep -rn "feedback_\|user_no_gh_cli" .claude CLAUDE.md apps packages tools --include=*.md --exclude-dir=backlog --exclude-dir=node_modules` returns nothing.

## Verification

1. `vp run check`, `vp run test` (workbench tests), `vp run workbench:check`.
2. No app code changes, so `vp run e2e` and `vp run build` run unchanged as the suite requires.
3. Manual: owner sets `size: small` on a card; the board shows the yellow "Fast" banner as the card's top strip and a yellow border.
4. Manual: a fresh session in the repo with an empty memory folder still gets every rule (spot-check: ask for a commit, ask for a plan).

## Delivery and acceptance

Review doc in `tools/workbench/backlog/workbench-flow/review/`: board before/after shot of a small card (board capture template), and the rule table above with where each rule landed. Cleanup only via `item-done` after the owner's acceptance.

## Open questions

- **Q1** · answered 2026-10-21 · Shape of the fast lane? → (b) as (a), but keep the before/after screenshots for UI bugs. Owner: "b"
- **Q2** · answered 2026-10-21 · Where do the memory-only rules (terse_plans, scoped_branches, minimal_fixes, persist_migrations, no_marketing_tone, no_reduced_motion, banners_top_of_page, consistent_action_placement) go? → (a) into the repo: workflow rules as plain text in the item skills, code and UI rules in `apps/web/CLAUDE.md` / `packages/i18n/CLAUDE.md`; memory files deleted. Owner: "Into the repo (Recommended)"
- **Q3** · answered 2026-10-21 · Memory rules already in a repo CLAUDE.md (no_non_null_assertion, no_commits, lets_dev_gate, run_e2e, use_vp_commands, paraglide_build, engine_scope, impl_review_and_acceptance)? → (a) delete the memory files; skill tags point to the CLAUDE.md section. Owner: "Delete memory + tags (Recommended)"
- **Q4** · answered 2026-10-21 · Personal and tool rules (no_attribution, one_board_server, max_effort, user_no_gh_cli)? → no_attribution is dropped; the others go into the repo. Owner: "drop the no_attribution, the rest into the repo"
- **Q5** · answered 2026-10-21 · Who sets `size: small`? → (b) owner only: the status guard refuses an agent write of `size:`. Owner: "items that are in the fast lane (size: small) need to be visually different"
- **Q6** · answered 2026-10-21 · Does the board show it? (a) a "small" chip next to the type chip on the card (b) nothing on the board → Owner: "chip is not enough, maybe a different (subtle) background and outline will do?"
- **Q7** · answered 2026-10-21 · Review doc for a small item? → (a) the same template, only Changes, Verification and How to check. Owner: "a"

## Risks

- A wrongly sized item skips the fact-check and ships with stale `path:line`s; the `ready` gate is the only stop.
- Deleting the memory files is outside git: no undo. The repo copies land first, the deletion runs last.
