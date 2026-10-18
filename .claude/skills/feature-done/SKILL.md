---
name: feature-done
description: 'Cleans up a PaceVault feature the owner has accepted (card deleted on the board, or status done in workbench/<feature>/plan.md): reports leftover references and deletes a done folder via vp run workbench:cleanup. Use when a feature is at status done, its card was deleted, or the owner asks to clean up accepted features. Usually reached through the feature router. Never for a feature that is not yet done.'
---

# Feature done

Acceptance is the owner's: they delete the card on the board (the folder moves to the git-ignored `workbench/.trash/`), or set `status: done` by hand. This skill only cleans up after it.

## Standing rules

- Run only when the owner accepted: the folder is gone from `workbench/` (card deleted) or its plan has `status: done`; never set it yourself. Otherwise tell the owner in one line that only they can accept it: delete the card on the board.
- Never commit (`feedback_no_commits`); the deletion stays in the working tree for the owner.
- Workbench paths override path mentions in memory files.

## Steps

1. **Find leftover references.** `grep -rn "workbench/<f>/" --exclude-dir=node_modules --exclude-dir=.git . | grep -v "^./workbench/<f>/"` (code comments, other plans, tests). Report each as `path:line`; don't edit them unless the owner asks.

2. **Clean up.** A card deleted on the board needs nothing more (the owner commits the deletion). For `status: done` set by hand, run `vp run workbench:cleanup`. It deletes every `done` folder that is committed or whose only uncommitted change is the `status:` line in `plan.md` (so the owner's `done` flip needs no extra commit), and skips folders with any other uncommitted change (warning). The board picks up the deletion by itself.

3. **Report** in a few lines: which folders were deleted, which were skipped and why (commit first, then rerun), and the leftover references from step 1.
