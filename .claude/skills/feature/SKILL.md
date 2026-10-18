---
name: feature
description: 'Entry point for all PaceVault feature work in workbench/. Reads a feature''s status and next line from workbench/<feature>/plan.md and hands over to the matching stage skill (feature-backlog, feature-explore, feature-plan, feature-implement, feature-review, feature-done). Use when the owner brings a new idea, says "continue <feature>", "where are we", "lets dev", or resumes feature work after a break or compaction.'
---

# Feature router

This skill only routes. All process rules live in the stage skills.

## Steps

1. **Resolve the feature.**
   - The owner named it, or the conversation is clearly about one `workbench/<feature>/` folder: use it.
   - "lets dev" without a name: route to `feature-implement` (it collects every `ready` plan itself).
   - "where are we" or no name: read the frontmatter of every `workbench/*/plan.md` (`grep -H -E '^(title|status|next):' workbench/*/plan.md`) and show one line per feature, grouped by status in board order (idea · exploring · planned · ready · in-dev · in-review), as `<title> · <next>`. Ask which one to continue.
   - A new idea with no folder: route to `feature-backlog`.

2. **Read `status:` and `next:`** of `workbench/<feature>/plan.md`. `next:` says where the last stage stopped; continue from it, not from a conversation summary.

3. **Invoke the stage skill** with the Skill tool, passing the feature folder and the `next:` line:

   | `status:`         | Stage skill                                                                   |
   | ----------------- | ----------------------------------------------------------------------------- |
   | (no folder)       | `feature-backlog`                                                             |
   | `idea`            | `feature-backlog`; `feature-explore` or `feature-plan` when the owner asks so |
   | `exploring`       | `feature-explore`                                                             |
   | `planned`         | `feature-plan`                                                                |
   | `ready`, `in-dev` | `feature-implement`                                                           |
   | `in-review`       | `feature-review`                                                              |
   | `done`            | `feature-done`                                                                |

4. **Invalid frontmatter** (missing or unknown `status:`): report the file and the problem to the owner; don't guess a stage.
