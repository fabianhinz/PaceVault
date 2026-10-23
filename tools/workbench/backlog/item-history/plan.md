---
title: Item history
status: idea
created: 2026-10-23
type: chore
areas: [workbench, skills, repo]
next: 'Owner decides: plan directly'
---

# Harvest a short dated summary before a done item is cleaned up

## Idea

`vp run workbench:cleanup` deletes the whole item folder (`tools/workbench/scripts/cleanup.ts:121`), so owner answers, confirmed agent decisions, research and handovers survive only in git history.
Add a step to `item-done` before the cleanup: write a short dated summary per item to `docs/decisions/` (what was built, which behaviour is intended and why, the key owner decisions, where to dig deeper), owner confirms, then cleanup. No new rules, TDRs or `CLAUDE.md` edits. Gate: `workbench:cleanup` refuses to delete a done folder without its twin in `docs/decisions/`; even a tiny item gets one, so every item leaves a datapoint.
Purpose: future agents and users can tell whether something is on purpose or a bug. Code may drift; a newer item's decision overrides an older one.

## Open questions
