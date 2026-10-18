---
title: Shared UI kit
status: idea
created: 2026-10-19
depends-on: [repo-restructure]
next: Write the plan (feature-plan) once repo-restructure is planned
---

# Shared UI kit for the PWA, the board and the banner

## Idea

Extract src/components/ui into packages/ui with a single theme and token source, and remove its ties to the app (MetricLabel, paraglide strings, dock offset, useMediaQuery during SSR). The Astro board (React islands + Tailwind) and the README banner then use the kit, so all three meet the PWA's UI/UX standard.

## Open questions
