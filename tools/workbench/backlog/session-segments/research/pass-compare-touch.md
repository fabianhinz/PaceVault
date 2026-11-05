# Pass compare on touch: controls for two passes (R51)

Task: the Pass times scatter on the segment page works only with a mouse. Find controls that compare two passes (Durchgänge) and work the same with a mouse and on a 390 px phone, keeping the defaults settled so far. The scatter may go (owner: "i don't need to have the scatter plot").

## Why the scatter fails on touch (facts)

- Selection rides on hover state. A click reads `hoveredPassSessionId` and selects it (`apps/web/src/components/segments/PassScatter.tsx:139-144`); that id is set only in `onPointerMove` (`apps/web/src/components/segments/hooks/useScatterScrub.ts:41-50`, wired at `PassScatter.tsx:204-207`). A tap sends no pointer move before the click in mobile browsers, so the id is `null` and the tap does nothing (to confirm on a device; the code path is unambiguous for a tap without movement).
- A horizontal touch drag is the native scroll of the `overflow-x-auto` container (`PassScatter.tsx:198-199`); the drag-scroll hook ignores every pointer but the mouse (`apps/web/src/lib/hooks/useDragScroll.ts:18`). Once the browser takes the pan, the pointer is cancelled, so scrubbing by finger cannot work either.
- `onPointerLeave` clears the hover (`PassScatter.tsx:209-212`, `useScatterScrub.ts:51-54`), and the explorer preview reads only that hover (`apps/web/src/components/segments/hooks/useScatterPreviewPass.ts:5-7`, `apps/web/src/components/segments/SegmentDetail.tsx:73`), so touch also never previews.
- The dots are 4 px (`PassScatter.tsx:23`); any per-dot hit target would be far below 44 px. Snapping to the nearest pass by x (`useScatterScrub.ts:12-30`) is the only workable hit rule for a finger.

The rail readout (`apps/web/src/components/segments/ScatterRail.tsx:39-53`) and the preview are hover concepts. On touch there is no hover, so every variant below makes selection a direct tap, not a hover-then-click.

## The defaults to keep (verified)

