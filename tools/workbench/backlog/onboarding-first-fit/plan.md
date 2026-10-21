---
title: Onboarding first fit
status: idea
created: 2026-10-21
type: bug
areas: [app]
next: 'Owner decides: plan the fix directly'
---

# Map's first fit after onboarding sometimes misses the user's tracks

## Idea

After onboarding, the map's first fit to the imported tracks sometimes doesn't happen: the camera stays where it was, for example on the Munich demo data. Likely a race between the onboarding preview camera (`apps/web/src/features/map/hooks/useOnboardingPreviewCameraEffect.ts:58`) and the first fit gates in `useMapCameraEffect` (`apps/web/src/features/map/hooks/useMapCameraEffect.ts:130`). Intermittent; no repro steps yet.

## Open questions
