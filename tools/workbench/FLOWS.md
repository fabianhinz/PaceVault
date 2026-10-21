# Workbench flows

The `item*` skills, the `item-worker` agent, the hooks and the board as sequence diagrams, one per flow. The rules behind each step are in the skills (`.claude/skills/item*/SKILL.md`); this file only shows who talks to whom and in which order. The owner's view is `GUIDE.md`, the technical reference `README.md`.

| Participant    | What it is                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| **Owner**      | You: answers questions, sets `ready` and `done`, commits, reviews                                    |
| **Claude**     | The main session, running one stage skill (`item-backlog`, `-explore`, `-plan`, …)                   |
| **Worker**     | An `item-worker` subagent for one task; never sees the chat, never talks to the owner, no git writes |
| **Hooks**      | `statusGuard.ts`, `workerGitGuard.ts` (before a tool call), `indexHook.ts` (after an edit)           |
| **Item files** | `tools/workbench/backlog/<item>/`: `plan.md`, `tech.md`, `mockup/`, `research/`, `review/`           |
| **Board**      | `vp run workbench` on `http://localhost:4321`: shows, moves, ticks, answers and deletes              |

## 1. Lifecycle at a glance

Who moves an item between statuses. Dashed boxes are the owner's gates.

```mermaid
stateDiagram-v2
  state "in-dev" as in_dev
  state "in-review" as in_review
  state "ready (owner)" as ready
  state "done (owner)" as done

  [*] --> idea: item-backlog
  idea --> exploring: item-explore
  idea --> planned: item-plan
  exploring --> planned: item-plan writes the draft
  planned --> ready: Owner, Mark ready
  ready --> in_dev: "lets dev", item-implement
  in_dev --> in_review: item-review
  in_review --> in_dev: review round n
  in_review --> done: Owner, Mark done
  ready --> planned: plan rework
  in_dev --> planned: plan rework
  in_review --> planned: plan rework
  done --> [*]: item-done, cleanup

  classDef gate stroke-dasharray: 5 5
  class ready, done gate
```

## 2. Routing: `/item`

The router only reads `status:` and `next:` and hands over; it holds no process rules.

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Router as Claude (/item)
  participant Files as Item files
  participant Stage as Stage skill

  Owner->>Router: "new idea …" / "continue X" / "where are we" / "lets dev"
  alt new idea, no folder
    Router->>Stage: item-backlog
  else "lets dev" (or "lets dev, only X")
    Router->>Stage: item-implement, with X as the hold
  else "where are we"
    Router->>Files: title, status, type, next of every plan.md
    Router-->>Owner: one line per item, grouped by status
    Owner->>Router: picks an item
  end
  Router->>Files: read status and next of plan.md
  alt status missing or unknown
    Router-->>Owner: file and problem, no guessing
  else valid
    Router->>Stage: invoke by status, pass folder and next
  end
  Note over Router,Stage: idea → item-backlog (explore or plan on request)<br/>exploring → item-explore · planned → item-plan<br/>ready, in-dev → item-implement · in-review → item-review · done → item-done
```

## 3. Guardrails on every tool call

Runs under every flow below, for Claude and for workers alike. A blocked step is an owner step, never retried another way.

```mermaid
sequenceDiagram
  participant Agent as Claude or Worker
  participant Pre as PreToolUse hooks
  participant Tool as Edit / Write / Bash
  participant Post as indexHook
  participant Board

  Agent->>Pre: tool call
  Note right of Pre: statusGuard: status gates, owner-only ticks,<br/>decision kind, no backlog folder deletes<br/>workerGitGuard (Bash): no git writes from subagents
  alt blocked (exit 2)
    Pre-->>Agent: refused with the reason
    Note over Agent: goes under "Owner steps" in the review doc
  else allowed
    Pre->>Tool: run
    opt plan.md, tech.md or review/decisions.md edited
      Tool->>Post: after the edit
      Post-->>Agent: workbench:check problems, fix the named file
    end
    Tool--)Board: file watcher sends wb:changed, the board refetches in place
  end
```

## 4. Capture an idea: `item-backlog`

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Claude as Claude (item-backlog)
  participant Files as Item files
  participant Board

  Owner->>Claude: "new idea: …"
  opt idea unclear
    Claude-->>Owner: ask
    Owner->>Claude: clarifies
  end
  Claude->>Files: plan.md at status idea, type, areas, next, Idea (3 lines)
  opt a decision is needed first
    Claude->>Files: Q1 under Open questions
  end
  Files--)Board: new card in Idea (Q1 also under Needs you)
  Claude->>Claude: vp run workbench:check
  Claude-->>Owner: captured where, suggested next stage (explore or plan)
```

