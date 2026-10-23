---
id: behavioural-constants-hoisted-upper-snake
tdr_reference: tdr/behavioural-constants-hoisted-upper-snake.md
depends_on: [comments-cite-sources-and-explain-why]
generated: 2026-10-23
---

# Behavioural values are named UPPER_SNAKE constants at module scope

Read `tdr/behavioural-constants-hoisted-upper-snake.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`comments-cite-sources-and-explain-why`](comments-cite-sources-and-explain-why.md) — removes the doc comments above the engine constants and moves the units into field names, so items 8–12 move and rename bare declarations.

## Changes

Run every item from the repo root. "Green" means `vp run check` and `vp run test` both pass. Every item is a rename or a hoist: class strings, numbers and rendered markup stay byte-identical.

1. Move the surface class constants into `lib/surfaces.ts` as UPPER_SNAKE.
   Files: new `packages/ui/src/lib/surfaces.ts`; `packages/ui/src/components/Card.tsx`, `packages/ui/src/components/FloatingPill.tsx`; kit importers `packages/ui/src/components/BottomSheet.tsx`, `ChartsCard.tsx`, `Dialog.tsx`, `DropdownMenu.tsx`, `Popover.tsx`, `SegmentedControl.tsx`, `Select.tsx`, `StatTile.tsx`, `Tabs.tsx`, `Toast.tsx` (all under `packages/ui/src/components/`); app and tool importers `apps/web/src/components/ImportProgressOverlay.tsx`, `apps/web/src/components/layout/Dock.tsx`, `apps/web/src/components/layout/DockItems.tsx`, `apps/web/src/features/labs/WorkoutExpansionPanel.tsx`, `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/features/sessions/session/SessionSummaryCard.tsx`, `apps/web/src/features/studio/markers/StudioMarkerPins.tsx`, `apps/web/src/features/trips/ManageTripDialog.tsx`, `apps/web/src/features/trips/TripFormDialog.tsx`, `tools/workbench/site/src/app/Columns.tsx`, `tools/workbench/site/src/app/ItemCard.tsx`, `tools/workbench/site/src/app/PlanPane.tsx`, `tools/workbench/site/src/app/ReviewPane.tsx`, `tools/workbench/site/src/app/Stage.tsx`
   Change: cut `Card.tsx:3-15` and `FloatingPill.tsx:5` into `lib/surfaces.ts` with the same string values, renamed: `glassClass` → `GLASS_CLASS`, `tileClass` → `TILE_CLASS`, `floatingSurface` → `FLOATING_SURFACE` (module-local, not exported), `floatingClass` → `FLOATING_CLASS`, `floatingLgClass` → `FLOATING_LG_CLASS`, `scrimClass` → `SCRIM_CLASS`, `overlayClass` → `OVERLAY_CLASS`, `floatingPillClass` → `FLOATING_PILL_CLASS` (it reads `FLOATING_CLASS`). `Card.tsx` and `FloatingPill.tsx` import what they read from `../lib/surfaces.ts`. Every importer of a surface constant switches its import to `../lib/surfaces.ts` (kit) or `@pacevault/ui/lib/surfaces.ts` (app, tools) and uses the new name. `Card` and `FloatingPill` themselves stay where they are.
   Check: `rg -n "\b(glassClass|tileClass|floatingClass|floatingLgClass|scrimClass|overlayClass|floatingPillClass|floatingSurface)\b" packages/ui/src apps/web/src tools/workbench/site tools/docs` prints nothing; `rg -n "^export const" packages/ui/src/components/Card.tsx packages/ui/src/components/FloatingPill.tsx` prints only `Card` and `FloatingPill`; green.

2. Rewrite the surface docs for the new names and module.
   Files: `packages/ui/CLAUDE.md`, `apps/web/CLAUDE.md`
   Change: `packages/ui/CLAUDE.md:19` "Every surface takes its background from `src/components/Card.tsx`" → "from `src/lib/surfaces.ts`"; `:21-25` the names `glassClass`, `floatingClass`, `floatingLgClass`, `tileClass`, `scrimClass` → `GLASS_CLASS`, `FLOATING_CLASS`, `FLOATING_LG_CLASS`, `TILE_CLASS`, `SCRIM_CLASS`. `apps/web/CLAUDE.md:62` "from `@pacevault/ui/components/Card.tsx` (`glassClass`, `floatingClass`, `floatingLgClass`, `tileClass`, `scrimClass`)" → "from `@pacevault/ui/lib/surfaces.ts` (`GLASS_CLASS`, `FLOATING_CLASS`, `FLOATING_LG_CLASS`, `TILE_CLASS`, `SCRIM_CLASS`)".
   Check: `rg -n "glassClass|floatingClass|tileClass|scrimClass|components/Card\.tsx" packages/ui/CLAUDE.md apps/web/CLAUDE.md` prints nothing.

3. Name the drag elasticity once.
   Files: `packages/ui/src/lib/sheetDrag.ts`, `packages/ui/src/hooks/useGrabberDrag.ts`, `packages/ui/src/components/Dialog.tsx`
   Change: add `export const SHEET_DRAG_ELASTIC = 0.08;` to `lib/sheetDrag.ts`; `useGrabberDrag.ts:20` `dragElastic: 0.08` → `dragElastic: SHEET_DRAG_ELASTIC`; `Dialog.tsx:92` `dragElastic={{ top: 0, bottom: 0.08 }}` → `dragElastic={{ top: 0, bottom: SHEET_DRAG_ELASTIC }}`; import it in both.
   Check: `rg -n "0\.08" packages/ui/src` prints only the `lib/sheetDrag.ts` declaration; green.

4. Name the sheet's midpoint and fade thresholds.
   Files: `packages/ui/src/lib/sheetPosition.ts`, `packages/ui/src/components/BottomSheet.tsx`
   Change: `sheetPosition.ts:74` `if (position <= 0.5)` → `if (position <= MIDDLE_POSITION)` (the constant already exists at `:26` with the same value and meaning). `sheetPosition.ts:67` `if (summaryOpacity > 0.5)` → `if (summaryOpacity > SETTLE_OPACITY_THRESHOLD)` with `const SETTLE_OPACITY_THRESHOLD = 0.5;` beside `PEEK_FADE_RANGE`. `BottomSheet.tsx:62` `(v) => (v > 0.5 ? 'auto' : 'none')` → `(v) => (v > PEEK_INTERACTIVE_OPACITY ? 'auto' : 'none')` with `const PEEK_INTERACTIVE_OPACITY = 0.5;` beside `DIVIDER_SCROLL_THRESHOLD`.
   Check: `rg -n "0\.5\b" packages/ui/src/lib/sheetPosition.ts packages/ui/src/components/BottomSheet.tsx` prints only the three declarations; `vp test -- --run tests/lib/sheetPosition.spec.ts` (from `packages/ui/`) passes; green.

5. Name the popup side offsets.
   Files: `packages/ui/src/components/Popover.tsx`, `packages/ui/src/components/DropdownMenu.tsx`, `packages/ui/src/components/Select.tsx`
   Change: `Popover.tsx:13` `sideOffset = 4` → `sideOffset = DEFAULT_POPOVER_SIDE_OFFSET` with `const DEFAULT_POPOVER_SIDE_OFFSET = 4;`; `DropdownMenu.tsx:9` `sideOffset = 8` → `DEFAULT_DROPDOWN_MENU_SIDE_OFFSET` (`= 8`); `Select.tsx:39` `sideOffset={4}` → `sideOffset={SELECT_SIDE_OFFSET}` with `const SELECT_SIDE_OFFSET = 4;`. Each constant is module-local.
   Check: `rg -n "sideOffset(=| = )\{?[0-9]" packages/ui/src` prints nothing; green.

6. Name the gauge geometry.
   Files: `packages/ui/src/components/GaugeDial.tsx`
   Change: `GaugeDial.tsx:82-86` `cx={100} cy={100} radius={83} stroke={14} gapDeg={1}` → `cx={DIAL_CENTER_X} cy={DIAL_CENTER_Y} radius={DIAL_RADIUS} stroke={DIAL_STROKE} gapDeg={DIAL_ZONE_GAP_DEG}` with module-local `const DIAL_CENTER_X = 100; const DIAL_CENTER_Y = 100; const DIAL_RADIUS = 83; const DIAL_STROKE = 14; const DIAL_ZONE_GAP_DEG = 1;`. The `viewBox="0 0 200 115"` string stays as it is (structural, read once).
   Check: `rg -n "=\{(100|83|14|1)\}" packages/ui/src/components/GaugeDial.tsx` prints nothing; green.

7. Rename the remaining camelCase module constants.
   Files: `packages/ui/src/components/ActionTile.tsx`, `packages/ui/src/components/Dialog.tsx`
   Change: `ActionTile.tsx:62` `rowClass` → `ROW_CLASS` (both uses at `:69`, `:79`); `Dialog.tsx:33` `cardPlacementStyle` → `CARD_PLACEMENT_STYLE` (use at `:95`). The keyed class maps (`variantClasses`, `sizeClasses`, `rowLookClasses`, …) are renamed by the exhaustive-record-maps plan, not here.
   Check: `rg -n "\browClass\b|\bcardPlacementStyle\b" packages/ui/src` prints nothing; green.

8. (packages/engine) Unexport the constants no other module imports.
   Files: `packages/engine/src/cadence.ts`, `packages/engine/src/decoupling.ts`, `packages/engine/src/effortDetection.ts`, `packages/engine/src/energy.ts`, `packages/engine/src/gradient.ts`, `packages/engine/src/stress.ts`, `packages/engine/src/trainingEffect.ts`
   Change: remove `export` from: `cadence.ts:9` `STEPS_PER_STRIDE`; `decoupling.ts:17-18` `DECOUPLING_MIN_SECONDS`, `MIN_GRADIENT_COVERAGE`; `effortDetection.ts:57-88`, all nineteen (`EFFORT_SIGNAL_DEFAULTS`, `EFFORT_SIGNAL_ORDER`, `EFFORT_SIGNAL_LIMITERS`, `EFFORT_BIN_S`, `EFFORT_MIN_SEGMENT_BINS`, `EFFORT_PENALTY_K`, `EFFORT_MAD_SCALE`, `EFFORT_DROPOUT_BINS`, `EFFORT_EDGE_TRACE_S`, `EFFORT_EDGE_SEARCH_S`, `EFFORT_HR_SHIFT_S`, `EFFORT_MAX_BRIDGE_S`, `EFFORT_ABSORB_S`, `EFFORT_MIN_STEADY_S`, `EFFORT_MIN_WARMUP_S`, `EFFORT_MIN_COVERAGE`, `EFFORT_MAX_WORK_SHARE`, `EFFORT_MIN_WORK_BLOCKS`, `EFFORT_MIN_CONTRAST`); `energy.ts:33-54`, all eight (`CYCLING_GROSS_EFFICIENCY`, `RUNNING_NET_COST_J_PER_KG_M`, `RESTING_J_PER_KG_S`, `JOULES_PER_KCAL`, `MIN_ENERGY_COVERAGE`, `ENERGY_UNCERTAINTY`, `KEYTEL_COEFFICIENTS`, `ENERGY_METHODS_BY_SPORT`); `gradient.ts:6` `GRADIENT_WINDOW_M`; `stress.ts:57-58,61` `THRESHOLD_HRR_MIN`, `THRESHOLD_HRR_MAX`, `DURATION_LOAD_PER_HOUR`; `trainingEffect.ts:47` `VT2_HRR`. Constants another module or a spec imports keep `export` (`MAX_MOVING_PAIR_GAP_S`, `EARTH_RADIUS_M`, `BANISTER`, `DEFAULT_THRESHOLD_HRR`, `SESSION_DERIVATION_VERSION`, `DECOUPLING_WELL_PACED_PCT`, `DECOUPLING_SCALE_PCT`, `HR_ZONE_DEFS`, `POWER_ZONE_DEFS`, `RACE_DISTANCE_METERS`, `SPORTS`, the three ACWR thresholds). Re-check each with `rg -nw <NAME> apps packages tools --glob '!node_modules' --glob '!tools/workbench/backlog/**'` before removing.
   Check: that `rg -nw` prints only the declaring module for each unexported name; green.

9. (packages/engine) Spell every unit suffix in long form.
   Files: `packages/engine/src/normalize.ts`, `packages/engine/src/effortDetection.ts`, `packages/engine/src/decoupling.ts`, `packages/engine/src/gps.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/src/gradient.ts`, `packages/engine/src/energy.ts`, `packages/engine/src/trainingEffect.ts`
   Change: rename declaration and every use: `MAX_MOVING_PAIR_GAP_S` → `MAX_MOVING_PAIR_GAP_SEC` (`normalize.ts:4,15`, `effortDetection.ts:3,170,185`); `DECOUPLING_MIN_SECONDS` → `DECOUPLING_MIN_SEC` (`decoupling.ts:17,114`); `EFFORT_BIN_S`, `EFFORT_EDGE_TRACE_S`, `EFFORT_EDGE_SEARCH_S`, `EFFORT_HR_SHIFT_S`, `EFFORT_MAX_BRIDGE_S`, `EFFORT_ABSORB_S`, `EFFORT_MIN_STEADY_S`, `EFFORT_MIN_WARMUP_S` → the same name ending in `_SEC` (`effortDetection.ts:70,78-84` and their uses at `:209,330-334,458,464,501-502,537,551,572,574`); `EARTH_RADIUS_M` → `EARTH_RADIUS_METERS` (`gps.ts:17,32`, `windExposure.ts:5,62`); `MIN_SEGMENT_M` → `MIN_SEGMENT_METERS` and `SECTOR_HALF_DEG` → `SECTOR_HALF_DEGREES` (`windExposure.ts:48,50,105,114,116`); `GRADIENT_WINDOW_M` → `GRADIENT_WINDOW_METERS` (`gradient.ts:6,50,56,67`); `RUNNING_NET_COST_J_PER_KG_M` → `RUNNING_NET_COST_JOULES_PER_KG_METER` and `RESTING_J_PER_KG_S` → `RESTING_JOULES_PER_KG_SEC` (`energy.ts:35,37,105,109`); `T_LIM_VO2MAX` → `T_LIM_VO2MAX_MIN` (`trainingEffect.ts:65,161`). Name the one constant called for its symbol rather than its reason: `DIMINISHING_P` → `AEROBIC_DOSE_RESPONSE_EXPONENT` (`trainingEffect.ts:53,155`). `GAP_CAP_SEC`, `NP_ROLLING_WINDOW_SEC`, `CTL_DAYS`, `ATL_DAYS` and the `DATA_MATURITY_*_DAYS` pair already conform.
   Check: `rg -n "\b[A-Z][A-Z0-9_]*_(S|M|DEG|SECONDS)\b|T_LIM_VO2MAX\b|DIMINISHING_P|J_PER_KG" packages/engine/src` prints nothing; green.

10. (packages/engine) Name the behaviour values still written inline.
   Files: `packages/engine/src/vdot.ts`, `packages/engine/src/trainingEffect.ts`, `packages/engine/src/effortDetection.ts`
   Change: every new constant is module-local and declared at the top of its module; each use reads the constant in place of the literal, and no expression is reordered.
   - `vdot.ts`: `const DANIELS_VO2_OFFSET = 4.6;`, `const DANIELS_VO2_LINEAR = 0.182258;`, `const DANIELS_VO2_QUADRATIC = 0.000104;` replace the duplicated coefficients in `vo2FromVelocity` (`:17`, `-DANIELS_VO2_OFFSET + DANIELS_VO2_LINEAR * velocityMetersPerMin + DANIELS_VO2_QUADRATIC * velocityMetersPerMin * velocityMetersPerMin`) and `velocityFromVo2` (`:38-40`, `const a = DANIELS_VO2_QUADRATIC; const b = DANIELS_VO2_LINEAR; const c = -(DANIELS_VO2_OFFSET + vo2);`); `const FASTEST_RACE_TIME_MIN = 8;`, `const SLOWEST_RACE_TIME_MIN = 600;` are the bisection bounds (`:71-72`); `const BISECTION_MAX_ITERATIONS = 50;` (`:82`) and `const BISECTION_TOLERANCE_MIN = 1e-6;` (`:84`). The `pctVo2max` coefficients (`:21`) are read once each and stay inline.
   - `trainingEffect.ts`: `const TE_SCALE_MAX = 5;` replaces the `5` in both `Math.min(5, …)` (`:155`, `:161`); the band starts `const TE_OVERREACHING = 5;`, `const TE_HIGHLY_IMPROVING = 4;`, `const TE_MAINTAINING = 2;`, `const TE_MINOR = 1;` together with the existing `TE_IMPROVING` (3.0) replace the literals in `getTrainingEffectLabel` (`:176-180`) and `getTrainingEffectSummary` (`:191-198`), e.g. `if (aerobic < TE_MINOR && anaerobic < TE_MINOR) return 'too_easy';`.
   - `effortDetection.ts`: `const MIN_NOISE_SIGMA = 1e-3;` replaces both literals in `noiseSigma` (`:391`). The `Math.max(2, …)` log floor at `:398` stays inline (read once, meaningful only there, R4).
   Check: `rg -n "1e-3|1e-6|0\.182258|0\.000104|Math\.min\(5" packages/engine/src` prints only the constant declarations; `rg -n ">= [1-5]\.0|< [1-5]\.0" packages/engine/src/trainingEffect.ts` prints nothing; green.

11. (packages/engine) Put every module into the engine's declaration order.
   Files: `packages/engine/src/gps.ts`, `packages/engine/src/vdot.ts`, `packages/engine/src/metrics.ts`, `packages/engine/src/coaching.ts`, `packages/engine/src/trainingEffect.ts`, `packages/engine/src/energy.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/src/effortDetection.ts`, `packages/engine/src/decoupling.ts`, `packages/engine/src/climbs.ts`, `packages/engine/src/gradient.ts`
   Change: move declarations, never bodies, so each module reads imports, types and interfaces, constants, unexported helpers, exported functions: `gps.ts` — `EARTH_RADIUS_METERS` (`:17`) and `CLUSTER_RADIUS_DEGREES` above every function, `boundsCenter` and `scaledDistDeg` (`:210-225`) above the first exported function; `vdot.ts` — `THRESHOLD_INTENSITY` (`:44`) and item 10's constants under `RACE_DISTANCE_METERS`, `velocityFromVo2` (`:37-42`) beside the other two helpers above `calculateVdot`; `metrics.ts` — `CTL_DAYS`, `ATL_DAYS` (`:78-79`) under the imports; `coaching.ts` — the ACWR and data-maturity constants (`:37-50`) beside the TSB constants above `getFormStatus`; `trainingEffect.ts` — `TELabelKey` and `TESummaryKey` (`:87-104`) under `TrainingEffectThresholds`; `energy.ts` — `MethodPick` (`:56`) above the constants; `windExposure.ts` — `ValidPoint` (`:52-56`) beside `WindSegment` above the constants; `effortDetection.ts` — `BlockKind`, `Piece`, `Grid`, `Bin`, `Segment`, `SignalLevels` (`:90-127`) above `EFFORT_SIGNAL_DEFAULTS`; `decoupling.ts` — `CountedInterval`, `RunInterval` (`:20-28`) above the constants; `climbs.ts` — `ClimbSpan`, `ClimbEffort` (`:37-46`) above `CLIMB_RULES`; `gradient.ts` — `GradientNode` (`:8-12`) above `GRADIENT_WINDOW_METERS`.
   Check: a human reads each listed module top to bottom in that order; `vp run check` and `vp run test` pass (moving declarations changes nothing at runtime).

12. (packages/engine) Rewrite the engine's layout and constants rules.
   Files: `packages/engine/CLAUDE.md`
   Change: the **Module layout** bullet (`CLAUDE.md:10`) and the **Constants** bullet (`CLAUDE.md:13`) are replaced by:

   ```md
   - **Module layout**: Every file follows: imports, types and interfaces (exported or not), constants (exported or not), unexported helpers, exported functions.
   - **Constants**: A value that governs behaviour (threshold, bound, iteration limit, coefficient read more than once) is a module-scope `UPPER_SNAKE_CASE` constant declared at the top of the module, named for its reason with its unit in long form (`_SEC`, `_MIN`, `_MS`, `_METERS`, `_DEGREES`, `_DAYS`). It is exported only when another module or a spec imports it. Lookup tables as `Record<>` or `Map<>`.
   ```

   Check: a human reads `packages/engine/CLAUDE.md:10,13` against `tdr/behavioural-constants-hoisted-upper-snake.md` §2 R1, R6, R7; `rg -n "exported, declared at file top" packages/engine/CLAUDE.md` prints nothing.

### packages/gpx

Items 13–16 bind `packages/gpx/src` like the engine. Line numbers are today's; the engine-holds plan has already removed the polyline block from `routeGeometry.ts`, so find the lines by their text. Each item's check includes `vp run check` clean and `vp run test` passing.

13. (packages/gpx) Spell the hysteresis suffix in long form.
   Files: `packages/gpx/src/routeGeometry.ts`
   Change: `ELEVATION_HYSTERESIS_M` → `ELEVATION_HYSTERESIS_METERS` at the declaration (`:28`) and both uses (`:77`, `:80`).
   Check: `rg -n "\b[A-Z][A-Z0-9_]*_(S|M|DEG|SECONDS)\b" packages/gpx/src` prints nothing.

14. (packages/gpx) Name the output precisions of the GPX writer.
   Files: `packages/gpx/src/buildGpx.ts`
   Change: below the three interfaces (`:1-20`) declare `const COORDINATE_DECIMALS = 6;` and `const ELEVATION_DECIMALS = 1;`, both unexported; `toFixed(6)` becomes `toFixed(COORDINATE_DECIMALS)` (`:61` twice, `:85`, `:86`) and `toFixed(1)` becomes `toFixed(ELEVATION_DECIMALS)` (`:63`, `:89`). The two-point minimum (`:35`) stays inline: it is what a track is (R4).
   Check: `rg -n "toFixed\([0-9]" packages/gpx/src` prints nothing; `packages/gpx/tests/buildGpx.spec.ts` and its file snapshot pass unchanged.

15. (packages/gpx) Put every gpx module into the declaration order.
   Files: `packages/gpx/src/routeGeometry.ts`
   Change: move the exported `groupBySegment` (`:30-44`) below `computeElevationStats` and directly above `buildRouteGeometry`, body unchanged, so the module reads imports, types and interfaces, constants, unexported helpers (`steepestGrade`, `computeElevationStats`), exported functions. `steepestGrade` and `computeElevationStats` call `groupBySegment` only when they run, after the module has initialised, so the order changes nothing at runtime. `buildGpx.ts`, `parseGpx.ts`, `routeCut.ts` and `routeProfile.ts` already follow the order.
   Check: a human reads the five modules of `packages/gpx/src` top to bottom in that order.

16. (packages/gpx) Write the layout and constants rules into the gpx rules.
   Files: `packages/gpx/CLAUDE.md`
   Change: add after the **Pure** bullet (`CLAUDE.md:8`):

   ```md
   - **Module layout**: Every file follows: imports, types and interfaces (exported or not), constants (exported or not), unexported helpers, exported functions.
   - **Constants**: A value that governs behaviour (threshold, bound, output precision) is a module-scope `UPPER_SNAKE_CASE` constant at the top of the module, named for its reason with its unit in long form (`ELEVATION_HYSTERESIS_METERS`), and exported only when another module or a spec imports it.
   ```

   Check: `rg -n "\*\*Module layout\*\*|\*\*Constants\*\*" packages/gpx/CLAUDE.md` prints two lines.

### tools/docs

Line numbers are today's; where an earlier plan already edited a module, find the line by its text. Durations (`timeout`, `waitForTimeout`) are named by the native-date-and-duration-constants plan, not here. Every new constant is module-local and sits with the existing constants at the top of its module; the unit-length plan later moves each one into the topic module of the unit that reads it.

**Banner check** (items 17–19): before the item run `vp run docs:banner --locale de` and `vp run docs:banner --locale en` and copy `docs/banners/de_banner.png` and `docs/banners/en_banner.png` into a directory outside the repo; after it run both again and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;[print(n,ImageChops.difference(Image.open(f'{sys.argv[1]}/{n}_banner.png').convert('RGBA'),Image.open(f'docs/banners/{n}_banner.png').convert('RGBA')).getbbox()) for n in ('de','en')]" <that-directory>`, which must print `de None` and `en None`.

