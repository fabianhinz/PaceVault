---
name: item
description: 'Entry point for all PaceVault backlog work (features, bugs, chores) in tools/workbench/backlog/. Reads an item''s status and next line from tools/workbench/backlog/<item>/plan.md and hands over to the matching stage skill (item-backlog, item-explore, item-plan, item-implement, item-review, item-done). Use when the owner brings a new idea, says "continue <item>", "where are we", "lets dev", or resumes backlog work after a break or compaction.'
---

# Item router

This skill only routes. All process rules live in the stage skills.

## Steps

1. **Resolve the item.**
   - The owner named it, or the conversation is clearly about one `tools/workbench/backlog/<item>/` folder: use it.
   - "lets dev" without a name: route to `item-implement` (it collects every `ready` plan itself). "lets dev, only <item>": route to `item-implement` with that item as the hold.
   - "where are we" or no name: read the frontmatter of every `tools/workbench/backlog/*/plan.md` (`grep -H -E '^(title|status|type|next):' tools/workbench/backlog/*/plan.md`) and show one line per item, grouped by status in board order (idea · exploring · planned · ready · in-dev · in-review), as `<title> · <next>`. Ask which one to continue.
   - A new idea with no folder: route to `item-backlog`.

2. **Read `status:` and `next:`** of `tools/workbench/backlog/<item>/plan.md`. `next:` says where the last stage stopped; continue from it, not from a conversation summary.

3. **Invoke the stage skill** with the Skill tool, passing the item folder and the `next:` line:

   | `status:`         | Stage skill                                                          |
   | ----------------- | -------------------------------------------------------------------- |
   | (no folder)       | `item-backlog`                                                       |
   | `idea`            | `item-backlog`; `item-explore` or `item-plan` when the owner asks so |
   | `exploring`       | `item-explore`                                                       |
   | `planned`         | `item-plan`                                                          |
   | `ready`, `in-dev` | `item-implement`                                                     |
   | `in-review`       | `item-review`                                                        |
   | `done`            | `item-done`                                                          |

4. **Invalid frontmatter** (missing or unknown `status:`): report the file and the problem to the owner; don't guess a stage.
