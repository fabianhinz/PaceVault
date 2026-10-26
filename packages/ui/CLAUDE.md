# @pacevault/ui

**WHY:** One UI kit for the PWA and the repo tools (README banner, later the board), so components and theme tokens exist once.
**WHAT:** Components in `src/components/pv<Name>/Pv<Name>.tsx`, one directory per component family, every component export prefixed `Pv` (rules: `docs/conventions/tdr/component-directory-and-file-naming.md`) (Radix primitives wrapped and styled with Tailwind v4, dark mode only), generic UI hooks in `src/hooks/`, helpers in `src/lib/` (`cn`, `tokens`, dock geometry, sheet drag and position, scroll fade, sliding highlight), every theme token the app and the kit use in `src/theme.css` (banner-only tokens live in `tools/docs/banner/page/banner.css`). Shared code rules: root `CLAUDE.md` §2.

## Rules

- **No app imports**: never import from `apps/*` or use an `@/` alias; the kit imports only packages and itself (relative paths). `grep -rn "@/\|apps/web" packages/ui/src` finds nothing.
- **No provider**: the packages are only used inside this repo, so the kit is not configurable. The kit authors no copy: every visible text and accessible name — including those of controls the kit renders itself — arrives as a prop (`label`, `closeLabel`, …), filled by the consumer from its own `m.*` messages; dock and sheet geometry live in `src/lib/`.
- **UI only, no logic**: stores and app features stay in the app. A component that needs app data takes it as props or as a slot (`PvToastViewport` takes `toasts` and `onDismiss`; metric help is an `info?: ReactNode` slot on `PvStatTile`, `PvStatRail` rows, `PvListItemHeader` and `PvChartRow`).
- **Headless UI**: Import the Radix primitive → wrap it in `src/components/` → style with Tailwind. Use `cn()` from `src/lib/cn.ts` (`clsx` + `tailwind-merge`). No component libraries (no MUI, AntD, Shadcn).
- **Props**: a wrapper may rest-destructure `props` to strip its own props (`variant`, `className`, …) before forwarding the rest to a primitive; elsewhere the root no-destructuring rule holds.
- **Reuse before inlining**: before writing layout or UI patterns in app code, check `src/components/` (`PvCardHeader`, `PvStatTile`, `PvValueSkeleton`, …). Extract a new kit component when a pattern appears in 2+ places.
- **Theme**: every token the app and the kit use lives in `src/theme.css`; banner-only tokens live in `tools/docs/banner/page/banner.css`; every colour token in `src/lib/tokens.ts` mirrors one there, change both together. Consumers import `tailwindcss`, then `@pacevault/ui/theme.css`, and add `@source` for `packages/ui/src` (Tailwind does not scan workspace packages).
- **Server rendering**: hooks must not touch `window` during render without a guard (`useMediaQuery` reads as `false` on the server).

## Surfaces

Every surface takes its background from `src/lib/surfaces.ts`; never hand-copy the class string.

- **Content** (cards, the bottom sheet, segmented controls, chart cards): `GLASS_CLASS`.
- **Floating** (anything drawn over other content: portals, fixed/absolute/sticky overlays, popups, map markers, pills over charts or the map): `FLOATING_CLASS`, or `<PvCard floating>`.
- **Sticky only from `lg`** (floats on desktop, scrolls with the page below): `FLOATING_LG_CLASS`.
- **Tile** (a bordered block inside a content surface: stat cells, grid tiles, selectable rows in dialogs): `TILE_CLASS`, padding at the call site.
- **Scrim** (behind a modal overlay on phone): `SCRIM_CLASS`.
- Decide by placement, not by component: a `PvCard` over the map is floating, the bottom sheet is content.
- On phone, modal overlays are an inset floating card built from `PvDialogContent` + `PvDialogHeader`/`PvDialogBody`/`PvDialogFooter`; never hand-build a sheet.

## Tests

Kit tests live in `tests/`, mirroring `src/` (`tests/lib/`, `tests/hooks/`), jsdom, no app setup file. Strategy as in `apps/web/tests/CLAUDE.md`: helpers with branches or arithmetic get unit tests, components none.

## Verification

```bash
vp check           # from packages/ui
vp test -- --run   # from packages/ui
```
