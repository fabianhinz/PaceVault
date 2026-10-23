---
title: Conventions migration
status: idea
created: 2026-10-23
type: chore
areas: [app, ui, engine, gpx, i18n, testing, workbench, docs, repo]
depends-on: [session-3d-map]
next: 'Owner decides: plan the migration once session-3d-map is done'
---

# Bring the whole workspace onto the agreed conventions

## Idea

Execute the 47 convention plans plus `tooling.md` in `docs/conventions/plans/` (rules in `docs/conventions/tdr/`, indexed by `docs/conventions/CLAUDE.md`), in their `depends_on` order, with the review round's before/after captures as evidence.
Step 1 is a fact-check of every plan against the code after `session-3d-map` landed: the plans cite `path:line` and importer lists of the tree as of 2026-10-23.
Follow-ups that are not part of this migration: [conventions-follow-ups](../conventions-follow-ups/plan.md). Read first: [research/handover.md](research/handover.md) (origin, every owner decision, blank spots and risks, do's and don'ts).

## Open questions

- **Q1** · open · Engine "broken contracts are loud": an agent picked nine engine sites that `console.warn` and wrote new TDR rules R7/R8 (`docs/conventions/plans/outcome-unions-over-exceptions.md` items 8–9; rewrites `packages/engine/CLAUDE.md:11`). (a) keep the nine sites (b) review the site list first (c) drop the warnings, engine stays silent.
- **Q2** · open · `PageLink` marks the parent dock tab active on `/trips/:id` and `/studio/:id`, which `NavLink` does not today (`docs/conventions/plans/navigation-through-router-hooks.md` item 7). (a) accept (b) keep today's exact matching.
- **Q3** · open · Banner-only px tokens are added to the kit `packages/ui/src/theme.css` (`docs/conventions/plans/styled-api-over-sx.md`). (a) kit theme (b) `tools/docs` own `banner.css`.
- **Q4** · open · Variant resolvers were made module-local, although the owner chose "exported" (lint `react/only-export-components`, no second reader) (`docs/conventions/plans/variant-unions-with-default-resolvers.md`). (a) module-local (b) exported, with a lint override.
- **Q5** · open · Kit-rendered controls get required label props `closeLabel` / `expandLabel` / `collapseLabel` (~20 call sites) so ui drops `@pacevault/i18n`; ActionsMenu items get a new `id` as React key (`docs/conventions/plans/visible-copy-arrives-as-props.md`). (a) accept (b) keep `m.*` inside the kit for these labels.
- **Q6** · open · Engine outcome unions only where a function has ≥ 2 failure kinds (step length, decoupling, energy); single-failure functions keep `T | undefined` (`docs/conventions/plans/outcome-unions-over-exceptions.md`). (a) accept (b) every nullable engine return.
- **Q7** · open · Engine types read only by the app (`WindExposure`, `Climb`, …) stay with their computing module; only types shared between engine modules move to `types.ts` (`docs/conventions/plans/colocated-types-module.md`). (a) accept (b) move app-read types too.
- **Q8** · open · `packages/gpx/src/simplifyGpxPoints.ts` is deleted (its only reader moves to `apps/web/src/lib/gpsTrack.ts`); its two object-identity spec cases are dropped (`docs/conventions/plans/engine-holds-domain-logic-only.md`). (a) accept (b) keep the module.
- **Q9** · open · gpx citations: `@see [Veness2019]` for the projection, the elevation hysteresis as an app-specific `SOURCES.md` row, no `// Sources:` header (owner asked for headers + `@see`) (`docs/conventions/plans/comments-cite-sources-and-explain-why.md`). (a) accept (b) add `// Sources:` headers too.
- **Q10** · open · Workbench: beyond the agreed keep-list, comments that explain a tool behaviour the code relies on stay (Astro YAML dates, GFM `[~]`, Oxfmt width, Shiki start-up, Mermaid global state, marked heading ids, in-memory Undo, iframe page) (`docs/conventions/plans/comments-cite-sources-and-explain-why.md`). (a) keep (b) remove.
- **Q11** · open · Store resets through `INITIAL_*_STORE_STATE` clear more fields than some specs reset today (`docs/conventions/plans/single-zustand-store-of-slices.md`). (a) accept (b) keep per-spec partial resets.
- **Q12** · open · Root `CLAUDE.md:28` uses `result.x` as its example, a stand-in name the agreed naming rule forbids (`docs/conventions/plans/hook-results-bound-whole.md` Open items). (a) reword the example (b) leave it.
- **Q13** · open · Newly adopted rules without a gate (effects R2/R3, styled-api detections, engine domain-only via the `workbench:deps` `engine-is-pure` rule) (`docs/conventions/plans/tooling.md`). (a) add gates (b) stay manual.
- **Q14** · open · Smaller agent calls: GPX import failure keeps one shared toast key; the failure description shows only when all failed files share a reason; required aria-labels reuse each row's visible title; `README_LOCALE` env var renamed `BANNER_LOCALE` (snackbar, outcome-unions, visible-copy, names plans). (a) accept all (b) go through them one by one.
