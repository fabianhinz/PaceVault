# Workbench: how to work with it

Everything about a feature lives in one folder, `workbench/<feature>/`: `plan.md`, `tech.md` (data flow, modules, interfaces and components as Mermaid diagrams; written with the plan from `_shared/tech-template.md`, required from `planned` on), `mockup/`, `review/`. The board is a local Astro site in `workbench/site/`: run `vp run workbench` and open the printed URL (`http://localhost:4321`). It reads the Markdown files on every request and reloads by itself when any of them changes, from the board, from Claude or from your editor.

## Talking to Claude

Start with `/feature` (or just say what you want). It reads the feature's status and its `next:` line and picks the right step.

| You say                                | What happens                                                             |
| -------------------------------------- | ------------------------------------------------------------------------ |
| "new idea: …"                          | A bullet in `ideas.md`, or a new folder at status `idea`                 |
| "explore <feature>"                    | Research + mockup rounds; questions appear as Q badges in the mockup     |
| "plan <feature>" / answering questions | The plan gets written; your answers are recorded word for word           |
| "lets dev"                             | Builds every `ready` plan: "before" screenshots, code, tests, full suite |
| R-labelled findings on a review        | A review round: fixes, new screenshots, a "Review round n" section       |
| "where are we" / "continue <feature>"  | Picks up from the plan's `next:` line, also after a break or compaction  |

## Your part

These steps are yours. Agents can't do them; a hook blocks them. The board writes the same lines you would write by hand (or edit the files yourself).

1. **Answer open questions.** The card shows "n open". In the Plan tab (or the Questions drawer next to the mockup) "Answer…" opens a dialog: pick an option and add your words, or "Comment, keep open" for "i don't get it" / "you decide"; you get a new explanation.
2. **Confirm agent decisions.** The card shows "n agent calls". Tick the box in the Plan tab. To overrule one, tell an agent.
3. **Start development.** Drag the card onto Ready (refused while questions are open), commit, then write "lets dev".
4. **Review.** Open the Review tab and send R-labelled findings to an agent; they land in `review/findings.md`.
5. **Accept.** Tick the real-data checks, then delete the card (bin next to its title). That is done: the folder moves to `workbench/.trash/` (git-ignored), git history keeps it. Setting `status: done` by hand works too; `vp run workbench:cleanup` deletes those folders.

## The board

The board shows, moves status, ticks, answers and deletes. To create or edit anything (an idea, a plan, a check, a question, a finding), ask an agent.

- Click a card for Mockup · Plan · Tech · Review (missing ones greyed; Mockup opens first). `[` and `]` (or the side peeks) step through the same column. Esc closes.
- Drag a card onto another column to set its status; columns it can't go to are dimmed. Done is no column: deleting the card finishes the feature.
- The bin deletes: a card, an Inbox bullet, a real-data check, an agent decision, a question (with its comments), a finding, a flaky entry. It writes at once; the toast shows the change with Undo.
- The Tech tab draws `tech.md` (Mermaid with ELK); Modules switches between the planned graph and the actual one from `review/deps.mmd`. Each diagram has Fit · Zoom and a full-size view.
- **Inbox** is `ideas.md` (To decide, To investigate, Loose ideas; "Decided by agents" collapsed).
- Known-flaky tests are listed in `flaky.md` (footer link); only you remove entries.
- A red banner at the top lists `workbench:check` errors; a plan named there is missing from the board or shown in an older state until it is fixed.

If a file changed since the board showed it (an agent edited it), a write is refused and the board reloads. The board never commits.

Statuses: `idea → exploring → planned → ready → in-dev → in-review → done`. Agents move forward, and back only from review to `in-dev` or to `planned`.

## Commands

```bash
vp run workbench                  # the board on http://localhost:4321 (astro dev)
vp run workbench:check            # astro sync + astro check, then plans, questions, mockup ↔ plan labels and tech.md presence
vp run workbench:capture -- workbench/<f>/review   # re-take review screenshots
vp run workbench:deps -- <f>      # actual import graph + boundary check → <f>/review/deps.mmd, deps.json
vp run workbench:cleanup          # delete committed `done` folders
```
