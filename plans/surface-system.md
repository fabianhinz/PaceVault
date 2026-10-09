# Surface system: one dark family for content and floating surfaces

Mockup: `mockups/floating-surface/index.html` (gallery, slide 15 "system 2 · One dark family").

## Context

- Every surface uses `glassClass = 'bg-white/5 backdrop-blur-xl border border-white/10'` (`src/components/ui/Card.tsx:3`), copied by hand in several places (`Popover.tsx:16`, `DropdownMenu.tsx:14`, `Select.tsx:32`, `Dialog.tsx:26`, `Toast.tsx:22`, `Tabs.tsx:14`, `SegmentedControl.tsx:22`, `ChartsCard.tsx:16`, `Input.tsx:16`).
- The floating dock and its filter card sit over the sheet content; charts and text bleed through (row title contrast down to 2.8:1). Popovers, menus, dialogs, toasts and map pills have the same problem.
- Compared: today's glass + dense floating, one dark family, one light family, light content + elevated gray-800. Chosen: **one dark family**.

## Decisions (settled)

### Rule (goes into CLAUDE.md)

- **Content surfaces** (cards, the bottom sheet, banners, segmented controls, chart cards): `glassClass` = `bg-surface/55 backdrop-blur-xl border border-white/10`.
- **Floating surfaces** — anything that renders on top of other content (portals, fixed/absolute/sticky overlays, popups, map markers, pills over charts or the map): `floatingClass` = `bg-surface/85 backdrop-blur-xl border border-white/10` + a soft shadow (`shadow-[0_8px_24px_rgb(0_0_0/0.4)]`).
- Decide by placement, not by component: a `Card` placed over the map is floating.

### Floating (all 10)

Dock rail/pill/circles and filter card (`src/components/layout/DockItems.tsx:60`, `:109`, `src/components/layout/Dock.tsx:61`, `:86`), Popover (`src/components/ui/Popover.tsx:16`, incl. ResponsivePopover), DropdownMenu (`src/components/ui/DropdownMenu.tsx:14`), Select content (`src/components/ui/Select.tsx:32`), Dialog content (`src/components/ui/Dialog.tsx:26`), Toast (`src/components/ui/Toast.tsx:22`), FloatingPill (`src/components/ui/FloatingPill.tsx:5`: chart zoom reset, map control pills), map popup (`src/features/map/MapPopupShell.tsx:47`, stops taking its surface from `Card`), sticky TabsList (`src/components/ui/Tabs.tsx:14`, always), studio marker pins (`src/features/studio/markers/StudioMarkerPins.tsx:50`).

### Content

`glassClass` users stay content and get the new value: cards (`Card.tsx:5`), bottom sheet (`src/components/ui/BottomSheet.tsx:115`), `SegmentedControl.tsx:22`, `ChartsCard.tsx:16`, banners. Hand-copied glass strings are replaced by `glassClass`/`floatingClass`; blur sizes unify on `-xl`.

### Text

- Input placeholders and the leading input icon move to `text-text-tertiary` app-wide (`src/components/ui/Input.tsx:25`, `:39`); about 5.7:1 instead of about 2.5:1.

### Bug found along the way

- On the phone the toast viewport (`fixed bottom-6`, `src/components/ui/Toast.tsx:44`) sits on top of the dock row; stack toasts above the dock (use the dock footprint from `src/lib/dockGeometry.ts`).

## Removal

- Dead `chartTheme.tooltip` (`src/lib/chartTheme.ts:84`), unused since every chart uses `hoverOnlyTooltip`.
- All hand-copied glass strings.

## Tests

- Regression (e2e, phone): "toast does not cover the dock".
- No unit tests for class strings.

## Verification

`vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`; by hand on desktop and 390 px: dock + filter card over the dashboard charts, dropdown/popover/select/dialog over cards, toast above the dock, map pills and popups over tracks, sticky tabs while scrolling; compare with mockup slide 15.