17. (tools/docs) Name the capture's behaviour values (R1, R7).
   Files: `tools/docs/banner/capture.ts`
   Change: each bare literal becomes a module-scope constant with the same value, read where the literal stood:
   - `PARKED_MOUSE_INSET = 2` for both `2`s in `page.mouse.move(2, viewport.height - 2)` (`:105`).
   - `SETTLE_FRAME_COUNT = 3` for `frame < 3` in `waitForStill` (`:121`); `HOVER_SETTLE_FRAME_COUNT = 4` for `frame < 4` in `isOverTrack` (`:231`).
   - `SESSION_SCROLL_MAX_STEPS = 200` for `i < 200` in `openSession` (`:205`).
   - `GEO_DOT_COLOR_TOLERANCE = 24` for `distance > 24` in `findPositionDot` (`:281`).
   - The hero frame geometry (`:346-349`): `HERO_FRAME_OFFSET_X = 70`, `HERO_FRAME_OFFSET_Y = 280`, `HERO_FRAME_WIDTH = 480`, `HERO_LOCATE_FRAME_HEIGHT = 970`, `HERO_PICK_FRAME_HEIGHT = 695`, so `clamp(dot.x - HERO_FRAME_OFFSET_X, 0, MAP_WIDTH - HERO_FRAME_WIDTH)`, `clamp(dot.y - HERO_FRAME_OFFSET_Y, 0, HERO.height - HERO_LOCATE_FRAME_HEIGHT)`, `{ x, y, width: HERO_FRAME_WIDTH, height: HERO_LOCATE_FRAME_HEIGHT }` and `{ x, y, width: HERO_FRAME_WIDTH, height: HERO_PICK_FRAME_HEIGHT }`.
   - `SHOT_PADDING = 8` for the second argument of every `padded(…, 8)` (`:379`, `:513`, `:527`, `:567`).
   - `SHEET_HANDLE_CLEARANCE = 12` for `- 12` in `mapBottom` (`:411`); `SPIRAL_STEP = 12` for the step argument of both `spiral(…)` calls (`:412`, `:503`); `STUDIO_SPIRAL_RADIUS = 300` for `300` (`:503`); `MAP_EDGE_MARGIN = 8` for the four `8`s of the point filter (`:413`).
   - `CHART_SCROLL_GAP = 8` for `+ 8` in `scrollTarget` (`:453`); `CHART_SCROLL_TOLERANCE = 1` for `toBeLessThanOrEqual(1)` (`:457`).
   - `SPLIT_SLIDER_STEPS = 5` for `step < 5` (`:521`).
   - `FILTER_READINGS_BOTTOM_PADDING = 12` for `+ 12` in the filter clip height (`:545`).
   - `BANNER_VIEWPORT = { width: 1600, height: 1180 }` for `test.use({ viewport: { width: 1600, height: 1180 } })` (`:593`), and `expect(await boxOf(banner)).toEqual({ x: 0, y: 0, ...BANNER_VIEWPORT })` (`:607`).
   Check: `rg -n "\b(200|24|70|280|480|970|695|300|1600|1180)\b|, 8\)|[-+] (8|12)\b|frame < [34]|step < 5|LessThanOrEqual\(1\)|move\(2" tools/docs/banner/capture.ts` prints only the constant declarations; `vp check` from `tools/docs/` is clean; banner check passes.

