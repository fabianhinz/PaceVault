---
title: Barrel exports
status: idea
created: 2026-10-19
type: chore
areas: [engine, gpx, ui, testing, app]
next: 'Owner decides Q1, then item-plan'
---

# A cleaner API surface for every package via barrel exports

## Idea

Every package exports `"./*": "./src/*"` (e.g. `packages/engine/package.json`), so consumers import any internal file by path (`@pacevault/engine/types.ts`) and the public API is undefined. A barrel per package (one `index.ts`, or a few named entry points) makes the API explicit and lets internals move freely. The root `CLAUDE.md` §1 rule (".ts subpaths, `./*` export") changes with it.

## Open questions

- **Q1** · open · Shape of the API? (a) one `index.ts` per package (`import { stress } from '@pacevault/engine'`) (b) a few named entry points per package (`@pacevault/engine/metrics`, `@pacevault/ui/components`), no deep paths (c) per package as fits (ui by area, engine as one barrel).
