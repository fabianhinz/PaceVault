---
name: feature-backlog
description: 'Captures a new PaceVault idea or triages workbench/ideas.md: adds a loose idea as a bullet, or opens a workbench/<feature>/ folder with a plan.md at status idea. Use when the owner brings a new idea, wants to sort the inbox, or promotes an ideas.md bullet to a feature. Usually reached through the feature router. Not for planning or exploring an existing feature.'
---

# Feature backlog

Intake only: capture, sort, open a folder. No research, no mockups, no plan content beyond the idea.

## Standing rules

- The board (`vp run workbench`, Astro in `workbench/site/`) reads the files on every request and reloads by itself; there is nothing to regenerate. A `PostToolUse` hook runs the `workbench:check` rules after every Edit/Write of a `plan.md`, `tech.md` or `ideas.md` and reports errors at once. Before handing over, run `vp run workbench:check` (frontmatter, question rules, mockup ↔ plan); it must pass. If the hook reports an error, fix the file it names.
- Status moves only as the status guard allows. A new `plan.md` starts at `status: idea`. `ready` and `done` are owner-only: propose them in one line, never set them.
- Never tick a `- [ ]` item; never commit (`feedback_no_commits`).
- Every `path:line` you write is verified against the current file.
- Workbench paths override path mentions in memory files.
- Keep it terse (`feedback_terse_plans`) and scoped (`feedback_scoped_branches`): one idea per entry, no adjacent improvements folded in.

## Steps

1. **Decide where the idea goes.** Ask the owner when it isn't clear.
   - **Loose idea** (no folder yet): one bullet with a bold lead in the matching `workbench/ideas.md` section: `## To decide` (needs an owner decision), `## To investigate` (needs facts first), `## Loose ideas` (anything else). Format: `- **<short lead>:** <what, where (path:line), next step>`. `## Decided by agents` is not an inbox section.
   - **Feature** (worth its own folder): step 2.
   - **Promote a bullet**: step 2, then delete the bullet from `ideas.md`.

2. **Open the folder.** Create `workbench/<kebab-name>/plan.md`:

   ```markdown
   ---
   title: <short card title, 1–3 words>
   status: idea
   created: <today, YYYY-MM-DD>
   next: <one line, e.g. "Owner decides: explore the UI or plan directly">
   ---

   # <long title>

   ## Idea

   <3 lines max: what, where (path:line), why>

   ## Open questions
   ```

   Add `depends-on: [<folder>]` only when the owner names a dependency. `## Open questions` stays even when empty.

3. **Hand over.** Tell the owner in one line what was captured and where, and the next stage you'd suggest (`feature-explore` for a UI change without a settled design, `feature-plan` otherwise). `next:` already says it.