| #   | Default                                                                                                                                                                                                                                                                                                              | Where it holds today                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | The comparison is "selected pass (A) vs best (B)". The best is always one side, drawn solid amber, and cannot be deselected; a click on it does nothing.                                                                                                                                                             | `apps/web/src/components/segments/hooks/useSegmentPassSelection.ts:26`; explorer gets `selected` and `best` (`SegmentDetail.tsx:71-75`); pairs only when they differ (`apps/web/src/components/segments/charts/hooks/useSegmentChartRows.ts:33-37`); R38 |
| D2  | A defaults to the `?from=` pass when opened from a session, else the latest pass. When that pass is the best, only the best is plotted.                                                                                                                                                                              | `useSegmentPassSelection.ts:9-11`; Q64; `useSegmentChartRows.ts:33-34`                                                                                                                                                                                   |
| D3  | A second click on A deselects it; with no A the explorer plots only the best (amber line, legend "Best").                                                                                                                                                                                                            | `useSegmentPassSelection.ts:27-29`; `SegmentDetail.tsx:73` (`selected ?? best`); unpaired line amber at `apps/web/src/components/segments/charts/SegmentChannelChart.tsx:28-29`; R38                                                                     |
| D4  | The pick resets when the segment or the origin changes.                                                                                                                                                                                                                                                              | scope `useSegmentPassSelection.ts:13`, remount `SegmentDetail.tsx:63`                                                                                                                                                                                    |
| D5  | The dashboard filter applies as a view (count, list, best, rank, explorer, markers); the `?from=` pass always stays.                                                                                                                                                                                                 | `apps/web/src/components/segments/hooks/useSegmentDetail.ts:27-36`; R34                                                                                                                                                                                  |
| D6  | All passes inside the filter are loaded before the charts show; skeleton until then. So switching A never waits.                                                                                                                                                                                                     | `useSegmentChartRows.ts:24-32`, `:39-41`; `apps/web/src/components/segments/charts/SegmentChartsExplorer.tsx:29-31`; R44                                                                                                                                 |
| D7  | Tabs "Times" / "Passes" (`Zeiten` / `Durchgänge`), `?tab=times\|passes`, default times.                                                                                                                                                                                                                              | `SegmentDetail.tsx:54-58`; `apps/web/src/routing/segmentTab.ts:1-8`; `packages/i18n/messages/de.json:789-790`; R44                                                                                                                                       |
| D8  | The Passes tab lists every filtered pass newest first, regular `md` cards, the best keeps crown and border where it falls, a card opens its session.                                                                                                                                                                 | `apps/web/src/components/segments/PassList.tsx:12-18`; `apps/web/src/components/segments/PassItem.tsx:38-42`; R36, R45                                                                                                                                   |
| D9  | Pass values: the best shows its time, every other pass the signed gap to the best.                                                                                                                                                                                                                                   | `PassItem.tsx:31-32`; rail reading `apps/web/src/components/segments/scatterScrub.ts:16-26`                                                                                                                                                              |
| D10 | Explorer colours: A in each channel's own colour, the best solid amber; legend a neutral swatch with A's date and an amber "Best".                                                                                                                                                                                   | `SegmentChannelChart.tsx:28-29`, `:64-81`; `apps/web/src/components/segments/charts/SegmentExplorerLegend.tsx:19-31`; R30, R33                                                                                                                           |
| D11 | Hovering a pass (card or dot) never moves a map marker; markers appear only while scrubbing the explorer.                                                                                                                                                                                                            | R39; `apps/web/src/store/segmentFocus.ts:27-38`                                                                                                                                                                                                          |
| D12 | With a mouse, hovering a pass previews it in the explorer and returns to A on leave.                                                                                                                                                                                                                                 | `useScatterPreviewPass.ts:5-7`, `SegmentDetail.tsx:73`; R44 (V5)                                                                                                                                                                                         |
| D13 | The Pass times row: summary-card row, expanded by default, header "Pass times · n passes", "1 pass · only this session so far" at one unfiltered pass.                                                                                                                                                               | `apps/web/src/components/segments/PassTimesRow.tsx:22-33`, `:47`; Q53, Q65                                                                                                                                                                               |
| D14 | Scatter-only defaults (keep only if the scatter stays): last 10 passes in view, scroll back for older (Q75, Q76); no axis, legend or caption (Q67); dots in the sport colour at reduced opacity, trend line in front, best amber with crown (Q63, Q70); rail rest "Best" + trend, scrubbed date, time and gap (R44). | `PassScatter.tsx:24`, `:58-71`, `:96-101`, `:234-244`; `apps/web/src/components/segments/segmentPasses.ts:6`; `ScatterRail.tsx:39-53`                                                                                                                    |
| D15 | One amber best family and crown for the best everywhere.                                                                                                                                                                                                                                                             | Q61, Q70; `PassItem.tsx:41-42`                                                                                                                                                                                                                           |

Layout facts that shape the variants: the segment page lives in the side panel on desktop (about 460 px wide, `research/scatter-scrub.md` V1 risk) and in the bottom sheet on phone, so desktop and phone widths differ by only ~70 px. "Same action, same place" (`apps/web/CLAUDE.md:46`) is therefore easy to keep: one layout serves both.

## Kit pieces available

- `PvActionItem` already has `selected` (rendered as `aria-pressed`, `bg-white/10`) and a `trailing` slot outside the main button, so "tap selects, chevron opens" needs no kit change (`packages/ui/src/components/pvActionItem/PvActionItem.tsx:30`, `:33`, `:52`, `:60-61`, `:91-95`).
- Stepper precedent: `LapStepper` (`apps/web/src/components/sessions/session/LapStepper.tsx:28-80`) with `StepButton`, 44 px hit area around a 36 px circle (`apps/web/src/components/sessions/session/StepButton.tsx:12-33`), labels `ui_lap_prev` / `ui_lap_next` / `ui_lap_clear` (`packages/i18n/messages/en.json:778-780`).
- `PvResponsivePopover`: popover on desktop, dialog on phone, one call site (`packages/ui/src/components/pvResponsivePopover/PvResponsivePopover.tsx:30-68`). A second `PvBottomSheet` would stack on the page's own sheet; the responsive popover avoids that.
- `PvSegmentedControl` (Radix toggle group, text labels only, `packages/ui/src/components/pvSegmentedControl/PvSegmentedControl.tsx:7`, `:30-70`) and `PvSelect` (text items only, `packages/ui/src/components/pvSelect/PvSelectItem.tsx:6-20`) cannot hold a date + time + gap + crown row without kit changes.
- `useDragScroll` (mouse drag on a horizontal strip, `useDragScroll.ts:12-39`) and `useScrollFadeEffect` (used at `PassScatter.tsx:132`) serve any horizontal strip.

