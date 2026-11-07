---
title: Map debug snapshot
status: planned
created: 2026-11-07
type: chore
areas: [app]
next: 'Owner sets ready'
size: small
---

# A pvDebug command that snapshots what the map draws, for bugs that vanish on reload

## Context

`session-segments` R88: hovering a segment drew a thick straight line next to the stretch, and a reload made it vanish, so there was nothing left to debug. `pvDebug` (`apps/web/src/lib/debug/pvDebug.ts:7-11`) gets a command that captures the drawn map state on demand and can force a hover by index, so the owner can paste the evidence before reloading. Owner: "this doesnt need a ring bover, an argument, indexed based that forces the focus state would also work for the debug script"

## Decisions (settled)

- `pvDebug.mapSnapshot()`: the current state; `pvDebug.mapSnapshot(i)`: set the hover to segment `i` (0-based) with `setMapHover`, wait for the draw, snapshot (Q1); `pvDebug.mapSnapshot('all')`: step through every segment and return only those whose drawn path has a jump. Owner: "an argument, indexed based that forces the focus state would also work for the debug script"
- No ring buffer, no localStorage flag: everything is computed when the command runs. Owner: "this doesnt need a ring bover"
- A jump is two consecutive drawn points more than 500 m apart; the snapshot lists jumps and point counts, never the full coordinate list.
- The snapshot holds the owner's own coordinates (jump ends, bounds): pasted into a chat, never committed.

## Approach

1. **Overlay handle.** `DeckOverlayControl` registers its `MapboxOverlay` once, in the `useControl` factory (`apps/web/src/components/mapBackground/DeckOverlayControl.tsx:25`), with a new `lib/debug/mapSnapshot.ts`, which keeps the latest instance in a module variable. No effect, no store.
2. **Layer summary.** `mapSnapshot.ts` flattens `overlay.props.layers`; per `PathLayer` it reads each datum's path through the layer's own `getPath` accessor and reports `{ id, visible, paths, points, jumps[] }` (jump: index, meters via `haversineDistanceMeters`, `packages/engine/src/geodesy.ts:22`, from, to); other layers report `{ id, visible, data count }`.
3. **Stored entity.** For the current hover (`useMapFocusStore.getState().mapHover`, `apps/web/src/store/mapFocus.ts:13-19`): `segment` / `segmentSpan` → the segment from the segments store, its decoded `encodedPolyline` (`decodeTrackForRendering`, `apps/web/src/lib/analysis/gpsTrack.ts:51`) as points + jumps; `session` → `getSessionGPS` (`apps/web/src/lib/storage/db.ts:170`) decoded the same way.
4. **Forced hover by index (Q1).** `mapSnapshot(i)` calls `useMapFocusStore.getState().setMapHover({ target: { kind: 'segment', id }, sceneKey })` for the i-th segment of the segments store, with the scene key of the page on screen (`mapSceneOf`, `apps/web/src/components/mapBackground/mapScene.ts`); every snapshot names the hovered segment, so the index never has to match a list order.
5. **Wait for the draw.** After `setMapHover`, wait two animation frames before reading the layers; `'all'` steps through every segment the same way and restores the original hover at the end.
6. **Register.** `mapSnapshot` in `commands` and `DOC_BY_COMMAND` (`apps/web/src/lib/debug/pvDebug.ts:7-21`), so `pvDebug.help()` lists it.
7. **Guidance.** One bullet in `apps/web/CLAUDE.md` § 2 App Rules: when a map drawing bug can't be reproduced, ask the owner for `copy(pvDebug.mapSnapshot(…))` before they reload.

## Files

- `apps/web/src/lib/debug/mapSnapshot.ts` (new): overlay registration, layer summary, stored entity, forced hover, `mapSnapshot` command.
- `apps/web/src/components/mapBackground/DeckOverlayControl.tsx:25`: register the overlay in the `useControl` factory.
- `apps/web/src/lib/debug/pvDebug.ts:7-21`: add the command and its doc line.
- `apps/web/CLAUDE.md` § 2: the guidance bullet.
- `apps/web/tests/lib/debug/mapSnapshot.spec.ts` (new): the jump detection and the layer summary.

## Tests

- `mapSnapshot.spec.ts`: a path with one 8 km gap reports one jump at the right index with its distance; a path with 10 m steps reports none; a non-path layer reports id, visible and data count; the stored segment polyline with a jump reports it.
- No e2e: a debug command is not a user journey.

## Verification

```bash
vp run check
vp run test
vp run e2e
vp run build
```

Manual: on the dashboard's Segments tab run `pvDebug.mapSnapshot()`, `pvDebug.mapSnapshot(0)` and `pvDebug.mapSnapshot('all')`; the forced hover shows on the map and the output lists the segment hover layer.

## Delivery and acceptance

- Review doc `review/index.html`: no UI change, no screenshots; Changes, Verification and How to check (the three console calls).
- The owner accepts with Mark done; the folder is cleaned up only then (`item-done`).

## Open questions

- **Q1** · answered 2026-11-07 · How does the index force the hover? (a) dispatch a pointer-enter on the i-th list item in the page; (b) a debug registry the lists fill, then `setMapHover`. → neither: the command calls `useMapFocusStore.getState().setMapHover` itself (`apps/web/src/store/mapFocus.ts:20`) with the i-th segment as the target; no DOM events, no registry, no list changes. Owner: "what are you talking about, its just a little call to setMapHover after all"

## Risks

- The forced hover only draws where the page's map shows segment hovers (the dashboard's Segments tab, a segment page); elsewhere the snapshot reports the hover layer as empty, which the output says.
