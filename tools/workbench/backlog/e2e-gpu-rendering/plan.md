---
title: GPU map e2e
status: exploring
created: 2026-10-23
type: chore
areas: [app]
next: 'Mostly built in session-3d-map (MAP_LAUNCH_OPTIONS + review config); left: de-duplicate the switch in playwright.review.config.ts, first CI run; owner decides after session-3d-map is accepted'
size: small
---

# Render the map e2e specs on the GPU locally

## Idea

The map specs force SwiftShader (`apps/web/e2e/helpers/map.ts:5-6`, used at `apps/web/e2e/map.spec.ts:11` and `apps/web/e2e/studio.spec.ts:10`, a copy at `apps/web/e2e/mobile/map.spec.ts:16`). One shared launch-options helper would use Metal on macOS outside CI (`channel: 'chromium'`, `--use-angle=metal`) and SwiftShader in CI (`ubuntu-latest`, `.github/workflows/ci.yml:16`). In the `session-3d-map` mockup checks the GPU was about 2× faster (9.1 s vs 19.2 s) and passed lap fits that timed out under SwiftShader.

## Open questions
