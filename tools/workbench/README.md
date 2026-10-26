# Workbench: technical reference

How to work with the backlog as the owner (statuses, gates, your part, the board): [`GUIDE.md`](GUIDE.md), also behind the info button in the head of the Needs you column on the board. This file is the technical reference: layout, files, hooks and commands.

Everything about a backlog item (feature, bug or chore) lives in one folder, `tools/workbench/backlog/<item>/`: `plan.md`, `tech.md` (data flow, modules, interfaces and components as Mermaid diagrams; written with the plan from `shared/tech-template.md`, required from `planned` on except for `size: small`), `mockup/`, `research/`, `review/` (`index.html`, `findings.md`, `decisions.md`, `deps.mmd`/`deps.json`, `components.mmd`, `files.json` and `interfaces.md` from `workbench:deps`, the Actual sides of the Tech tab's per-section Planned | Actual switches, screenshots). Next to the items, `backlog/` holds `flaky.md` (known-flaky tests). The board is a local Astro site in `site/` with one React island on `@pacevault/ui`: run `vp run workbench` and open the printed URL (`http://localhost:4321`). It reads the Markdown files through the dev server and updates in place when any of them changes, without a page reload.

## Layout

| Path       | What it is                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backlog/` | The items and `flaky.md`                                                                                                                                                                                                                                                                                                                                                                                        |
| `site/`    | The board (Astro shell + React island, `astro dev --root site`)                                                                                                                                                                                                                                                                                                                                                 |
| `scripts/` | `check.ts` (`plans:check`), `checkRules.ts` (plan rules), `frontmatter.ts` (plan reader), `techFile.ts` (tech.md reader), `paths.ts` (repo, backlog and workbench locations), `cleanup.ts`, `deps.ts`, `boundaries.ts` (module boundaries in `vp run check`), `themeTokens.ts` (colour and px literals in `vp run check`), `componentGraph.ts`, `changedFiles.ts`, `interfaces.ts`, `itemCli.ts`, and the hooks |
| `shared/`  | Mockup shell, review template and CSS, `capture.ts` helpers, `tech-template.md`                                                                                                                                                                                                                                                                                                                                 |
| `tests/`   | Vitest specs, mirroring `scripts/` and `site/src/`                                                                                                                                                                                                                                                                                                                                                              |
| `GUIDE.md` | The owner's guide, shown on the board                                                                                                                                                                                                                                                                                                                                                                           |

## Item files

- `plan.md` frontmatter: `title`, `status`, `created`, `next`, `type: feature | bug | chore` and `areas: [<area>, …]` (at least one of `app` (`apps/web`)/`engine`/`gpx`/`ui`/`i18n`/`testing`/`workbench`/`docs`/`repo`/`skills`, no duplicates; `ITEM_TYPES`/`AREAS` in `scripts/frontmatter.ts`), both required for every status except `done` (done items from before the split stay valid without them), optional `depends-on: [<folder>]`, optional `size: small` (owner-only, the status guard refuses an agent change to the line). The card shows the type as an icon in a fixed colour (`COLOR_BY_ITEM_TYPE` in `site/src/lib/vocabulary.ts`) and the areas as a muted line that wraps. Tracked sections: `## Open questions` and `## Real-data checks`.
- Fast lane (`size: small`, for one-line bugs and chores): no `tech.md`, no fact-check worker, no `workbench:deps` run, the suite runs once; the review doc has only Changes, Verification and How to check (before/after shots for UI bugs); the card is tinted and outlined in the accent colour.
- `review/decisions.md`: `## Agent decisions` with `- [ ] **(<kind>) <decision>.** Agent: <reason>` items. Created by the first agent decision, also before a review doc exists. Only the owner ticks or removes an item.
- Decision kinds: `behaviour`, `look` or `scope`, first in the bold part; the status guard requires it on every line an agent adds (older lines stay valid). Superseded: `- [~] … Superseded by: <pointer>`, an agent's only change to an open line when a later decision replaced it; the Review tab hides those behind "N superseded", and neither Needs you nor cleanup counts them.
- `review/findings.md`: `## Round n` with `- **Rn** · open · on <entry> · …` items.
- The Review tab exists as soon as `review/index.html`, `findings.md` or `decisions.md` exists; it shows the doc only when `index.html` exists.

## Hooks

`.claude/settings.json` runs three scripts from `scripts/`:

- `statusGuard.ts` (PreToolUse, Edit/Write/Bash): keeps agents inside the status gates of `backlog/<item>/plan.md`, keeps `## Real-data checks` (plan.md) and `## Agent decisions` (`review/decisions.md`) owner-ticked, lets an agent mark an open decision superseded only by adding `Superseded by: …`, requires a kind on every decision an agent adds, keeps `size:` owner-only, and blocks Bash writes to those two files and deleting a backlog folder.
- `workerGitGuard.ts` (PreToolUse, Bash): subagents never run git writes.
- `indexHook.ts` (PostToolUse, Edit/Write): after an edit of a `backlog/<item>/plan.md`, `tech.md` or `review/decisions.md` it runs the plan rules and returns every problem to Claude.

## Skills

The workflow skills live in `.claude/skills/item*`: `item` (the router, `/item`), `item-backlog`, `item-explore`, `item-plan`, `item-implement`, `item-review`, `item-done`. They spawn the `item-worker` agent (`.claude/agents/item-worker.md`). [`FLOWS.md`](FLOWS.md) shows each flow (router, guardrails, backlog, explore, plan, implement, review, done, board writes) as a Mermaid sequence diagram.

## Board internals

- `site/src/pages/index.astro` is a thin shell around one `client:only="react"` island (`site/src/app/Board.tsx`); the island takes its components and theme from `@pacevault/ui` (`site/src/styles/board.css`), its words and type colours from `site/src/lib/vocabulary.ts`.
- `site/src/lib/board.ts` reads the whole board with `fs` (`readBoard`: each item with `readItem`, tech.md rendered with marked and Shiki by `renderTech` in `site/src/lib/markdown.ts`, the Tech tab's Actual sides built by `site/src/lib/techActual.ts`, flaky entries, the guide, the `workbench:check` errors) and derives the Needs you column (`needsYou`: open questions, unticked agent decisions, open findings; a done item only for agent decisions).
- `site/src/actions/index.ts` holds `board.read` (the island's one TanStack Query, `['board']`) and the writes (status, ticks, answers, deletes, Undo). Each write changes only the lines it names, refuses when they are not as the board showed them (409, the board refetches and shows the current file) or when the plan would fail `workbench:check`. After every write the board refetches; the write card shows the diff with Undo.
- `site/src/lib/devPlugin.ts` (Vite plugin `workbenchFiles`) serves the mockup and review pages and `shared/`, adds the backlog and `GUIDE.md` to the dev server's watcher and sends `wb:changed { path }` on every change there, so an agent's edit refetches the open board in place. It also answers `GET /<item>/questions.json` (the plan's questions) for the mockup shell's badges and Questions tab.

## Commands

```bash
vp run workbench                  # the board on http://localhost:4321 (astro dev)
vp run workbench:check            # check (astro sync + astro check) and plans:check (plans, questions, mockup ↔ plan labels, tech.md presence except for `size: small`, agent-decision format)
vp run workbench:capture -- backlog/<item>/review   # re-take review screenshots (app on 5176, board on 4321)
vp run workbench:deps -- <item>   # every Actual side of the Tech tab → <item>/review/: deps.mmd + deps.json (import graph over the plan's areas and planned folders, boundary check over apps/web/src + packages), components.mmd (.tsx tree), files.json (changed vs planned since the merge-base with main; WB_BASE=<rev> overrides), interfaces.md
vp run workbench:interfaces -- <item>   # interfaces.md alone (exported signatures of the changed TypeScript files, unplanned ones marked; same base as files.json)
vp run workbench:cleanup          # delete committed `done` folders without unticked agent decisions
```

Inside the package (`tools/workbench/`):

```bash
vp run check         # astro sync + astro check (part of the root `vp run check`)
vp run plans:check   # the plan rules only (not part of the code suite)
vp test -- --run     # tests/
```
