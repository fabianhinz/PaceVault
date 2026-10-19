---
title: Memory rules to skills
status: idea
created: 2026-10-19
type: chore
areas: [skills]
next: Owner answers Q1
---

# Memory rules into the workflow skills

## Idea

The workflow skills (`.claude/skills/item*`) and the `item-worker` agent reference `feedback_*` memory files (e.g. `feedback_lets_dev_gate`, `feedback_no_commits`), which live outside the repo. From the ideas.md "To decide" list.

## Open questions

- **Q1** · open · Move all `feedback_*` memory rules into the skills? (a) yes, all of them, and drop the memory files (b) only the rules the skills cite (c) keep them in memory
