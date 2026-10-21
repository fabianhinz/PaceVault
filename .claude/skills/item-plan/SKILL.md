---
name: item-plan
description: 'Writes or updates tools/workbench/backlog/<item>/plan.md for PaceVault and runs the Q&A with the owner until no question is open. Use when an item is at status idea, exploring (direction settled) or planned, when the owner answers plan questions, or when a plan needs rework during development. Usually reached through the item router. Not for exploring design variants (item-explore) and not for writing code.'
---

# Item plan

The owner decides; you draft, ask, record. This skill ends in a plan with no open questions, not in code.

## Standing rules

- No code before the owner writes "lets dev" (root `CLAUDE.md` §5). Answers update the plan and nothing else.
- The board (`vp run workbench`, Astro in `tools/workbench/site/`) reads the files through the dev server and updates by itself; there is nothing to regenerate. A `PostToolUse` hook runs the `workbench:check` rules after every Edit/Write of a `plan.md`, `tech.md` or `review/decisions.md` and reports errors at once. Before handing over, run `vp run workbench:check` (frontmatter, question rules, mockup ↔ plan, `tech.md` from `planned` on except for `size: small`); it must pass. If the hook reports an error (an answered question without a quote, a mockup ID missing from the plan), fix the file it names.
- Status moves only as the status guard allows: `idea | exploring → planned` when the first draft exists; `in-dev | in-review → planned` when the plan needs rework (it then needs the owner's `ready` again). `ready` and `done` are owner-only: propose them in one line, never set them.
- Never tick a `- [ ]` item under `## Real-data checks` (plan) or in `review/decisions.md`; never commit (root `CLAUDE.md` §5).
- Every `path:line` you write is verified against the current file.
- Workers are spawned as `subagent_type: "item-worker"`; the prompt carries only the task and its context.

## Plan rules

- Terse and change-focused, so the owner can scan it: 2–3 lines of context, then concrete change blocks (file → what changes), tests, verification. No analysis essays, watch-out essays, UX-risk tables or rationale sections; analysis belongs in the conversation.
- Strictly scoped, so every branch stays reviewable and single-purpose: the smallest change that solves the real problem (a copy update beats new plumbing, an existing UI state beats a new toast; no extra toasts or notifications for flows that already show progress or are silent by design). Check how the UI actually behaves before rating a problem's severity. Adjacent work, even a useful fix, is spun off (step 3).
- Engine code holds domain logic only (root `CLAUDE.md` §2, `packages/engine/CLAUDE.md`); a bumped persisted store version gets a `migrate` function (`apps/web/src/store/CLAUDE.md`).
- Every plan has a "Delivery and acceptance" section: review doc in `tools/workbench/backlog/<f>/review/` (root `CLAUDE.md` §5 step 4), cleanup only via `item-done` after the owner's acceptance (`tools/workbench/CLAUDE.md` Acceptance).
- `size: small` (owner-only, fast lane): no tech.md and no fact-check worker; the plan's `## Files` is the change list and you verify its `path:line`s yourself.

## Question format (`## Open questions`, the heading stays even when empty)

```markdown
- **Q3** · open · Which frame for phone? (a) 390 px inset card … (b) full-screen sheet …
- **Q4** · answered 2026-10-18 · Where does `--check` run? → (a) Vitest test. Owner: "Vitest staleness test"
```

- IDs run on per plan (`Q1`, `Q2`, …) and never get reused. If a mockup exists, every `decisions[]` ID (`{ id, title }`) must exist in the plan's Open questions or Decisions (settled); the mockup's badges and Questions tab read the states from the plan through the board, so an answer needs no mockup edit.
- An answer is recorded only with the owner's words quoted verbatim after `Owner:`, and the date of the answer.
- A reply that doesn't pick an option ("i don't get it", a counter-question) leaves the question `open`. Explain again with a different, more concrete example and ask again.
- A question the owner hands to you ("you decide") becomes an agent decision in `review/decisions.md`, not an answer.

## Agent decisions

Every decision you or a worker make without asking goes into `tools/workbench/backlog/<f>/review/decisions.md` as `- [ ] **(<kind>) <decision>.** Agent: <reason>` under the heading `## Agent decisions` (the first decision creates the file with that heading, also before a review doc exists; `workbench:check` checks the format). A decision is only what changes behaviour, look or scope; its kind (`behaviour`, `look`, `scope`) comes first in the bold part, and the status guard refuses a new line without one. Implementation details (class names, version pins, file splits, internal helpers) are not decisions: they go under Deviations in the report or the review doc. When a later owner answer or decision replaces one, mark it `- [~] … Superseded by: <pointer>` (only `[ ]` → `[~]` plus the pointer; the guard checks it). The plan has no `## Agent decisions` section. Only the owner ticks a decision on the Review tab (confirmed) or has an agent change it (changed).

## Steps

1. **Draft early.** Write the plan as soon as the direction is known, in the shape of `tools/workbench/backlog/session-detail-load-perf/plan.md`: Context, Decisions (settled), Approach, Files, Tests, Verification, Delivery and acceptance, Open questions, Risks. Keep or add `type:` and `areas:` in the frontmatter (see `item-backlog`). Things only real data can confirm go under `## Real-data checks` as `- [ ]` items. Set `status: planned` once the draft exists.
   With the plan, copy `tools/workbench/shared/tech-template.md` to `tools/workbench/backlog/<f>/tech.md` and fill it in the template's section order (Data flow, Modules, Components, Files with `### New` and `### Changed`, Interfaces: overview first, details further down; leave out a section that does not apply). Every diagram is Mermaid; `### New` / `### Changed` hold one backticked path per bullet. `vp run workbench:check` fails for an item at `planned` or later without it. A `size: small` item has no tech.md.
   Done when every section exists and every open point is a numbered question.

2. **Q&A, one topic at a time.** Give a 2–3 line catch-up on the topic, then ask at most 4 questions per round (AskUserQuestion when available), recommended option first, each option with a concrete example (label text, ASCII sketch, before/after numbers). Record each answer in the plan right away, quoted. Nothing but the plan changes.
   Done when the owner has answered or deferred every question of the topic.

3. **Spin off.** Adjacent work that surfaced becomes its own `idea` item folder via the `item-backlog` rules, never a plan section.

4. **Fact-check.** Spawn one `item-worker` to verify every `path:line`, file name and API the plan and its `tech.md` rely on against the current code (every `### Changed` path exists, every `### New` path sits where the plan creates it), and to list anything missing from Files or Tests. Fix the plan from its report; relay new questions as Q items.
   Done when the worker reports no mismatch. For `size: small`, skip the worker: verify every `path:line` of the plan yourself.

5. **Hand over.** When `## Open questions` has no `open` item, tell the owner in one line: "Plan has no open questions; set `status: ready` when you agree, then write "lets dev"." Rewrite `next:` (e.g. `Q&A on Q5–Q7`, `Owner sets ready`, `Implement on "lets dev"`).
