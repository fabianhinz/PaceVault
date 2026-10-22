# How to work with the backlog

Every backlog item (a feature, a bug, a chore) is one folder, `tools/workbench/backlog/<item>/`, and one card on the board. Start in the chat with `/item` or just say what you want: Claude reads the item's `status:` and `next:` line and picks the step, also after a break ("where are we", "continue `<item>`"). Every flow as a sequence diagram: `tools/workbench/FLOWS.md`; layout, hooks and commands: `tools/workbench/README.md`.

## Step by step

| Status                | You                                                                                                                                         | Claude                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| idea                  | Say "new idea: …". Then "explore `<item>`" for a UI change without a settled design, otherwise "plan `<item>`".                             | Opens the folder with type and areas. No research yet.                                                                                 |
| exploring             | Pick the variants for the mockup, try it on the Mockup tab, give feedback, answer the questions.                                            | Researches, shows 4–6 variants as sketches, has a mockup built and reworks it until you call it settled.                               |
| planned               | Answer the open questions, in the chat or with Needs you › Answer…. Then press **Mark ready** (or drag the card onto Ready).                | Writes `plan.md` and `tech.md` (no `tech.md` for `size: small`), asks at most 4 questions per round, has a worker fact-check the plan. |
| **ready** · your gate | Commit, then write "lets dev" (or "lets dev, only `<item>`").                                                                               | Waits: `ready` alone starts nothing.                                                                                                   |
| in-dev                | Nothing: the run doesn't stop to ask. Questions land in the review doc.                                                                     | Takes "before" screenshots, builds every `ready` plan in order, runs the full suite.                                                   |
| in-review             | Open the Review tab: review doc, agent decisions, findings. Send R-labelled findings, or tick the real-data checks and press **Mark done**. | Writes the review doc with before/after shots. Each round of findings goes back to `in-dev` and returns here.                          |
| **done** · your gate  | Commit, then say "clean up". Dragging the card back to In review undoes done.                                                               | Deletes done folders that are committed and have no unticked agent decisions; reports what it skipped.                                 |

## Rules that always hold

- Fast lane: add `size: small` to a one-line bug or chore (only you set it; Claude may suggest it). It skips `tech.md`, the fact-check and the deps graph, runs the suite once, and its review doc has only Changes, Verification and How to check (before/after shots for UI bugs). The card shows it tinted and outlined.
- `ready` and `done` are yours (the two Gate columns with a lock). A hook keeps agents from setting them, from ticking real-data checks or agent decisions, and from deleting a folder.
- Agents move items forward, and back only to `in-dev` (a review round) or to `planned` (the plan needs rework, from ready, in-dev or in-review; it then needs your Mark ready again).
- Your answers are recorded word for word. "i don't get it" keeps a question open (Answer… › Comment, keep open); "you decide" turns it into an agent decision.
- Agent decisions wait under Needs you › Agent decisions: tick one to confirm it, tell an agent to overrule it. Each names its kind first (behaviour, look or scope); replaced ones wait behind "N superseded".
- To create or edit anything, ask an agent. The board only shows, moves, ticks, answers and deletes. Nobody but you commits.

## The board

- **Needs you** (left) lists what waits on you: open questions, unticked agent decisions, open review findings. An entry opens the item on the right tab. **Flaky tests** below lists `flaky.md`; only you remove entries.
- **Cards** show the type as an icon (`feature` sky, `bug` rose, `chore` lime) and the areas the item touches below the title.
- **The panel** opens on the right: tabs Mockup · Plan · Tech · Review, Expand and Close top right. Its footer has **Delete item** on the left and **Mark ready** or **Mark done** on the right.
- **Drag** a card onto another column to set its status; columns it can't go to are dimmed. **The bin** deletes a single line; every write shows a card bottom right with Undo.
- **A red banner** at the top lists `workbench:check` errors; a plan named there is missing or shown in an older state until it is fixed.
- A write is refused when the file changed since the board showed it; the board then shows the current file.
