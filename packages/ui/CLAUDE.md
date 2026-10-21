# @pacevault/ui

**WHY:** One UI kit for the PWA and the repo tools (README banner, later the board), so components and theme tokens exist once.
**WHAT:** Components in `src/components/` (Radix primitives wrapped and styled with Tailwind v4, dark mode only), generic UI hooks in `src/hooks/`, helpers in `src/lib/` (`cn`, `tokens`, `colors`, dock geometry, sheet drag and position, scroll fade, sliding highlight), all theme tokens in `src/theme.css`. Shared code rules: root `CLAUDE.md` §2.

## Rules

- **No app imports**: never import from `apps/*` or use an `@/` alias; the kit imports only packages and itself (relative paths). `grep -rn "@/\|apps/web" packages/ui/src` finds nothing.
- **No provider**: the packages are only used inside this repo, so the kit is not configurable. Fixed texts come from `m` in `@pacevault/i18n/messages.js` (never paraglide paths of the app); dock and sheet geometry live in `src/lib/`.
- **UI only, no logic**: stores and app features stay in the app. A component that needs app data takes it as props or as a slot (`Toast` takes `toasts` and `onDismiss`; metric help is an `info?: ReactNode` slot on `StatTile`, `StatRail` rows, `ListItemHeader` and `ChartRow`).
- **Headless UI**: Import the Radix primitive → wrap it in `src/components/` → style with Tailwind. Use `cn()` from `src/lib/cn.ts` (`clsx` + `tailwind-merge`). No component libraries (no MUI, AntD, Shadcn).
- **Props**: a wrapper may rest-destructure `props` to strip its own props (`variant`, `className`, …) before forwarding the rest to a primitive; elsewhere the root no-destructuring rule holds.
- **Reuse before inlining**: before writing layout or UI patterns in app code, check `src/components/` (`CardHeader`, `StatTile`, `ValueSkeleton`, …). Extract a new kit component when a pattern appears in 2+ places.
- **Theme**: every token lives in `src/theme.css`; every colour token in `src/lib/tokens.ts` mirrors one there, change both together. Consumers import `tailwindcss`, then `@pacevault/ui/theme.css`, and add `@source` for `packages/ui/src` (Tailwind does not scan workspace packages).
- **Server rendering**: hooks must not touch `window` during render without a guard (`useMediaQuery` reads as `false` on the server).

## Surfaces

Every surface takes its background from `src/components/Card.tsx`; never hand-copy the class string.

- **Content** (cards, the bottom sheet, segmented controls, chart cards): `glassClass`.
- **Floating** (anything drawn over other content: portals, fixed/absolute/sticky overlays, popups, map markers, pills over charts or the map): `floatingClass`, or `<Card floating>`.
- **Sticky only from `lg`** (floats on desktop, scrolls with the page below): `floatingLgClass`.
- **Tile** (a bordered block inside a content surface: stat cells, grid tiles, selectable rows in dialogs): `tileClass`, padding at the call site.
- **Scrim** (behind a modal overlay on phone): `scrimClass`.
- Decide by placement, not by component: a `Card` over the map is floating, the bottom sheet is content.
- On phone, modal overlays are an inset floating card built from `DialogContent` + `DialogHeader`/`DialogBody`/`DialogFooter`; never hand-build a sheet.

## Tests

Kit tests live in `tests/`, mirroring `src/` (`tests/lib/`, `tests/hooks/`), jsdom, no app setup file. Strategy as in `apps/web/tests/CLAUDE.md`: helpers with branches or arithmetic get unit tests, components none.

## Verification

```bash
vp run -F @pacevault/i18n compile   # from the root, before a bare vp check
vp check                            # from packages/ui
vp test -- --run                    # from packages/ui
```
