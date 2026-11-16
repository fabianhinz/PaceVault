---
title: Durability
status: idea
created: 2026-11-07
type: feature
areas: [app, engine]
next: 'Owner decides: explore the UI or plan directly'
---

# Durability: how well performance holds up after prior work

## Idea

Fatigue resistance ("durability") as its own feature across all sessions, not per segment: e.g. efficiency or best power fresh vs after N kJ of prior work, tracked over time. It came out of the segment report, where most segments are ridden at a similar point of every session and give no spread (owner: "maybe the fatigue chart isn't something for our segments after all, but a separete feature?", "fair, looks like another backlog item"). Starting points: `research/fatigue-resistance.md` (written for segments), the owner's segment choices (x = kJ before, y = efficiency), and per-session aerobic decoupling in `packages/engine/src/decoupling.ts:139`.

## Open questions