18. (tools/docs) Name the module constants for their reason, in UPPER_SNAKE (R2, R7).
   Files: `tools/docs/banner/capture.ts`, `tools/docs/playwright.config.ts`, `tools/docs/banner/tiles.ts`
   Change: renames, values unchanged, every reader updated:
   - `capture.ts`: `ANCHOR` (`:37`, read at `:57`) → `FROZEN_CLOCK_TIME`; `DESKTOP` (`:38`) → `DESKTOP_VIEWPORT`; `HERO` (`:39`) → `HERO_VIEWPORT`; `MOBILE` (`:40`) → `MOBILE_VIEWPORT`; `repoRoot` (`:15`) → `REPO_ROOT`.
   - `capture.ts:48` `const WEATHER_SESSION = 'Dachau loop';` reads the name from the demo schedule like the other three sessions: `const WEATHER_SESSION = DEMO_WORKOUTS.dachauRide.name;` with `DEMO_WORKOUTS` added to the `@pacevault/web/demo/schedule` import (`:9`). Today `apps/web/src/features/demo/demoSchedule.ts:196` declares `name: 'Dachau loop'`; if that name differs when this item runs, leave `WEATHER_SESSION` as it is.
   - `playwright.config.ts`: `webApp` (`:11`, read at `:41`) → `WEB_APP_DIR`.
   - `tiles.ts`: `FILTER_READINGS` (`:28`, read at `:31-32` and `capture.ts:536`) → `FILTER_READING_COUNT`; `EN_FILTER` (`:35`) → `EN_TYPED_FILTER`; `DE_FILTER` (`:36`) → `DE_TYPED_FILTER`.
   Check: `rg -n "\b(ANCHOR|DESKTOP|HERO|MOBILE|repoRoot|webApp|FILTER_READINGS|EN_FILTER|DE_FILTER)\b|'Dachau loop'" tools/docs/banner tools/docs/playwright.config.ts` prints nothing; `vp check` from `tools/docs/` is clean; banner check passes.