## Real-world references

- **Strava Effort Comparison** (subscriber): from a segment, "Compare" opens a roster; the first effort is the baseline the others are compared to, x axis is distance along the segment. Close to D1 (best = baseline). [Strava support: Effort Comparison](https://support.strava.com/hc/en-us/articles/216918567-Effort-Comparison), [BikeRadar launch article](https://www.bikeradar.com/features/routes-and-rides/strava-launches-effort-comparison-tool).
- **intervals.icu Compare Activities**: activities are added to a compare list from the calendar or by search, then overlaid. List-with-slots model. [intervals.icu: Compare Activities](https://www.intervals.icu/features/compare-activities/).
- **Garmin Connect segments**: own efforts via the leaderboard filter "Only Me" / "Me Only"; a list, no chart picker. [Garmin forum: compare attempts on a segment](https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-mobile-andriod/406344/compare-attempts-on-a-segment).
- **Apple Watch Race Route** (watchOS 10, from memory, no link verified): you race either your best or your last result on a route, a two-option choice of the opponent. Matches D1/D2 (best vs last or origin).

None of them picks passes on a scatter; all pick from a list or a fixed baseline.

## Variants

Shared for every variant: the selection model stays `useSegmentPassSelection` (A picked, B = best, D1–D4); only the control that writes it changes. The order of the passes the control walks is by date. "Desktop" is the ~460 px side panel, "Phone" the 390 px bottom sheet (~358 px content after the 16 px gutters). Sketch notation: `♛` crown, `●` selected, `◆` best (amber), `·` other pass.

### V1 · Keep the scatter, make a tap select

Scatter and rail stay as built. A tap (or click) selects the pass nearest to the tap's x, computed from the tap position itself instead of from the hover state; a second tap on the selected pass deselects (D3); a tap nearest to the best does nothing (D1). Mouse keeps scrub + rail + explorer preview (D12). Touch scrolls the window natively and has no scrub and no preview.

```
Desktop (≈460 px)                           Phone (390 px)
┌ ⁘ Pass times · 39 passes ────────── ˅ ┐   ┌ ⁘ Pass times · 39 passes ─── ˅ ┐
│ BEST     │      ·   ◆♛          ·     │   │ BEST    │    ·  ◆♛      ·    │
│ 5:55     │  · ──·──────·──●───·──     │   │ 5:55    │ ·──·─────·──●──    │
│ trend 6:04│ ·        ·      ·       ● │   │ trend…  │·       ·     ·   ● │
└───────────────────────────────────────┘   └────────────────────────────────┘
                    tap ↑ selects the nearest pass by x
```

- **Pick A**: mouse unchanged (hover snaps, click selects); touch: tap anywhere in the plot, nearest pass by x; horizontal swipe scrolls to older passes.
- **Defaults**: D1–D15 all hold; D12 stays mouse-only (no hover on touch).
- **Cost**: S. Read `clientX` from the click event in `PassScatter.tsx:139-144` and reuse `nearestPass` (`useScatterScrub.ts:12-30`); export it or move it to `scatterScrub.ts`. No kit change.
- **Risks**: the owner's ask is "controls to compare", this keeps the gesture he finds unusable on touch, only fixed. On touch the rail stays at rest, so the tapped pass's date and time are visible only in the explorer legend. Passes a few days apart sit a few px apart; a finger hits the right one by luck. No keyboard access to passes.

### V2 · Scatter as overview + a pass stepper under it

The scatter becomes read-only overview (tap still selects as V1); a stepper below it carries the selection: `‹  12 Sep 2026 · 6:12 · +0:17  ›  ✕`. ‹ › step A to the previous/next pass by date, skipping the best; ✕ clears A (D3, best only). The stepped pass lights its dot and the scatter scrolls it into view.

```
Desktop                                     Phone (390 px)
┌ ⁘ Pass times · 39 passes ────────── ˅ ┐   ┌ ⁘ Pass times · 39 passes ─── ˅ ┐
│ BEST 5:55│      ·   ◆♛          ·     │   │ BEST    │   ·  ◆♛       ·    │
│ trend 6:04│ · ──·──────·──●───·──     │   │ 5:55    │·──·────·──●──      │
│          │ ·        ·      ·       ·  │   │         │·      ·     ·   ·  │
│ ┌──────────────────────────────────┐  │   │ ┌────────────────────────────┐ │
│ │ ‹   12 Sep 2026 · 6:12 · +0:17  › ✕│  │   │ │ ‹ 12 Sep 2026 · +0:17  › ✕ │ │
│ └──────────────────────────────────┘  │   │ └────────────────────────────┘ │
└───────────────────────────────────────┘   └────────────────────────────────┘
```

- **Pick A**: ‹ › on both, arrow keys on desktop (`useKeyPressEvent` like `LapStepper.tsx:22`); tap / click on the scatter as in V1; ✕ clears.
- **Defaults**: D1–D14 hold. D12: hovering the stepper's ‹ › previews nothing; the scatter keeps its mouse preview. Phone drops the time and keeps the gap (the explorer rails show the time).
- **Cost**: S–M. A `PassStepper` next to `LapStepper` with `StepButton` (`StepButton.tsx:12-33`), a `stepPass` helper in `segmentPasses.ts` over `passesByDate` (`segmentPasses.ts:28-29`), scroll-into-view in the scatter. New keys: previous / next / clear pass.
- **Risks**: stepping through 90 passes one by one is slow; jumping far back still needs the scatter (touch: tap). Two controls for one choice.

### V3 · Compare bar with two slots (A ⇄ Best) and a pass picker — no scatter

The Pass times row body becomes a compare bar: slot A (the selected pass: date, time, gap, ‹ › to step, tap the middle to open the picker) and slot B (Best, amber, crown, not interactive). The picker is a list of all filtered passes newest first in the D8/D9 item look, best crowned and disabled for picking, A marked selected. Desktop: popover anchored to slot A; phone: dialog (one `PvResponsivePopover`). The trend moves into the row header's secondary line ("39 passes · trend 6:04").

```
Desktop                                       Phone (390 px)
┌ ⁘ Pass times · 39 passes · trend 6:04 ─ ˅ ┐  ┌ ⁘ Pass times · 39 passes ─── ˅ ┐
│ ┌──────────────────────────┐ ┌───────────┐ │  │ ┌────────────────────────────┐ │
│ │‹  12 Sep 2026        ✕  ›│ │♛ Best     │ │  │ │‹ 12 Sep 2026    6:12  ✕  › │ │
│ │   6:12 · +0:17   ▾       │ │  5:55     │ │  │ │  +0:17 · 9th fastest   ▾   │ │
│ └──────────────────────────┘ │  3 May 25 │ │  │ ├────────────────────────────┤ │
│                              └───────────┘ │  │ │♛ Best · 3 May 2025    5:55 │ │
└────────────────────────────────────────────┘  │ └────────────────────────────┘ │
                                                └────────────────────────────────┘
Picker (desktop popover / phone dialog "Choose a pass")
┌────────────────────────────────────────┐
│ ● Morning run · 12 Sep 2026     +0:17  │  ← selected (aria-pressed)
│   Isar loop · 5 Sep 2026        +0:31  │
│ ♛ 6×800 m Isar · 3 May 2025      5:55  │  ← best, not pickable
│   …  (newest first, filtered, virtualised past ~30)
└────────────────────────────────────────┘
```

- **Pick A**: ‹ › steps by date (skipping the best); tap / click the slot opens the picker; tap a row picks and closes; ✕ clears A (D3). Mouse: hovering a picker row previews it in the explorer and leaving returns to A (D12 kept, mouse only).
- **Defaults**: D1 (B fixed amber, crown, no control), D2–D11 and D13 hold; D14 drops with the scatter; D15 holds. Phone stacks the slots (A full width, Best below) since two 170 px slots cannot hold date + time + gap; the controls keep their place inside slot A (`apps/web/CLAUDE.md:46`).
- **Cost**: M. Slots: plain markup in the summary row (`GLASS_CLASS` surfaces) plus `StepButton`; picker: `PvResponsivePopover` + `PvActionItem` sm with `selected` (no kit change); the picker reuses the `PassItem` value logic (`PassItem.tsx:28-32`). Removes `PassScatter.tsx`, `ScatterRail.tsx`, `scatterScrub.ts`, `useScatterScrub.ts`, `useScatterScrollEndEffect.ts`, `PassTimesRow.spec.tsx` scatter cases. New keys: choose / previous / next / clear pass, the picker title.
- **Risks**: the trend over time (the scatter's one insight) shrinks to a number. The picker and the Passes tab show nearly the same list (one picks, one opens); a reader may expect both to do the same. Dialog on phone covers the explorer while picking, so touch users see the result only after closing (desktop popover sits beside it).

### V4 · Pass strip: one row of chips, newest on the right — no scatter

The row body is a horizontal strip of compact chips, one per filtered pass, in date order (newest at the right end, scrolled there on open like the scatter's last-10 window). A chip shows the date and the gap (the best its time, amber, crown). A tap / click selects A; tapping A again clears it; the best chip is fixed-on (D1). Below the strip one line reads out A against the best.

```
Desktop                                         Phone (390 px)
┌ ⁘ Pass times · 39 passes · trend 6:04 ── ˅ ┐  ┌ ⁘ Pass times · 39 passes ── ˅ ┐
│ ░┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐  │  │ ░┌──────┐┌──────┐┌──────┐┌───│
│ ░│3 May │♛3 May││22 Aug││5 Sep ││12 Sep│  │  │ ░│22 Aug││5 Sep ││12 Sep││19 │
│ ░│+0:44 ││ 5:55 ││+0:22 ││+0:31 ││+0:17 │  │  │ ░│+0:22 ││+0:31 ││+0:17 ││+0:│
│ ░└──────┘└──◆───┘└──────┘└──────┘└──●───┘  │  │ ░└──────┘└──────┘└──●───┘└───│
│ 12 Sep 2026 · 6:12 · +0:17 vs ♛ 5:55        │  │ 12 Sep 2026 · 6:12 vs ♛ 5:55 │
└────────────────────────────────────────────┘  └───────────────────────────────┘
```

- **Pick A**: touch: swipe the strip, tap a chip; mouse: wheel / drag-scroll (`useDragScroll`), click a chip; keyboard: Tab to the strip, ← → between chips (Radix toggle group semantics). Hovering a chip previews it in the explorer (D12, mouse).
- **Defaults**: D1–D13, D15 hold; D14's last-10 window becomes "scrolled to the newest"; the chip height could encode the time as a mini bar (an optional visual echo of the scatter, see open question 3).
- **Cost**: S–M. A `PassStrip` component in `components/segments/` with `useDragScroll` and `useScrollFadeEffect`; chips as buttons with `aria-pressed`. Kit check: no chip with a pressed state exists (`PvChip` is a static caption, `packages/ui/src/components/pvChip/PvChip.tsx:11-20`); per `ui-primitives-from-react-ui` the toggle chip goes into the kit first (`PvToggleChip` or a `selected` + `onClick` on `PvChip`).
- **Risks**: at 390 px ~4 chips are visible; reaching a pass from a year ago is a long swipe (no jump). Same-day passes are not possible (one pass per session), but several sessions on one date would show identical date labels. A horizontal scroller inside the bottom sheet competes with the sheet's vertical drag only diagonally; the native `overflow-x` handles it.

### V5 · The pass list itself selects — no scatter

The Pass times row shows the passes as condensed items (`PvActionItem` sm) newest first: the item tap selects it for the explorer (`selected`), the trailing chevron opens the session. Collapsed: the best, A, and the 3 newest, then "Show n more passes" / "Show fewer" (the Q60 / R8 pattern). This is the Q54 (a) pattern before R44 moved the list into its own tab.

```
Desktop                                         Phone (390 px)
┌ ⁘ Pass times · 39 passes · trend 6:04 ── ˅ ┐  ┌ ⁘ Pass times · 39 passes ── ˅ ┐
│ ┌────────────────────────────────────────┐ │  │ ┌───────────────────────────┐ │
│ │▣ Evening run · 19 Sep 2026   +0:29   › │ │  │ │▣ Evening run…   +0:29   › │ │
│ │▣ Morning run · 12 Sep 2026   +0:17   › │●│  │ │▣ Morning run…   +0:17   › │●│
│ │▣ Isar loop · 5 Sep 2026      +0:31   › │ │  │ │▣ Isar loop…     +0:31   › │ │
│ │♛ 6×800 m Isar · 3 May 2025    5:55   › │ │  │ │♛ 6×800 m Isar…   5:55   › │ │
│ └────────────────────────────────────────┘ │  │ └───────────────────────────┘ │
│              Show 35 more passes            │  │      Show 35 more passes      │
└────────────────────────────────────────────┘  └───────────────────────────────┘
```

- **Pick A**: tap / click an item (second tap clears, best ignored); › opens the session. Hover an item: explorer preview (D12, mouse).
- **Defaults**: D1–D13, D15 hold; D8 stays in the Passes tab (where a tap opens), which makes the two lists differ only in what the tap does.
- **Cost**: S. `PvActionItem` already has `selected` and a separate `trailing` (`PvActionItem.tsx:30`, `:33`, `:91-95`); `useListExpansion` exists in `components/segments/hooks/`. Removes the scatter files as V3.
- **Risks**: the Times tab grows by 4–5 rows on phone and pushes the explorer below the fold of the sheet. The same item reacting differently in two tabs (select vs open) is the confusion R44 removed by splitting the tabs. Arguably the Passes tab becomes redundant.

### V6 · Swipeable pass cards (carousel) — no scatter

One card per pass, full width of the row, snapped; the visible card is A. The card shows date, session name, time, gap, rank. Swipe (touch) or ‹ › (both) moves to the neighbour; dots / "12 of 39" below. The best card is amber; landing on it shows "best only" in the explorer.

```
Desktop                                         Phone (390 px)
┌ ⁘ Pass times · 39 passes ─────────────── ˅ ┐  ┌ ⁘ Pass times · 39 passes ── ˅ ┐
│ ┌─────────────────────────────────────┐▌   │  │ ┌──────────────────────────┐▌│
│ │ Morning run · 12 Sep 2026            │▌   │  │ │ Morning run · 12 Sep 2026 │▌│
│ │ 6:12   +0:17 vs ♛ 5:55  · 9th fastest│▌   │  │ │ 6:12  +0:17 · 9th fastest│▌│
│ └─────────────────────────────────────┘▌   │  │ └──────────────────────────┘▌│
│ ‹               38 of 39               › ✕ │  │ ‹        38 of 39        › ✕ │
└────────────────────────────────────────────┘  └───────────────────────────────┘
```

- **Pick A**: swipe or ‹ ›; arrow keys on desktop.
- **Defaults**: D3 bends: there is always a card in view, so "no A" needs the extra ✕; D1 holds; landing on the best card shows only the best (consistent with D2's "latest is best" case). D2, D4–D11, D13, D15 hold.
- **Cost**: M. CSS scroll-snap carousel plus a scroll-end → selection sync (an effect on the scroll container, `effects-are-rare` allows it as a DOM sync), ‹ › buttons that scroll; no kit carousel exists. ‹ › ✕ sit below the card at both widths ("same action, same place"); `▌` is the peek of the next card.
- **Risks**: selection by scroll position fires a chart switch on every snap while swiping through; a mis-swipe changes the comparison. Same slow-jump problem as V2. Largest new behaviour for what V2 gives with a stepper.

## Comparison

| Variant                 | Scatter         | Touch pick       | Jump far back | Keyboard | Cost | Main risk                                       |
| ----------------------- | --------------- | ---------------- | ------------- | -------- | ---- | ----------------------------------------------- |
| V1 tap on scatter       | kept            | tap nearest by x | swipe + tap   | no       | S    | still imprecise on touch, no readout            |
| V2 scatter + stepper    | kept (overview) | ‹ › or tap       | swipe + tap   | yes      | S–M  | two controls for one choice                     |
| V3 compare bar + picker | dropped         | ‹ ›, picker      | picker        | yes      | M    | trend shrinks to a number                       |
| V4 pass strip           | dropped         | tap chip         | long swipe    | yes      | S–M  | slow to reach old passes; kit chip needed       |
| V5 selecting list       | dropped         | tap item         | show more     | yes      | S    | duplicates the Passes tab, pushes explorer down |
| V6 card carousel        | dropped         | swipe, ‹ ›       | none          | yes      | M    | every snap swaps the charts                     |

## Shortlist

1. **V3 · compare bar + picker** (recommended)
2. **V2 · scatter + stepper** (if the trend picture must stay)
3. **V4 · pass strip** (if a visible row of all passes matters more than jumping)

## Recommendation

**V3.** It is literally "controls to compare two passes": slot A is the pass you pick, slot B is the best, and both are visible as what they are, so D1 (best always one side, not deselectable) becomes something the user sees instead of a rule they discover by clicking. Every action is a button (‹ › ✕ and the slot that opens the picker), so mouse, touch and keyboard do the same thing in the same place at 460 px and at 390 px. The picker jumps to any pass in two taps, ‹ › covers the common "the run before / after" case, and the mouse keeps its explorer preview while hovering picker rows (D12). D6 (all passes loaded first) makes every switch instant, which is what makes a tap-to-compare model feel as direct as the scrub did. It matches how Strava (baseline + roster) and intervals.icu (compare list) frame comparison. The scatter's one unique insight, the trend, survives as "trend 6:04" in the row header; if the owner misses the picture, V2 is the fallback with the same stepper.

Proposed copy (facts only, `packages/i18n/CLAUDE.md` §Translation rules 3, 6):

| Key (proposal)           | en               | de                     |
| ------------------------ | ---------------- | ---------------------- |
| `ui_segment_pass_prev`   | Previous pass    | Vorheriger Durchgang   |
| `ui_segment_pass_next`   | Next pass        | Nächster Durchgang     |
| `ui_segment_pass_clear`  | Clear pass       | Durchgang abwählen     |
| `ui_segment_pass_choose` | Choose a pass    | Durchgang wählen       |
| `ui_segment_pass_none`   | No pass selected | Kein Durchgang gewählt |

The clear and step labels mirror `ui_lap_prev` / `ui_lap_next` / `ui_lap_clear` (`packages/i18n/messages/de.json:778-780`).

## Open questions (owner decisions)

1. **Does the scatter stay?** (a) drop it, trend as a number in the row header (V3, V4, V5, V6); (b) keep it as a read-only overview next to a stepper (V2); (c) keep it as the control, fixed for taps (V1). Recommendation: (a).
2. **Is B always the best?** (a) yes, B is the fixed best slot, amber, not pickable (D1, R38 as today); (b) B is pickable too, the best only its default, so any two passes compare; the amber line then means "the best" only while B is the best, and the explorer legend and colours (R30, R33) need a rule for a non-best B. Recommendation: (a); the owner's "compare two different Durchgänge" is met by A being free.
3. **What ‹ › walk through?** (a) by date, skipping the best (it is already B); (b) by date including the best (landing on it shows the best only); (c) by time, fastest to slowest. Recommendation: (a), the same order as the Passes list and the old scatter.
4. **Where the picker opens on phone.** (a) a dialog through `PvResponsivePopover` (popover on desktop); (b) the list expands inline inside the Pass times row on both widths (no overlay, pushes the explorer down while open). Recommendation: (a): the explorer is the point of the page and an inline list would push it out of the sheet.
5. **Keep the "nothing selected" state (D3)?** (a) yes, ✕ in slot A clears it, the explorer shows the best only; (b) no, A is always some pass (the latest non-best by default), no ✕. Recommendation: (a), it is R38 as decided.
