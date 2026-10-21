---
title: Marker dialog on phone
status: planned
created: 2026-10-19
type: bug
areas: [app]
next: Owner sets ready, then "lets dev"
size: small
---

# Studio marker dialog: button layout on phone

## Context

In edit mode Delete, Cancel and Save share one row on phone (`apps/web/src/features/studio/markers/StudioMarkerDialog.tsx:200-212`, `max-lg:grid-cols-3`); it is the only three-button dialog footer in the app (all other footers have two actions). Same dialog: clearing the km field and saving moves the marker to 0 km without warning (`:107`; `clampKm` turns `NaN` into 0, `:20-24`).

## Decisions (settled)

- Delete becomes a `danger` icon button (`size="icon"`, `Trash2`, accessible name "Delete") at every width, on the left; the gap between it and Cancel · Save is wider than the gap between Cancel and Save (Q1, Q2).
- `apps/web/CLAUDE.md:45` is amended: in a three-action footer the destructive action may be a `danger` icon button with an accessible label (Q2).
- The sweep's "input wipe" is dropped: the seed effect re-runs on a new `props.route` (`:82`), but every route update is a user action (`apps/web/src/store/studio.ts:52-60`) that can't happen while the modal is open, so the comment at `:80-81` holds.

## Approach

- `StudioMarkerDialog.tsx:200-212`: Delete → `<Button variant="danger" size="icon" aria-label={m.ui_btn_delete()}>` with `Trash2`; the phone footer becomes `max-lg:grid-cols-[auto_1fr_1fr]` and the icon button gets `max-lg:mr-2` (16 px to Cancel, 8 px between Cancel and Save); desktop keeps `lg:mr-auto` (far left).
- Empty km field (Q3): `canSave` (`:85`) also requires the km text to parse to a number, so Save stays disabled while it is empty or not a number, like the empty waypoint label.
- `apps/web/CLAUDE.md:45`: the footer rule reads "the destructive action spelled out (`danger`) on the left, or in a three-action footer a `danger` icon button with an accessible label".

## Files

- **Changed:** `apps/web/src/features/studio/markers/StudioMarkerDialog.tsx`, `apps/web/CLAUDE.md`, `apps/web/e2e/studio.spec.ts`.

## Tests

- `apps/web/e2e/studio.spec.ts:72` (adds, edits and deletes markers): the delete steps (`:117`, `:121`) find the icon button by its name "Delete" unchanged; regression step for "empty km field saves the marker at 0 km": clearing the km field disables Save.

## Verification

1. Full root `CLAUDE.md` §5 suite.
2. Manual at 390 px, EN and DE: edit a marker; trash icon left, Cancel · Save right with the wider gap; clearing the km field disables Save. Desktop: icon far left.

## Delivery and acceptance

Review doc (`size: small`: Changes, Verification, How to check) with before/after shots of the edit dialog at 390 px and desktop. Cleanup only via `item-done` after the owner's acceptance.

## Open questions

- **Q1** · answered 2026-10-21 · Which layout for Delete, Cancel and Save on phone? → Delete as a `size="icon"` button; wider gap to Cancel · Save than between them. Owner: "The spacing between this icon button and the two others should be bigger than the one between save and cancel"
- **Q2** · answered 2026-10-21 · An icon-only Delete breaks "destructive action spelled out, never icon-only" (`apps/web/CLAUDE.md:45`): how to resolve? → (a) icon Delete at every width and amend the rule. Owner: "Icon + amend rule (Recommended)"
- **Q3** · answered 2026-10-21 · What happens when the km field is empty or not a number? → (a) Save is disabled until it holds a number, like the empty waypoint label today. Owner: "Disable Save (Recommended)"

## Risks

- An icon-only Delete relies on the danger colour and its label for meaning; screen readers get "Delete".