19. (tools/docs) Name the frame height and the backdrop shot of the banner page (R1, R6).
   Files: `tools/docs/banner/page/Banner.tsx`, `tools/docs/banner/tiles.ts`
   Change: `h-[556px]`, the height of every flow frame, is written three times (`Banner.tsx:82`, `:85`, `:106`). Add `const FRAME_HEIGHT_CLASS = 'h-[556px]';` (`'h-556px'` if the styled-api-over-sx plan already swapped it for its px token) below `TEXT_ZOOM` (or below the imports if the styled-api plan already removed `TEXT_ZOOM`) and read it so each class attribute keeps its exact text and order: `:82` `className="h-[556px]"` → `className={FRAME_HEIGHT_CLASS}`; `:85` `className="flex h-[556px] flex-col gap-2"` → `className={cn('flex', FRAME_HEIGHT_CLASS, 'flex-col gap-2')}`; `:106` `className="flex h-[556px] w-12 flex-none items-center justify-center text-text-tertiary"` → `className={cn('flex', FRAME_HEIGHT_CLASS, 'w-12 flex-none items-center justify-center text-text-tertiary')}`. The backdrop is found by position today (`Banner.tsx:142` `BANNER_FLOWS[0]?.frames[1]?.file`): add `export const BACKDROP_FILE = '1b-heatmap-pick.png';` to `tiles.ts` above `BANNER_FLOWS`, use it in the heatmap flow's second frame (`tiles.ts:94` `{ file: BACKDROP_FILE, below: '1b-heatmap-export.png' }`), import it in `Banner.tsx`, delete `const backdrop = …` (`:142`) and render the backdrop `<div>` (`:149-155`) without the `{backdrop && (…)}` guard, with `style={{ backgroundImage: \`url(${shotUrl(BACKDROP_FILE)})\` }}`.
   Check: `rg -c "h-\[556px\]|h-556px" tools/docs/banner/page` prints `1`; `rg -n "frames\[1\]|backdrop &&" tools/docs/banner/page` prints nothing; in the browser devtools the three elements carry the same `class` attribute text as before; `vp check` from `tools/docs/` is clean; banner check passes.