## 5. Explore a UI change: `item-explore`

Research and the mockup run in workers; every decision stays with the owner.

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Claude as Claude (item-explore)
  participant Research as Research workers
  participant Mockup as Mockup worker
  participant Files as Item files
  participant Board

  Claude->>Files: status exploring
  Claude->>Claude: read the components, ui pieces and stores the idea touches
  Claude-->>Owner: current state with path:line

  par one worker per topic, in the background
    Claude->>Research: research brief
    Research->>Files: research/topic.md
  end
  Claude->>Files: open questions as Q items in plan.md
  Claude-->>Owner: findings, 4–6 variants as ASCII sketches, recommendation
  Owner->>Claude: variants that go into the mockup

  Claude->>Mockup: full brief (it sees nothing of the chat)
  Mockup->>Files: mockup/index.html on the mockup shell
  Mockup-->>Claude: verified headless, variants, choices made, open questions

  loop feedback rounds, same agent via SendMessage
    Claude-->>Owner: table of variant, look, rationale, plus questions
    Owner->>Board: tries the mockup, Q badges show the plan's states
    Owner->>Claude: feedback
    Claude->>Mockup: remove settled or rejected variants, add new ones
  end

  loop at most 4 questions per round, one topic at a time
    Claude-->>Owner: question, recommended option first, concrete example
    alt picks an option
      Owner->>Claude: answer
      Claude->>Files: answered in plan.md, Owner quoted verbatim
    else "you decide"
      Claude->>Files: agent decision in review/decisions.md
    else "i don't get it"
      Claude-->>Owner: explain again with a more concrete example (stays open)
    end
  end

  Claude->>Files: next "Write the plan from the settled mockup"
  Claude->>Claude: invoke item-plan with the winner, the mockup path, the edge cases
```

## 6. Plan and Q&A: `item-plan`

Ends in a plan without open questions. The owner sets `ready`, commits and writes "lets dev".

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Claude as Claude (item-plan)
  participant Check as Fact-check worker
  participant Files as Item files
  participant Board

  Claude->>Files: plan.md draft, tech.md from tech-template.md
  Claude->>Files: status planned

  loop one topic at a time, at most 4 questions
    Claude-->>Owner: 2–3 line catch-up, questions with examples
    alt answered in the chat
      Owner->>Claude: picks an option
      Claude->>Files: answered with date, Owner quoted verbatim
    else answered on the board
      Owner->>Board: Needs you, Answer… dialog
      Board->>Files: writes the answer line
    else "you decide"
      Claude->>Files: agent decision in review/decisions.md
    else unclear
      Claude-->>Owner: explain again with a more concrete example (stays open)
    end
  end

  opt adjacent work surfaced
    Claude->>Files: new idea folder (item-backlog rules), never a plan section
  end

  Claude->>Check: verify every path:line, file and API of plan.md and tech.md
  Check-->>Claude: mismatches, missing files or tests
  Claude->>Files: fix the plan, new questions as Q items
  Claude->>Claude: vp run workbench:check
  Claude-->>Owner: "no open questions, set ready, then write lets dev"

  Owner->>Board: Mark ready (or drag the card onto Ready)
  Board->>Files: status ready
  Owner->>Owner: commit
  Owner->>Claude: "lets dev"
```

## 7. Implement: `item-implement`

