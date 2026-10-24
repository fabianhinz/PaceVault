---
title: Session replay
status: idea
created: 2026-10-23
type: feature
areas: [app]
depends-on: [session-3d-map]
next: 'Wait for session-3d-map, then explore from the answers carried over below'
---

# Replay a session along its track on the map

## Idea

Play a session back on the session details map: a dot with a trail moves along the track and drives the chart cursor. Spun off from `session-3d-map` (its Q32), which built a first version in `tools/workbench/backlog/session-3d-map/mockup/` (deck.gl `TripsLayer` or a MapLibre line with `line-gradient`). Answers already given there: the camera follows the dot in an ego perspective with the height following the terrain (Q10), play wins over chart scrubbing until Pause (Q19), and there is a speed control (Q20).

## Open questions

- **Q1** · open · Where does the replay control live? (a) icon-only play/pause pill at the end of the map pills row, same place at every width (b) a play button in the charts card header (c) inside the 3D popover.
- **Q2** · open · Map input during replay? (a) any map gesture pauses the replay (b) gestures are ignored until Pause.
- **Q3** · open · Camera during replay while 3D is off? (a) follows the dot, north up, same zoom (b) stays at the fitted view.