### tools/workbench

Line numbers are today's; where an earlier plan already edited a module, find the line by its text. Every new constant is module-local and sits with the module's other constants above the unit that reads it, unless the item says otherwise. Mermaid theme colours, class strings and the `classDef` lines are design values (R5) and stay as they are.

**Workbench check.** Save this script outside the repo (for example as `wb-probe.sh` in your scratch directory). Before the item run `bash <path>/wb-probe.sh <dir>/before`, after it `bash <path>/wb-probe.sh <dir>/after`; `diff -r <dir>/before <dir>/after` must print nothing. It feeds representative inputs to the three hooks and the CLI entry points and records each one's stdout, stderr and exit code; it writes nothing into the repo.

```bash
set -u
OUT="$1"
REPO="$(git rev-parse --show-toplevel)"
WB="$REPO/tools/workbench/scripts"
FIX="$(mktemp -d)/fix"
ITEM="$FIX/tools/workbench/backlog/demo"
mkdir -p "$ITEM/review" "$OUT"
printf -- '---\ntitle: Demo\nstatus: planned\ncreated: 2026-10-23\ntype: chore\nareas: [workbench]\nnext: Go\n---\n\n## Real-data checks\n\n- [ ] One\n\n## Open questions\n\n- **Q1** · open · Pick? (a) x (b) y\n' > "$ITEM/plan.md"
printf -- '## Agent decisions\n\n- [ ] **(scope) Keep it.** Agent: fits.\n' > "$ITEM/review/decisions.md"
P="$ITEM/plan.md"
D="$ITEM/review/decisions.md"
N="$FIX/tools/workbench/backlog/fresh/plan.md"
edit() { printf '{"tool_name":"Edit","tool_input":{"file_path":"%s","old_string":"%s","new_string":"%s"}}' "$1" "$2" "$3"; }
write() { printf '{"tool_name":"Write","tool_input":{"file_path":"%s","content":"%s"}}' "$1" "$2"; }
shell() { printf '{"tool_name":"Bash","tool_input":{"command":"%s"},"cwd":"%s"}' "$1" "$FIX"; }
run() {
  printf '%s' "$3" | (cd "$REPO" && WB_ROOT="$FIX/tools/workbench/backlog" node "$WB/$2" ${4:-}) >"$OUT/$1.out" 2>"$OUT/$1.err"
  echo $? >"$OUT/$1.code"
  perl -pi -e "s|\Q$FIX\E|FIX|g" "$OUT/$1.out" "$OUT/$1.err"
}
run sg-ready statusGuard.ts "$(edit "$P" 'status: planned' 'status: ready')"
run sg-skip statusGuard.ts "$(edit "$P" 'status: planned' 'status: in-dev')"
run sg-back statusGuard.ts "$(edit "$P" 'status: planned' 'status: idea')"
run sg-text statusGuard.ts "$(edit "$P" 'next: Go' 'next: Go on')"
run sg-tick statusGuard.ts "$(edit "$P" '- [ ] One' '- [x] One')"
run sg-size statusGuard.ts "$(edit "$P" 'next: Go' 'next: Go\nsize: small')"
run sg-new-idea statusGuard.ts "$(write "$N" '---\ntitle: F\nstatus: idea\ncreated: 2026-10-23\nnext: Go\n---\n')"
run sg-new-planned statusGuard.ts "$(write "$N" '---\ntitle: F\nstatus: planned\ncreated: 2026-10-23\nnext: Go\n---\n')"
run sg-dec-tick statusGuard.ts "$(edit "$D" '- [ ] **(scope)' '- [x] **(scope)')"
run sg-dec-kindless statusGuard.ts "$(edit "$D" 'Agent: fits.' 'Agent: fits.\n- [ ] **Other.** Agent: why.')"
run sg-dec-bare statusGuard.ts "$(edit "$D" '- [ ] **(scope) Keep it.** Agent: fits.' '- [~] **(scope) Keep it.** Agent: fits.')"
run sg-dec-pointer statusGuard.ts "$(edit "$D" '- [ ] **(scope) Keep it.** Agent: fits.' '- [~] **(scope) Keep it.** Agent: fits. Superseded by: Q2')"
run sg-sed statusGuard.ts "$(shell "sed -i '' s/Go/On/ tools/workbench/backlog/demo/plan.md")"
run sg-redirect statusGuard.ts "$(shell 'echo x > tools/workbench/backlog/demo/review/decisions.md')"
run sg-rm statusGuard.ts "$(shell 'rm -rf tools/workbench/backlog/demo')"
run sg-find statusGuard.ts "$(shell 'find tools/workbench/backlog -name x -delete')"
run sg-cd statusGuard.ts "$(shell 'cd tools/workbench/backlog/demo && rm plan.md')"
run sg-read statusGuard.ts "$(shell 'cat tools/workbench/backlog/demo/plan.md')"
run sg-other statusGuard.ts '{"tool_name":"Read","tool_input":{"file_path":"x"}}'
run sg-bad statusGuard.ts 'not json'
run wg-sub-commit workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"},"agent_id":"a"}'
run wg-sub-reset workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git -C . reset --hard"},"agent_type":"item-worker"}'
run wg-sub-status workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git status"},"agent_id":"a"}'
run wg-owner-commit workerGitGuard.ts '{"tool_name":"Bash","tool_input":{"command":"git commit -m x"}}'
run wg-bad workerGitGuard.ts 'not json'
run ih-plan indexHook.ts "{\"tool_input\":{\"file_path\":\"$P\"}}"
run ih-decisions indexHook.ts "{\"tool_input\":{\"file_path\":\"$D\"}}"
run ih-other indexHook.ts '{"tool_input":{"file_path":"/tmp/x.md"}}'
run ih-bad indexHook.ts 'not json'
run check-cli check.ts ''
run deps-usage deps.ts ''
run deps-missing deps.ts '' zz-no-such-item
run interfaces-usage interfaces.ts ''
run interfaces-missing interfaces.ts '' zz-no-such-item
```

