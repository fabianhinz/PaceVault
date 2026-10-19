---
name: item-done
description: 'Cleans up a PaceVault backlog item the owner has accepted (Done on the board, or status done in tools/workbench/backlog/<item>/plan.md): reports leftover references and deletes a done folder via vp run workbench:cleanup. Use when an item is at status done, the owner says "clean up", or asks to clean up accepted items. Usually reached through the item router. Never for an item that is not yet done.'
---

# Item done

Acceptance is the owner's: they press Done on the in-review card on the board (it sets `status: done`), or set `status: done` by hand. There is no trash. This skill only cleans up after it; the board never deletes done folders.

## Standing rules

- Run only when the owner accepted: its plan has `status: done`; never set it yourself. Otherwise tell the owner in one line that only they can accept it: press Done on the in-review card on the board.
- Never commit (`feedback_no_commits`); the deletion stays in the working tree for the owner.
- Workbench paths override path mentions in memory files.

## Steps

1. **Find leftover references.** `grep -rn "tools/workbench/backlog/<f>/" --exclude-dir=node_modules --exclude-dir=.git . | grep -v "^./tools/workbench/backlog/<f>/"` (code comments, other plans, tests). Report each as `path:line`; don't edit them unless the owner asks.

2. **Clean up.** Run `vp run workbench:cleanup`. It deletes every `done` folder that is committed or whose only uncommitted change is the `status:` line in `plan.md` (so the owner's `done` flip needs no extra commit), and skips folders with any other uncommitted change or with unticked agent decisions in `review/decisions.md` (warning: "tick or delete the agent decisions first"). The board picks up the deletion by itself.

3. **Report** in a few lines: which folders were deleted, which were skipped and why (commit first, or tick or delete the agent decisions on the Review tab, then rerun), and the leftover references from step 1.
