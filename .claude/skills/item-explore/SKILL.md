---
name: item-explore
description: 'Explores design variants for a PaceVault UI change through research subagents and an interactive HTML mockup on the workbench mockup shell (tools/workbench/backlog/<item>/mockup/index.html), then hands the settled direction to item-plan. Use when the owner wants to explore, compare or rethink how a screen, chart, panel or flow looks or behaves and no design has been chosen yet, or when an item is at status exploring. Not for UI changes whose design is already settled (item-plan) and not for bug fixes.'
---

# Explore a UI idea before planning

The owner decides; you research, mock up, relay and ask. This skill ends in a settled direction handed to `item-plan`, not in code.

## Standing rules

- Every design decision goes to the owner, in rounds of at most 4 questions, one topic at a time, recommended option first, each with a concrete example (ASCII sketch, label text, before/after). A decision is settled only when the owner settles it; one handed to you ("you decide") goes to `tools/workbench/backlog/<f>/review/decisions.md` (`## Agent decisions`, format of `item-plan`: only what changes behaviour, look or scope, with its kind first; a replaced one becomes `[~] … Superseded by: <pointer>`).
- Questions live in the plan's `## Open questions` in the `item-plan` format (`- **Q3** · open · …` / `- **Q3** · answered <date> · … → (a) …. Owner: "<verbatim>"`). A reply that doesn't pick an option ("i don't get it") keeps the question open: explain again with a more concrete example. The mockup's `decisions[]` list these IDs with a short title (`{ id, title }`); the badges and the Questions tab read the states from the plan through the board.
- No code before "lets dev" (root `CLAUDE.md` §5). Answers update the plan and the mockup, nothing else.
- Workers are spawned as `subagent_type: "item-worker"` (no git writes, no status changes). They write only inside `tools/workbench/backlog/<f>/mockup/` or `tools/workbench/backlog/<f>/research/` and start no dev or preview servers.
- The board (`vp run workbench`, Astro in `tools/workbench/site/`) reads the files through the dev server and updates by itself; there is nothing to regenerate. A `PostToolUse` hook runs the `workbench:check` rules after every Edit/Write of a `plan.md`, `tech.md` or `review/decisions.md` and reports errors at once. Before handing over, run `vp run workbench:check` (frontmatter, question rules, mockup ↔ plan); it must pass.
- Status moves only as the status guard allows: `idea → exploring` at the start, `exploring → planned` when `item-plan` writes the draft. `ready` and `done` are owner-only: propose them in one line.
- Never tick a `- [ ]` item; never commit (root `CLAUDE.md` §5).
- Every code reference you relay or write is a `path:line` verified against the current file.
- Design rules the briefs carry: the UI rules of `apps/web/CLAUDE.md` (no `prefers-reduced-motion` handling, banners at the very top of the page, same action in the same place at every width) and the tone of `packages/i18n/CLAUDE.md` (copy states facts, never sells).

## Paths

- Plan: `tools/workbench/backlog/<f>/plan.md` (no folder yet → create it first with the `item-backlog` rules).
- Research reports: `tools/workbench/backlog/<f>/research/<topic>.md`.
- Mockup: `tools/workbench/backlog/<f>/mockup/index.html`, on the shell `tools/workbench/shared/mockup-shell.css` + `.js`. Worked example: `.claude/skills/item-explore/references/mockup-example.html` (copy it to the mockup path first; its `../../../shared/` links only resolve there).

## Progress

```
- [ ] 1. Current state summarised
- [ ] 2. Research relayed
- [ ] 3. Mockup built and verified
- [ ] 4. Feedback rounds done
- [ ] 5. Decisions settled
- [ ] 6. Handed to item-plan
```

## Steps

1. **Understand what is there.** Set `status: exploring`. Read the code the idea touches yourself: the components, the `packages/ui/src/components/` (`@pacevault/ui`) pieces they use, the stores they read. Summarise the current state to the owner in a few lines with `path:line` references.
   Done when the owner has the summary and every component the idea would change is named in it.

2. **Research.** Brief one `item-worker` per independent topic with [references/research-prompt.md](references/research-prompt.md), in the background, in parallel. Each writes its report to `tools/workbench/backlog/<f>/research/<topic>.md`. Relay a short summary of the findings, the shortlist, the open questions (as Q items in the plan) and your own recommendation, marked as one.
   Done when the owner has seen the 4–6 shortlisted variants with ASCII sketches and the open questions, and has said which variants go into the mockup.

3. **Mockup.** Brief one `item-worker` with [references/mockup-prompt.md](references/mockup-prompt.md). It sees nothing of this conversation, so the brief carries everything: the current-state summary, the shortlisted variants, the owner's answers, the plan path and the current Q items. The brief requires the shell: link `../../../shared/mockup-shell.css` + `.js`, declare the controls in `mockup-config`, put the screen in `<template id="mockup-screen">`, Q labels as `data-q` + `decisions[]`; no own toolbar, frames or notes panel; start from `references/mockup-example.html`. Keep its agent ID; every later round goes to the same agent.
   Done when `tools/workbench/backlog/<f>/mockup/index.html` exists, the agent reports it verified headless (shell frame scale ≥ 0.86, or 1:1 with the stage scrolling; no page-level scroll; every variant and scenario switched), its temp files are gone, and its report lists each variant, the choices it made where the brief was ambiguous, and its open questions.

4. **Iterate in rounds.** Relay each report as a short table (variant, what it looks like, one-line rationale) plus the open questions. Collect feedback, then resume the same agent with SendMessage: first remove settled or rejected variants and their code, then add the new ones. Pass on explicitly any decision the owner hands to the agent.
   Done when the owner says the direction is settled.

5. **Settle decisions.** Ask everything still open across research, mockup and feedback, as in the standing rules. Record each answer in the plan (quoted); the mockup's badge and Questions tab show it from the plan, there is nothing to flip in `decisions[]`.
   Done when no question that changes what gets built is still open.

6. **Hand over.** Rewrite `next:` (e.g. `Write the plan from the settled mockup`) and invoke `item-plan` with: the variants compared, the winner and why, the mockup path, and the edge cases its scenarios showed (missing data, loading, many items, 0 vs missing).