**Board check** (items that touch `site/`): with the board on `http://localhost:4321` (reuse a running board, `lsof -iTCP -sTCP:LISTEN -P | grep :4321`; start one with `vp run workbench` only when none runs, and stop it afterwards), before the item run `vp -C tools/workbench exec playwright screenshot --viewport-size=1512,860 --wait-for-timeout=3000 http://localhost:4321 <dir>/board-before.png`, after it the same into `<dir>/board-after.png`, and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;print(ImageChops.difference(Image.open(sys.argv[1]).convert('RGBA'),Image.open(sys.argv[2]).convert('RGBA')).getbbox())" <dir>/board-before.png <dir>/board-after.png`, which must print `None`. Then open an item with all four tabs, walk Mockup, Plan, Tech (Planned | Actual switch, Full screen) and Review, open Answer… on a question and close it, and confirm by eye that nothing looks or behaves differently.

**Suite**: `vp check` from `tools/workbench/` is clean, `vp run -F @pacevault/workbench check` passes (astro sync + astro check), and `vp test -- --run` from `tools/workbench/` passes 66 tests (13 spec files today; a later item that splits a spec changes the file count, never the test count).

20. (tools/workbench) One `scripts/paths.ts` for the repo, backlog and workbench locations and their environment overrides (R6, R8; owner decision).
   Files: new `tools/workbench/scripts/paths.ts`; `tools/workbench/scripts/{check,cleanup,deps,interfaces,changedFiles}.ts`, `tools/workbench/site/src/actions/index.ts`, `tools/workbench/site/src/lib/devPlugin.ts`, `tools/workbench/site/astro.config.mjs`
   Change: today the same locations are computed in seven places under three different meanings of "workbench": `REPO_ROOT` (`cleanup.ts:70`, `deps.ts:459`, `interfaces.ts:347`), the repo-relative backlog `BACKLOG` (`cleanup.ts:39`, `deps.ts:462`, `interfaces.ts:350`; with a trailing slash at `changedFiles.ts:24`), the absolute backlog `WORKBENCH` (`cleanup.ts:72`), the `WB_ROOT`-aware backlog `workbenchRoot()` (`check.ts:21-22`) with its copy in `site/astro.config.mjs:9` and its result `WORKBENCH_ROOT` (`actions/index.ts:54`), `tools/workbench/` itself `WORKBENCH` (`devPlugin.ts:31`), the guide (`actions/index.ts:56`, `astro.config.mjs:11`) and the `WB_BASE` reads (`deps.ts:594`, `interfaces.ts:388`). `paths.ts` holds them once, with today's values:

   ```ts
   import { join, resolve } from 'node:path';
   import { fileURLToPath } from 'node:url';

   export const REPO_ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
   export const BACKLOG_DIR = 'tools/workbench/backlog';
   export const BACKLOG_PATH = join(REPO_ROOT, BACKLOG_DIR);
   export const WORKBENCH_DIR = fileURLToPath(new URL('../', import.meta.url));
   export const GUIDE_FILE = fileURLToPath(new URL('../GUIDE.md', import.meta.url));

   export const backlogRoot = (): string => resolve(process.env.WB_ROOT ?? BACKLOG_PATH);

   export const baseRevisionOverride = (): string | undefined => process.env.WB_BASE;
   ```

   (`new URL` instead of `import.meta.dirname`, because the module also loads inside Vite while Astro reads its config and serves the actions.) Readers: `cleanup.ts` reads `REPO_ROOT`, `BACKLOG_DIR` (was `BACKLOG`) and `BACKLOG_PATH` (was `WORKBENCH`, which is not `WB_ROOT`-aware and stays so); `deps.ts` and `interfaces.ts` read `REPO_ROOT`, `BACKLOG_DIR` and `baseRevisionOverride()`, and `deps.ts:478` builds the depcruise path as `join(WORKBENCH_DIR, 'node_modules', '.bin', 'depcruise')`; `changedFiles.ts` drops its `BACKLOG` and tests `change.path.startsWith(\`${BACKLOG_DIR}/\`)`; `check.ts` deletes `workbenchRoot` and its `main` calls `backlogRoot()`; `actions/index.ts` imports `backlogRoot` and `GUIDE_FILE` and renames `WORKBENCH_ROOT` to `BACKLOG_ROOT = backlogRoot()` at every use; `devPlugin.ts` imports `WORKBENCH_DIR` (relative specifier `'../../../scripts/paths.ts'`, it loads with the config) in place of its `WORKBENCH`; `astro.config.mjs` imports `{ backlogRoot, GUIDE_FILE } from '../scripts/paths.ts'` and passes `workbenchFiles({ root: backlogRoot(), guideFile: GUIDE_FILE })`, dropping its own `root`, `guideFile` and the `fileURLToPath` import. Messages keep their exact text (they print `BACKLOG_DIR`, which is today's `BACKLOG`).
   Check: `rg -n "import\.meta\.dirname|process\.env\.(WB_ROOT|WB_BASE)|workbenchRoot|WORKBENCH_ROOT|const (BACKLOG|WORKBENCH|REPO_ROOT) " tools/workbench/scripts tools/workbench/site --glob '!paths.ts'` prints nothing; workbench check; board check; suite.

21. (tools/workbench) Name the inline buffer sizes, the diff context, the depcruise config arguments and the tech tab's zoom and Mermaid limits (R1, R2, R7).
   Files: `tools/workbench/scripts/changedFiles.ts`, `tools/workbench/scripts/deps.ts`, `tools/workbench/scripts/interfaces.ts`, `tools/workbench/site/src/lib/writeBack.ts`, `tools/workbench/site/src/lib/board.ts`, `tools/workbench/site/src/scripts/tech.ts`, `tools/workbench/site/src/app/AnswerDialog.tsx`
   Change:
   - `changedFiles.ts:82` `maxBuffer: 64 * 1024 * 1024` → `const GIT_MAX_BUFFER_BYTES = 64 * 1024 * 1024;`.
   - `deps.ts:483` `maxBuffer: 256 * 1024 * 1024` → `const DEPCRUISE_MAX_BUFFER_BYTES = 256 * 1024 * 1024;`; `CRUISE_ARGS` (`:464-471`) is split into `const CRUISE_CONFIG_ARGS = ['--config', 'tools/workbench/.dependency-cruiser.cjs', '--output-type', 'json'];` and `const CRUISE_ARGS = [...CRUISE_CONFIG_ARGS, 'apps/web/src', 'packages'];`, and the three `CRUISE_ARGS.slice(0, 4)` (`:545`, `:560`, `:574`) read `CRUISE_CONFIG_ARGS`; `changes.base.slice(0, 7)` (`:600`) → `const SHORT_SHA_LENGTH = 7;`.
   - `board.ts:588` `files.base.slice(0, 7)` → its own module-local `SHORT_SHA_LENGTH = 7`.
   - `interfaces.ts:153` `LINE` → `MAX_PRINT_WIDTH` (it is the width past which a type is broken over lines), at its use `:165`.
   - `writeBack.ts`: `const DIFF_CONTEXT_LINES = 3;`; `:238` `index - last.end <= 6` → `index - last.end <= 2 * DIFF_CONTEXT_LINES`; `:243` `Math.max(0, hunk.start - 3)` → `Math.max(0, hunk.start - DIFF_CONTEXT_LINES)` and `hunk.end + 4` → `hunk.end + DIFF_CONTEXT_LINES + 1`.
   - `tech.ts`: `maxEdges: 3000` → `MERMAID_MAX_EDGES`, `maxTextSize: 300000` → `MERMAID_MAX_TEXT_SIZE` (`:26-27`); in `zoomAt` (`:96`) `view.fit / 2` → `view.fit * MIN_SCALE_PER_FIT` with `MIN_SCALE_PER_FIT = 0.5` and `8` → `MAX_SCALE = 8`; `:114` `Math.exp(-event.deltaY * 0.002)` → `Math.exp(-event.deltaY * WHEEL_ZOOM_RATE)` with `WHEEL_ZOOM_RATE = 0.002`.
   - `AnswerDialog.tsx:24` `QUICK` → `QUICK_ANSWERS` (it holds the two quick-answer texts), at its use `:66`.
   Every value stays the same number or string (`x / 2` and `x * 0.5` are the same double).
   Check: `rg -n "1024 \* 1024|slice\(0, (4|7)\)|<= 6|- 3\)|\+ 4\)|0\.002|maxEdges: 3|\bQUICK\b|\bLINE\b" tools/workbench/scripts tools/workbench/site/src` prints nothing; workbench check; board check; suite.

22. (tools/workbench) Follow the surface constants into the shared mockup tokens.
   Files: `tools/workbench/shared/tokens.css`
   Change: item 1 renamed the kit's surface constants and moved them to `packages/ui/src/lib/surfaces.ts`. The comment at `tokens.css:62-63` names `packages/ui/src/components/Card.tsx` and `scrimClass`, and `:69` names `floatingClass`: they become `packages/ui/src/lib/surfaces.ts`, `SCRIM_CLASS` and `FLOATING_CLASS`. No token value changes.
   Check: `rg -n "scrimClass|floatingClass|components/Card\.tsx" tools/workbench/shared` prints nothing.

## Open items

- R3 of the source convention (keyed lookup records in UPPER_SNAKE) is carried by exhaustive-record-maps-over-branching R9 (`<VALUE>_BY_<KEY>`), which already binds this project; it is not restated here.
- `lib/colors.ts` (`SURFACE_BASE`, a hoisted hex literal, R5 and R8) is folded into `tokens.ts` by the styled-api-over-sx plan.
- `DOCK_STACK_GAP` (`lib/dockGeometry.ts:2`), exported but read only inside its module (R6), loses its `export` in the index-modules-are-not-barrels plan.
- `TOAST_DURATION_MS` (`Toast.tsx:46`, R7) is introduced by the native-date-and-duration-constants plan.
- `tools/workbench/shared/tokens.css:63,69` mention `scrimClass`/`floatingClass` in CSS comments; that file is outside `packages/ui` and outside lint, and is left to the workbench.
- `SHEET_MOMENTUM.timeConstant: 200` (`lib/sheetDrag.ts:5`) keeps its key: the field name is imposed by motion's inertia options and the value already sits inside a named constant.

- `packages/engine`: R5 (design values) has nothing to act on once the engine-holds-domain-logic-only plan moved the zone colours out. Formula coefficients read once (`pctVo2max`, the GAP curve, the Keytel and Banister tables, which are already named) stay where they are read. Seconds-domain conversions (`/ 60`, `/ 3600`, `* 1000` for metres) are arithmetic, not behaviour, as the native-date plan already records.

- `packages/gpx`: the route minimums (`points.length < 2` in `parseGpx.ts:93`, `buildGpx.ts:35`, `routeGeometry.ts:61,91`) and the ×100 fraction-to-percent conversion (`routeGeometry.ts:53`, `routeProfile.ts:38`) stay inline: they define a line and a percentage, not a tuning value. The `creator="PaceVault"` attribute (`buildGpx.ts:40`) is read once inside the header literal and stays there.

- `tools/docs`: the pixel sizes in the banner page's class strings (`h-[1180px]`, `w-[1600px]`, `gap-[22px]`, `h-[674px]`, `h-[320px]`, `h-[398px]`, `h-[150px]`, `w-[246px]`, `blur-[28px]`, `rounded-[10px]`) are design values (R5) read once each; the styled-api-over-sx plan swaps them for exact px theme tokens (`h-1180px`, `rounded-10px`, …); only `h-[556px]`, read three times as the frame height, becomes a constant (item 19). `ArrowRight size={28}` (`Banner.tsx:107`) is an icon size read once and stays. The assertion `toBeGreaterThan(2)` (`capture.ts:358`) states the capture's expectation and stays inline.
- `tools/workbench`: the Mermaid theme colours (`site/src/scripts/tech.ts`), the graph `classDef` colours (`scripts/deps.ts`) and the item-type colours (`site/src/lib/vocabulary.ts`) are design values (R5) and are not hoisted here. `site/astro.config.mjs` reads the backlog through `backlogRoot()` after item 20, which resolves a relative `WB_ROOT` against the working directory before handing it to the dev plugin; every caller sets it to an absolute fixture path.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
