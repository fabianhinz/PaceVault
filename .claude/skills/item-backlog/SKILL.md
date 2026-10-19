---
name: item-backlog
description: 'Captures a new PaceVault backlog item (feature, bug, chore) as a tools/workbench/backlog/<item>/ folder with a plan.md at status idea with its type and areas. Use when the owner brings a new idea, or a spin-off from another item needs its own card. Usually reached through the item router. Not for planning or exploring an existing item.'
---

# Item backlog

Intake only: open a folder. No research, no mockups, no plan content beyond the idea. Every idea is an item folder; there is no ideas list.

## Standing rules

- The board (`vp run workbench`, Astro in `tools/workbench/site/`) reads the files on every request and reloads by itself; there is nothing to regenerate. A `PostToolUse` hook runs the `workbench:check` rules after every Edit/Write of a `plan.md`, `tech.md` or `review/decisions.md` and reports errors at once. Before handing over, run `vp run workbench:check` (frontmatter, type and areas, question rules, mockup ↔ plan); it must pass. If the hook reports an error, fix the file it names.
- Status moves only as the status guard allows. A new `plan.md` starts at `status: idea`. `ready` and `done` are owner-only: propose them in one line, never set them.
- Never tick a `- [ ]` item; never commit (`feedback_no_commits`).
- Every `path:line` you write is verified against the current file.
- Workbench paths override path mentions in memory files.
- Keep it terse (`feedback_terse_plans`) and scoped (`feedback_scoped_branches`): one idea per item, no adjacent improvements folded in.

## Steps

1. **Name it.** A kebab-case folder name and a 1–3 word card title. When the idea needs an owner decision before anything else, that decision is `Q1` in `## Open questions` (format of `item-plan`), so the card shows up under Needs you › Open questions. Ask the owner when the idea isn't clear.

2. **Open the folder.** Create `tools/workbench/backlog/<kebab-name>/plan.md`:

   ```markdown
   ---
   title: <short card title, 1–3 words>
   status: idea
   created: <today, YYYY-MM-DD>
   type: <feature | bug | chore>
   areas: [<area>, …]
   next: '<one line, e.g. Owner decides: explore the UI or plan directly>'
   ---

   # <long title>

   ## Idea

   <3 lines max: what, where (path:line), why>

   ## Open questions
   ```

   `type`: exactly one of `feature`, `bug`, `chore`. `areas`: at least one, the workspace parts the item touches: `app` (apps/web, the PWA we ship), `engine`, `gpx`, `ui`, `i18n`, `testing` (packages/*), `workbench` (board, scripts, hooks), `docs` (tools/docs), `repo` (root workspace config), `skills` (`.claude/`). List the areas the item mainly changes, not every file it brushes, each once. Nothing else is allowed; `workbench:check` reports a missing or unknown type, a missing, empty, unknown or duplicate area (both are required for every status except `done`; the lists are `ITEM_TYPES`/`AREAS` in `tools/workbench/scripts/frontmatter.ts`). Add `depends-on: [<folder>]` only when the owner names a dependency. `## Open questions` stays even when empty.

3. **Hand over.** Tell the owner in one line what was captured and where, and the next stage you'd suggest (`item-explore` for a UI change without a settled design, `item-plan` otherwise). `next:` already says it.
