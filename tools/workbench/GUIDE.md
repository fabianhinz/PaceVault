# How to work with the backlog

Every backlog item (a feature, a bug, a chore) is one folder, `tools/workbench/backlog/<item>/`, and one card on the board (`vp run workbench`, `http://localhost:4321`). The board reloads by itself when a file changes, from the board, from Claude or from your editor. The technical reference (layout, hooks, commands) is `tools/workbench/README.md`.

## Statuses and gates

`idea → exploring → planned → ready → in-dev → in-review → done`

- Agents move an item forward, and back only from review to `in-dev` or to `planned`.
- `ready` and `done` are yours (the two tinted columns with a lock). Agents can't set them; a hook blocks it.
- `ready` needs a plan without open questions. Writing "lets dev" in the chat starts the work on every `ready` item.

## Talking to Claude

Start with `/item` (or just say what you want). It reads the item's `status:` and `next:` line and picks the step.

| You say                               | What happens                                                             |
| ------------------------------------- | ------------------------------------------------------------------------ |
| "new idea: …"                         | A new folder at status `idea`, with its type and areas                   |
| "explore `<item>`"                    | Research and mockup rounds; questions appear as Q badges in the mockup   |
| "plan `<item>`" / answering questions | The plan gets written; your answers are recorded word for word           |
| "lets dev"                            | Builds every `ready` plan: "before" screenshots, code, tests, full suite |
| "lets dev, only `<item>`"             | Builds that item only; the other `ready` items wait                      |
| R-labelled findings on a review       | A review round: fixes, new screenshots, a "Review round n" section       |
| "where are we" / "continue `<item>`"  | Picks up from the plan's `next:` line, also after a break or compaction  |
| "clean up"                            | Deletes the committed `done` folders (`vp run workbench:cleanup`)        |

To create or edit anything (an idea, a plan, a check, a question, a finding, a type or area), ask an agent. The board only shows, moves, ticks, answers and deletes.

## Your part

1. **Answer open questions.** Needs you › Open questions opens the card on its Plan tab. "Answer…" opens a dialog: pick an option and add your words, or "Comment, keep open" for "i don't get it" / "you decide".
2. **Confirm agent decisions.** Needs you › Agent decisions opens the card on its Review tab. Tick a decision to confirm it; to overrule one, tell an agent.
3. **Start development.** Drag the card onto Ready (refused while questions are open), commit, then write "lets dev".
4. **Review.** Open the card in the In review column; its Review tab holds the review doc, the agent decisions and the findings. Send R-labelled findings to an agent; they land in `review/findings.md`.
5. **Accept.** Tick the real-data checks, then press **Done** next to the title of the in-review card. The card moves to the Done column; dragging it back to In review undoes it.
6. **Clean up.** Say "clean up" in the chat. Done folders with unticked agent decisions are skipped until you tick or delete them.

## The board

- **Needs you** (left column) lists what waits on you: open questions, unticked agent decisions, open review findings (items in review have their own column). An entry opens the card on the right tab. Done items show up only while they have unticked agent decisions. Below, **Flaky tests** lists `flaky.md` while it has entries (agents re-run a listed test once); fix the test or remove the entry, only you remove entries.
- **Cards** show the type as an icon before the title (`feature` sparkles in sky, `bug` a bug in rose, `chore` a wrench in lime) and, below the title, the areas the item touches as a muted line that wraps (`app` for `apps/web`, the PWA that ships; `engine`, `gpx`, `ui`, `i18n`, `testing`, `workbench`, `docs`, `repo`, `skills`).
- **The dialog** has Mockup · Plan · Tech · Review; missing ones are greyed. `[` and `]` (or the side peeks) step through the same column. Esc closes.
- **Drag** a card onto another column to set its status; columns it can't go to are dimmed.
- **The bin** deletes a card (its folder, no trash), a real-data check, an agent decision, a question, a finding or a flaky entry. It writes at once; the toast shows the change with Undo. A deleted folder is held for Undo until the next delete or a dev-server restart.
- **A red banner** at the top lists `workbench:check` errors; a plan named there is missing from the board or shown in an older state until it is fixed.
- If a file changed since the board showed it, a write is refused and the board reloads. The board never commits.
