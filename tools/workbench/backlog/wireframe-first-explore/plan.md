---
title: Wireframe-first explore
status: idea
created: 2026-11-04
type: chore
areas: [skills, workbench]
next: 'Owner decides: explore the UI or plan directly'
---

# Explore with a low-fi wireframe first, then a hi-fi mockup app

## Idea

`item-explore` (`.claude/skills/item-explore/SKILL.md`) jumps straight to hi-fi HTML mockups. New order: research → a low-fi wireframe on the mockup shell (greyscale sketch boxes, fake data, variant and scenario switches, like `tools/workbench/backlog/session-segments/mockup/pass-compare/index.html`) → the owner agrees a direction → a hi-fi mockup built as a small embeddable Vite app that uses `@pacevault/ui`, only for the agreed variants. The board's Mockup tab shows only `mockup/index.html` (`tools/workbench/site/src/app/MockupPane.tsx:24-27`), although the dev server serves every page under `mockup/` (`tools/workbench/site/src/lib/devPlugin.ts:20`); it lists every mockup page of an item, labelled low-fi or hi-fi, so the owner never opens an HTML file by hand.

## Open questions
