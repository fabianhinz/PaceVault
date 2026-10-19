# Workbench: technical reference

How to work with the backlog as the owner (statuses, gates, your part, the board): [`GUIDE.md`](GUIDE.md), also behind the info button at the top right of the board. This file is the technical reference: layout, files, hooks and commands.

Everything about a backlog item (feature, bug or chore) lives in one folder, `tools/workbench/backlog/<item>/`: `plan.md`, `tech.md` (data flow, modules, interfaces and components as Mermaid diagrams; written with the plan from `shared/tech-template.md`, required from `planned` on), `mockup/`, `research/`, `review/` (`index.html`, `findings.md`, `decisions.md`, screenshots). Next to the items, `backlog/` holds `flaky.md` (known-flaky tests). The board is a local Astro site in `site/`: run `vp run workbench` and open the printed URL (`http://localhost:4321`). It reads the Markdown files on every request and reloads by itself when any of them changes.

## Layout

| Path       | What it is                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `backlog/` | The items and `flaky.md`                                                                        |
| `site/`    | The board (Astro, `astro dev --root site`)                                                      |
| `scripts/` | `check.ts` (plan rules), `frontmatter.ts` (plan reader), `cleanup.ts`, `deps.ts`, and the hooks |
| `shared/`  | Mockup shell, review template and CSS, `capture.ts` helpers, `tech-template.md`                 |
| `tests/`   | Vitest specs for the scripts, hooks and the board (write-back, Needs you, type and areas)       |
| `GUIDE.md` | The owner's guide, shown on the board                                                           |

## Item files

- `plan.md` frontmatter: `title`, `status`, `created`, `next`, `type: feature | bug | chore` and `areas: [<area>, …]` (at least one of `app` (`apps/web`)/`engine`/`gpx`/`ui`/`i18n`/`testing`/`workbench`/`docs`/`repo`/`skills`, no duplicates; `ITEM_TYPES`/`AREAS` in `scripts/frontmatter.ts`), both required for every status except `done` (done items from before the split stay valid without them), optional `depends-on: [<folder>]`. The card shows the type as an icon in a fixed colour (`TYPE_COLOR` in `site/src/lib/board.ts`) and the areas as a muted line that wraps. Tracked sections: `## Open questions` and `## Real-data checks`.
- `review/decisions.md`: `## Agent decisions` with `- [ ] **<decision>.** Agent: <reason>` items. Created by the first agent decision, also before a review doc exists. Only the owner ticks or removes an item.
- `review/findings.md`: `## Round n` with `- **Rn** · open · on <entry> · …` items.
- The Review tab exists as soon as `review/index.html`, `findings.md` or `decisions.md` exists; it shows the doc only when `index.html` exists.

## Hooks

`.claude/settings.json` runs three scripts from `scripts/`:

- `statusGuard.ts` (PreToolUse, Edit/Write/Bash): keeps agents inside the status gates of `backlog/<item>/plan.md`, keeps `## Real-data checks` (plan.md) and `## Agent decisions` (`review/decisions.md`) owner-ticked, and blocks Bash writes to those two files and deleting a backlog folder.
- `workerGitGuard.ts` (PreToolUse, Bash): subagents never run git writes.
- `indexHook.ts` (PostToolUse, Edit/Write): after an edit of a `backlog/<item>/plan.md`, `tech.md` or `review/decisions.md` it runs the plan rules and returns every problem to Claude.

## Skills

The workflow skills live in `.claude/skills/item*`: `item` (the router, `/item`), `item-backlog`, `item-explore`, `item-plan`, `item-implement`, `item-review`, `item-done`. They spawn the `item-worker` agent (`.claude/agents/item-worker.md`).

## Board internals

- `site/src/lib/board.ts` reads each item (`readItem`) and derives the Needs you column (`needsYou`: open questions, unticked agent decisions, open findings; a done item only for agent decisions).
- `site/src/actions/index.ts` holds the writes (status, ticks, answers, deletes, Undo). Each write changes only the lines it names, refuses when they are not as the board rendered them (409, the board reloads) or when the plan would fail `workbench:check`.
- `site/src/content.config.ts` watches `*/plan.md`, `*/tech.md`, `flaky.md`, `*/review/findings.md`, `*/review/decisions.md` and `GUIDE.md`, so an edit reloads the board.

## Commands

```bash
vp run workbench                  # the board on http://localhost:4321 (astro dev)
vp run workbench:check            # check (astro sync + astro check) and plans:check (plans, questions, mockup ↔ plan labels, tech.md presence, agent-decision format)
vp run workbench:capture -- backlog/<item>/review   # re-take review screenshots (app on 5176, board on 4321)
vp run workbench:deps -- <item>   # actual import graph + boundary check → <item>/review/deps.mmd, deps.json (items that touch apps/web/src or packages/*/src)
vp run workbench:cleanup          # delete committed `done` folders without unticked agent decisions
```

Inside the package (`tools/workbench/`):

```bash
vp run check         # astro sync + astro check (part of the root `vp run check`)
vp run plans:check   # the plan rules only (not part of the code suite)
vp test -- --run     # tests/
```