After "lets dev" every `ready` plan is built back to back; nothing stops to ask.

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Claude as Claude (item-implement)
  participant Worker as Worker (one per plan)
  participant Capture as workbench:capture
  participant Files as Item files

  Owner->>Claude: "lets dev" (or "lets dev, only X")
  Claude->>Claude: git status --porcelain
  alt source dirty outside tools/workbench/backlog/
    Claude-->>Owner: dirty paths, commit first (no start)
  end
  Claude->>Files: collect ready (and leftover in-dev) plans, order by depends-on

  loop each item with a UI change, one after another
    Claude->>Files: review/capture.spec.ts from the template
    Claude->>Capture: WB_SHOTS=before
    Capture->>Files: review/before/*.png of the unchanged source
  end

  loop each plan in order, no stops
    Claude->>Files: status in-dev, next Implementing
    Claude->>Worker: plan path, tech.md New and Changed, full CLAUDE.md §5 suite
    Worker->>Worker: code and tests, vp run check, test, e2e, build
    Worker->>Files: agent decisions in review/decisions.md
    Worker-->>Claude: Done, Deviations, Agent decisions, Open questions, Verification
    opt a test fails
      alt listed in flaky.md
        Claude->>Claude: re-run once with --last-failed
      else caused by the change
        Claude->>Worker: SendMessage, fix it
      else not caused by the change
        Claude->>Files: Open points of the review doc
      end
    end
    alt the plan itself turns out wrong
      Claude->>Files: status planned, reason in the review doc
    else built
      Claude->>Claude: hand to item-review, round 1 (flow 8)
    end
  end

  Claude->>Claude: full §5 suite once more (later plans can break earlier ones)
  Claude-->>Owner: items in review, doc paths, new failures, owner steps, held items
```

## 8. Review round 1: `item-review`

```mermaid
sequenceDiagram
  autonumber
  participant Claude as Claude (item-review)
  participant Scripts as Workbench scripts
  participant Files as Item files
  actor Owner
  participant Board

  opt touches apps/web/src or packages/*/src
    Claude->>Scripts: vp run workbench:deps -- item
    Scripts->>Files: review/deps.mmd, deps.json (boundary violation goes to Open points)
  end
  opt New or Changed lists TypeScript files
    Claude->>Scripts: vp run workbench:interfaces -- item
    Scripts->>Files: review/interfaces.md (Tech tab, Actual side)
  end
  Claude->>Files: review/index.html from review-template.html
  Note right of Files: C1, C2, … · Changes without UI · Deviations<br/>Open points · Verification · How to check
  Claude->>Scripts: vp run workbench:capture -- review folder
  Scripts->>Files: review/after/*.png
  Claude->>Claude: every img exists, every PNG referenced
  Claude->>Files: decision sweep, replaced decisions marked superseded
  Claude->>Claude: vp run workbench:check
  Claude->>Files: status in-review, next "Owner reviews round 1"
  Claude-->>Owner: doc path, accept with Mark done or send R findings
  Owner->>Board: Review tab: doc, agent decisions, findings
```

## 9. Review round n: R-labelled findings

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Claude as Claude (item-review)
  participant Worker
  participant Scripts as Workbench scripts
  participant Files as Item files

  Owner->>Claude: R findings in the chat or in review/findings.md
  Claude->>Files: status in-dev, next "Review round n rework"
  Claude->>Files: review/after/ becomes review/before/

  loop sort each finding
    alt unclear
      Claude-->>Owner: question in the item-plan format
    else changes a settled plan decision
      Claude->>Files: recorded in plan.md, Owner quoted
      opt the approach must be replanned
        Claude->>Files: status planned, stop for this item
      end
    else a fix
      Note over Claude: collected for the worker
    end
  end

  Claude->>Worker: R items, plan path, smallest fix per item, full §5 suite
  Worker-->>Claude: report
  Claude->>Scripts: deps and interfaces (when they apply), capture
  Scripts->>Files: new review/after/*.png
  Claude->>Files: "Review round n" section above Changes, one R entry per finding
  Claude->>Files: decision sweep, status in-review
  Claude-->>Owner: doc path, accept with Mark done or send R findings
```

## 10. Accept and clean up: `item-done`

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Board
  participant Claude as Claude (item-done)
  participant Cleanup as workbench:cleanup
  participant Files as Item files

  Owner->>Board: tick agent decisions and real-data checks
  Owner->>Board: Mark done (in-review item)
  Board->>Files: status done
  Owner->>Claude: "clean up"
  Claude->>Claude: grep leftover references to the folder
  Claude->>Cleanup: vp run workbench:cleanup
  loop each done folder
    alt committed (or only the status line changed), no unticked decisions
      Cleanup->>Files: delete the folder
    else
      Cleanup-->>Claude: skipped, commit first or tick the decisions
    end
  end
  Files--)Board: cards disappear
  Claude-->>Owner: deleted, skipped and why, leftover references as path:line
```

## 11. A write from the board

Every tick, answer, drag or delete on the board. The board never commits.

```mermaid
sequenceDiagram
  autonumber
  actor Owner
  participant Board as Board (React island)
  participant Actions as Board actions (server)
  participant File as plan.md / decisions.md / findings.md

  Owner->>Board: tick, answer, drag, delete
  Board->>Actions: write, with the line as the board showed it
  Actions->>File: read the current line
  alt the line changed since the board rendered it
    Actions-->>Board: 409
    Board->>Actions: refetch, show the current file
  else the plan would fail workbench:check
    Actions-->>Board: refused
  else
    Actions->>File: change only that line
    Actions-->>Board: ok and diff
    Board-->>Owner: write card with the diff and Undo
    File--)Board: wb:changed, refetch
  end
```
