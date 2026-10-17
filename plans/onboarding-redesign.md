# Onboarding redesign (PLAN, ready for review)

> Decisions are settled. Approach and the sections after it follow the round-5 mockup (`mockups/onboarding/index.html`). Line numbers are against the current branch; `AppLayout.tsx` shifts by one line once `plans/training-load-recompute.md` lands.

## Context

Today, onboarding is one `ActionPromptCard` with three `ActionTile`s that expand inline (`src/pages/OnboardingPage.tsx:43-116`). It is mounted as a plain `max-w-2xl` main (`src/components/layout/AppLayout.tsx:100-104`) over an empty, always-mounted map (`AppLayout.tsx:76`). The owner calls it dated.

Compared in `mockups/onboarding/index.html`: A glass over glow, B one thing at a time, C split hero, D demo-first reveal, then the heroes H1–H4. **B won for the flow and H1 for the hero.**

## Decisions (settled)

- **Scope:** same steps, same data (source, profile, import). Only the look and the flow change.
- **Flow: B, "one thing at a time".** One question per screen, with a progress bar and "n/4". Reuse existing UI components as much as possible.
- **Intro step before the flow:** says what the app is and what the next screens ask.
- **Hero: H1.**
  - The live map with demo routes drawing in. No floating info cards.
  - The facts sit as inline crumbs in the privacy line: `Stays on this device · Works offline · Interactive map · Open source ↗`.
  - "Open source" links to the existing `GITHUB_URL` (`src/features/settings/AboutSection.tsx:8`); the constant should be shared.
- **Tone:** free and open source. No selling or nudging, e.g. no "takes about 2 minutes". Lead with the facts: the interactive map and working offline.
- **Intro copy:**
  - No "Next" heading.
  - No "Everything else can be added later" helper.
  - The crumb line wraps naturally and shows all four crumbs.
- **Hybrid layout:** the hero stays reachable during the flow.
  - Phone: the flow sits in the existing `Dialog` (`DialogContent` + Header/Body/Footer). It already has drag-to-dismiss (`DialogCard`, `src/components/ui/Dialog.tsx:45-113`).
  - Dragging it down reveals the hero; a `FloatingPill` "Continue setup · n/N" reopens it at the same question.
  - `BottomSheet` stays unchanged.
  - New prop `DialogContent scrim={false}` (default `true`). It renders no `DialogOverlay` (`src/components/ui/Dialog.tsx:115-117`) and calls `preventDefault` in `onPointerDownOutside` / `onInteractOutside`. The call site uses `DialogRoot modal={false}`, so the map receives gestures.
  - The card closes only via the grabber (tap or drag) and Escape (Radix default, unchanged). Taps on the map never close it.
- **Step layout (desktop and phone):** progress bar with "n/4", then the title (question) and subtitle, then fields and footer. No header icon, no icon tile, no duplicate short title.
- **Crumbs:** no icon.
- **DE demo copy:** "Demo ansehen" everywhere; EN "Try demo data".
- **Logo loader: L3, grow and retract.** It runs for at least one full cycle, and loading that takes longer finishes the current cycle cleanly.
- **Gender: binary and required, app-wide.**
  - Remove `other` from Settings (`src/features/settings/ThresholdsSection.tsx:45`) and from the schema (`src/store/user.ts:71`).
  - No migration and no version bump. The owner confirmed no profile uses `other`.
- **Review round 2 (2026-10-17), replacing the flow below:**
  - Screen 2 "You & heart rate" adds optional weight and birth year.
  - Screen 3 becomes "Your thresholds", with optional FTP and optional threshold pace. Threshold pace includes the existing race-time estimator (`PaceEstimatorDialog.tsx`).
  - Still 4 screens.
  - Every optional field states in its helper line what it unlocks (calories, zones, training load, efforts). The line is factual, and an error replaces it in the same reserved line. "Add later in Settings" appears once per screen.
  - **Review round 3:** the Source step has no Back and no Continue; tapping a source tile advances directly. The gender error goes in a reserved line under the tiles, consistent with the inputs.
  - Continue is always enabled; pressing it with invalid fields reveals their errors and focuses the first one.
- **Flow (4 screens, original decision):**
  1. Source
  2. You & heart: gender, rest HR, max HR (required)
  3. Bike: FTP (optional)
  4. Import

  Threshold pace, weight and birth year are deferred to Settings.

- **Copy:** "Test Data" becomes "Try demo data" (DE "Demo ansehen").
- **intervals.icu form:** reserve a fixed-height status line.
- **Depends on** `plans/training-load-recompute.md`, which needs to land first so that thresholds can be deferred.
- **Map during onboarding:** pan and zoom only. Track click and hover already have no effect, because no handlers are passed while `!onboardingComplete` (`src/features/map/DeckGLOverlay.tsx:90-94`).
- **Demo preview seeding: (a), in memory only.**
  - On first start, lazy-load and decode `src/features/demo/demoRoutes.json` into a preview PathLayer that renders only while `!onboardingComplete`.
  - Nothing is persisted.
  - The "demo data" choice still calls `loadDemoData` (`src/features/demo/loadDemoData.ts:15`) as it does today.
- **First-start loading:** an animated `public/logo.svg` (L3, see above). The logo's cyan and blue must never be used on the map (CLAUDE.md §6).
- **Import progress:** reuse the existing full-screen `ImportProgressOverlay`. No custom progress.
- **No reduced-motion handling.**
- **Profile:**
  - Rest HR and max HR are required (`src/features/settings/hooks/useThresholdsForm.ts:114-118`).
  - Birth year, weight, threshold pace and FTP are optional, with "add later" hints.
  - Gender has nothing preselected, and the user must pick it. Today it silently defaults to male (`useThresholdsForm.ts:40`).
- **Settled on 2026-10-17 (former open questions):**
  - The step state is not persisted; a reload restarts at the loader and intro.
  - `Crumbs` gets an opt-in `wrap` prop. Only the onboarding line uses it, and the StatTile notes stay as they are.
  - After the import the camera fits the imported tracks, with no draw-in of the user's own tracks.
  - The intervals.icu key is lost when the phone card is closed on the import screen; that is accepted.

## Open

None. All questions answered on 2026-10-17.

## Approach

### 1. Flow state

- New `src/store/onboarding.ts`, not persisted (see Open 1). Scope-named actions, called via `getState()`:
  - `step: 'intro' | 'source' | 'you' | 'bike' | 'import'`, `source: 'intervals' | 'fit' | 'demo' | null`, `onboardingCardOpen: boolean` (phone), `onboardingPreviewRevealed: boolean`.
  - Actions: `startOnboardingSetup`, `pickOnboardingSource`, `nextOnboardingStep`, `previousOnboardingStep`, `setOnboardingCardOpen`, `revealOnboardingPreview`.
- Progress: `source` 1, `you` 2, `bike` 3, `import` 4, shown as "n/4". The intro has no bar.
- Transitions:
  - Intro: "Get started" goes to `source`, and "Try demo data" starts the demo.
  - `source`: Continue is disabled until a pick. Demo then starts the demo, and the other picks go to `you`.
  - Then `you` → `bike` → `import`. Back walks one step back, and from `source` it returns to the intro.
- **Demo:** `startOnboardingDemo(queryClient)` is the current `handleGenerate` (`src/pages/OnboardingPage.tsx:31-41`), moved unchanged into the feature. It skips the profile; `loadDemoData` sets the dataset profile (`loadDemoData.ts:24`).
- **Form:** one `useThresholdsForm('create')` in `OnboardingFlow`, which sits above the card or dialog, so values survive the steps and a phone close/reopen. `profileGate` stays `{ ready: thresholds.valid, save: thresholds.save }` (`OnboardingPage.tsx:28-29`). It is passed only on the import screen, so the profile, including FTP, is still written once at import (`IntervalsConnectionForm.tsx:75`, `src/features/sessions/FitUploadButton.tsx:25`).
- **Per-screen gates** (`useThresholdsForm.ts`):
  - The hook returns `fieldValid(field)`, i.e. `errors[field] === ''`.
  - `you`: `form.gender !== null && fieldValid('restHr') && fieldValid('maxHr')`.
  - `bike`: `fieldValid('ftp')`; empty is valid, because `isRequired` is false for an empty stored FTP (`:114-118`).
  - Threshold pace, weight and birth year are never shown and stay empty, so they don't block `valid`.
- HR stays required, so `thresholdsAt` and the HR schema don't change. This answers the recompute plan's open question 4: nothing to do here.

### 2. Gender: binary, required

- `src/packages/engine/types.ts:7`: `Gender = 'male' | 'female'`.
- `src/store/user.ts:71`: `z.enum(['male', 'female'])`. No migration (settled).
- `useThresholdsForm.ts`:
  - `FormValues.gender: Gender | null` (`:13`), and `storedForm(null)` gives `gender: null` (`:40`).
  - `isGender` drops `'other'` (`:162-163`).
  - `valid` also requires `form.gender !== null` (`:225`).
  - `save` narrows `gender` before `createProfile` (`:170-191`, `:247-257`). `saveChanges` skips a `null` gender (`:199`).
- Settings: drop the `other` item (`ThresholdsSection.tsx:45`). The Select keeps `form.gender ?? undefined` (`:38`); in update mode the profile always has a gender.
- Engine / lib, non-female handling:
  - `stress.ts:70-73` and `trainingEffect.ts:122-125` already map everything that isn't female to male. They need no change beyond the type.
  - `energy.ts:79-87`: Keytel averages male and female for `other`. The averaging branch goes: `EnergyBody.gender` becomes optional (`:12`), and without a gender there is no heart-rate interval, the same as a missing age (`:112-113`). Missing is missing.
  - `src/lib/moreStats.ts:152`: pass `thresholds?.gender` and drop `?? 'other'`. A gender is missing only when there are no thresholds, and then weight and age are missing too, so Keytel never ran there anyway.

### 3. Layout

- `AppLayout.tsx:100-104`: `{!onboardingComplete && <OnboardingPage />}` without the `max-w-2xl` main. `OnboardingPage` becomes a thin container that renders `<OnboardingFlow />`.
  - Desktop map padding already ignores `main` during onboarding (`src/features/map/mapPadding.ts:24`).
- **Desktop** (`useDevice().isDesktop`, `lg`):
  - The intro is a `<Card floating>`, `fixed left-6 top-1/2 -translate-y-1/2 z-10 w-[440px] p-6`.
  - The flow card is `fixed left-6 top-6 bottom-6`. Its header is `OnboardingProgress`, then a scrolling body (`scroll-fade` + `useScrollFadeEffect`), then the footer.
  - The footer reuses `DialogFooter` (a plain div whose `lg:` classes give the right-aligned row).
  - The question is `Typography h1`, and the subtitle is `body1 textSecondary`.
  - Both cards carry `data-layout="onboarding-card"` for the camera padding.
- **Phone:**
  - `DialogRoot open={onboardingCardOpen} onOpenChange={setOnboardingCardOpen} modal={false}` + `DialogContent scrim={false}`. It opens on reveal, so the routes draw in above the card.
  - `DialogBody` holds `OnboardingProgress`, the question as `DialogTitle className="text-2xl font-bold"` (it keeps the accessible name), the subtitle as `DialogDescription`, then the fields.
  - `DialogFooter` is `grid-cols-[auto_1fr]` in the flow (compact Back), and keeps the two equal columns on the intro.
  - `DialogHeader` is not used: it has no slot for the progress bar, and its title is too small for the question.
  - While the card is closed, a `FloatingPill` sits `fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 -translate-x-1/2 z-10` with a `ListChecks` icon. It reads "Start setup" on the intro and "Continue setup · n/4" otherwise, and opens the card at the same step.
- **`DialogContent scrim`** (`Dialog.tsx:115-142`):
  - `scrim?: boolean`, default `true`, pulled out of the props before the spread (like `Card.tsx:24`). With `false` it renders no `<DialogOverlay />` (`:117`).
  - `onPointerDownOutside` / `onInteractOutside` call `e.preventDefault()` and then the caller's handler.
  - Escape stays the Radix default. Radix itself renders no Overlay for a non-modal root, so the prop also makes the call site's intent explicit.
- **Screens:**
  - Source: three `ActionTile layout="row"` (`CloudDownload`, `FolderUp`, `Database`), then the crumb line.
  - You: the gender as two `ActionTile` rows (`User`), with a required `Label`, then `Label required` + `Input` for rest and max HR (`reserveHelper`, with the hint or the `visibleError`).
  - Bike: the FTP `Input` with the "add later" hint.
  - Import, intervals.icu: `IntervalsConnectionForm` as it is, with `profileGate` and `onSynced={completeOnboarding}`. There is no footer primary; the form's own button imports.
  - Import, FIT: the body is the crumb line, and the footer primary is `FitUploadButton`, with `profileGate` and the same `onUploaded` as `OnboardingPage.tsx:100-104`.
- **Intro:**
  - The logo (inline, small) + "PaceVault" (`Typography title`), the tagline (`h1`) and the description.
  - Then `List` / `ListItem` with an `IconTile` (`CloudDownload`, `HeartPulse`, `Database`) for the three asks, then the crumb line.
  - CTAs: "Try demo data" (secondary) and "Get started".
- **Crumb line:**
  - `Typography caption textTertiary` with `Crumbs wrap` (Open 2). The items are the three facts plus an `<a href={GITHUB_URL} target="_blank" rel="noreferrer">` "Open source" + `ExternalLink` icon (12 px, `text-accent`).
  - `GITHUB_URL` is exported from `AboutSection.tsx:8`, not duplicated.
  - Wrap-safe: each crumb is `whitespace-nowrap`, with its own leading "·" in a `w-3.5` slot. The row is `-ml-3.5 flex flex-wrap` inside `overflow-hidden`, so the separator that starts a line is clipped.
- **intervals.icu status line:** wrap `IntervalsStatusLine` (`IntervalsConnectionForm.tsx:137`) in `<div className="h-8">`. Two caption lines fit, so the key field never moves. This applies in Settings too.
- **Overlay surface:** the loader and `ImportProgressOverlay` share `bg-surface-base/85 backdrop-blur-sm`. Export it as `overlayClass` from `src/components/ui/Card.tsx` (after `:13`) and use it in `ImportProgressOverlay.tsx:133` and in the loader (§7: no hand-copied class strings).

### 4. Logo loader (L3)

- `src/features/onboarding/LogoLoader.tsx`, rendered by `OnboardingFlow` while `!onboardingPreviewRevealed`. It is `fixed inset-0 z-50 grid place-items-center` + `overlayClass`, with the logo at 96 px and the caption "Loading map data…".
- The SVG inlines the `public/logo.svg` rect, three paths and gradients (gradient ids via `useId`). Each path has `pathLength="1"` and `stroke-dasharray: 1`.
- Three keyframes in `src/index.css` (`logo-stroke-0..2`), each 3.0 s and infinite:
  - Stroke i is empty until i × 0.3 s, grows (dashoffset 1 → 0) over 1.2 s, then retracts off the top (0 → −1) over 1.2 s, ease-in-out.
  - Each stroke needs its own keyframes, because a shared keyframe with `animation-delay` would drift off the 3.0 s boundary.
- Hand-off: `LOGO_CYCLE_MS = 3000`. `handoffAt = ceil(max(readyMs, 3000) / 3000) × 3000`, measured from mount. "Ready" means the preview query has settled, on success or error.
  - At `handoffAt`: `revealOnboardingPreview()`. The loader fades out (`opacity-0`, 500 ms), then unmounts; the draw-in starts on reveal.
- The logo's cyan and blue stay off the map (§6). Only the loader uses them.

### 5. Preview layer (seeding (a))

- `src/features/map/hooks/useOnboardingPreviewRoutes.ts`: `useQuery({ queryKey: ['onboarding-preview-routes'], queryFn, enabled: !onboardingComplete, staleTime: Infinity, gcTime: 0, retry: false })`.
  - The `queryFn` is `import('@/features/demo/demoRoutes.json')` → `parseDemoRoutes` (`src/features/demo/demoRecords.ts:29`) → `buildPreviewPasses(routes.routes)`.
  - Invalid data gives `[]` and never throws.
  - The loader and the layer both read this query, so the JSON is fetched once and dropped after onboarding.
- `src/features/map/previewDrawIn.ts` (pure):
  - `buildPreviewPasses(routes)` decodes each of the 14 routes (`decode(polyline, 5)` → `[lng, lat]`).
    - Two passes per route: the original plus one jittered by ~22 m with `createSeededRandom` (`src/features/demo/seededRandom.ts:22`), so overlaps build heat.
    - Each pass gets cumulative lengths, a staggered `start` (spread over 1.8 s) and a `duration` (1.6–2.4 s), as in the mockup. The result also carries the bounds.
  - `slicePath(pass, elapsedMs)` returns the drawn prefix, with an interpolated end point.
- `src/features/map/hooks/useOnboardingPreviewLayer.ts` returns `PathLayer | null`:
  - `null` once `onboardingComplete` is true, and also before reveal (the map stays empty under the loader).
  - From reveal, a `requestAnimationFrame` loop updates `elapsed` until the last pass finishes (~4.2 s) and then stops. The layer is built from `passes.map(p => slicePath(p, elapsed))`.
  - Layer props: id `onboarding-preview`, `getColor` `[...sportTrackColor[sport], trackIntensityAlpha.faint]`, width `trackModifiers.width.default`, `widthMinPixels: 1`, rounded joints and caps, `ADDITIVE_BLEND`, `pickable: false`. These are the `gps-tracks` settings, so the preview reads like the real map with the §6 colours.
- **Why per-frame slicing, not TripsLayer:** `@deck.gl/geo-layers` isn't installed (`package.json:22-24`) and pulls in extra deps for a one-off 4 s animation. Rebuilding ~28 paths per frame is small, and the loop stops when the draw-in is done.
- `DeckGLOverlay.tsx`: call the hook and put the layer first in `overlay.setProps` (`:419-429`). Track handlers stay off (`:90-94`).
- **Camera:** `src/features/map/hooks/useOnboardingPreviewCameraEffect.ts`, called next to `useMapCameraEffect` (`DeckGLOverlay.tsx:109`).
  - Once the map has loaded and the passes exist (still under the loader), it calls `map.fitBounds(previewBounds, { padding, duration: 0 })`.
  - Padding via `fitPadding` (`src/features/map/fitPadding.ts:17`):
    - Desktop: `left` = the right edge of `[data-layout="onboarding-card"]` (+ `MAP_FIT_MARGIN`).
    - Phone: `bottom` = the height of the open dialog, or of the pill when the card is closed.
  - On phone it refits (900 ms) when `onboardingCardOpen` changes.
  - This bypasses `nextMapCamera`, so `initialDone` stays false.
- **Hand-off after import:** no new code. Once tracks are visible and the progress overlay closes, the existing first fit (`src/lib/mapCamera.ts:127-133`, `densestClusterBounds`) fits the camera to the user's tracks. The preview layer disappears with `onboardingComplete`.

### 6. Copy (EN / DE)

New keys (EN source in `messages/en.json`, the same keys in `de.json`):

| Key                              | EN                                                                                                              | DE                                                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `ui_onboarding_loading`          | Loading map data…                                                                                               | Kartendaten werden geladen…                                                                                                          |
| `ui_onboarding_tagline`          | Your runs and rides on an interactive map.                                                                      | Deine Läufe und Radtouren auf einer interaktiven Karte.                                                                              |
| `ui_onboarding_intro_desc`       | PaceVault analyzes your sessions locally in this browser — no account needed.                                   | PaceVault analysiert deine Einheiten lokal in diesem Browser – ohne Konto.                                                           |
| `ui_onboarding_ask_source`       | 1 · Where your sessions come from                                                                               | 1 · Woher deine Einheiten kommen                                                                                                     |
| `ui_onboarding_ask_source_desc`  | intervals.icu, FIT files or demo data                                                                           | intervals.icu, FIT-Dateien oder Demodaten                                                                                            |
| `ui_onboarding_ask_values`       | 2 · A few values about you                                                                                      | 2 · Ein paar Werte über dich                                                                                                         |
| `ui_onboarding_ask_values_desc`  | Gender, resting and max heart rate, optional FTP                                                                | Geschlecht, Ruhe- und Max-HF, optional FTP                                                                                           |
| `ui_onboarding_ask_import`       | 3 · The import                                                                                                  | 3 · Der Import                                                                                                                       |
| `ui_onboarding_ask_import_desc`  | Connect intervals.icu or pick your FIT files                                                                    | intervals.icu verbinden oder FIT-Dateien wählen                                                                                      |
| `ui_onboarding_crumb_device`     | Stays on this device                                                                                            | Bleibt auf diesem Gerät                                                                                                              |
| `ui_onboarding_crumb_offline`    | Works offline                                                                                                   | Läuft offline                                                                                                                        |
| `ui_onboarding_crumb_map`        | Interactive map                                                                                                 | Interaktive Karte                                                                                                                    |
| `ui_onboarding_crumb_oss`        | Open source                                                                                                     | Open Source                                                                                                                          |
| `ui_onboarding_get_started`      | Get started                                                                                                     | Los geht's                                                                                                                           |
| `ui_onboarding_demo_title`       | Try demo data                                                                                                   | Demo ansehen                                                                                                                         |
| `ui_onboarding_demo_desc`        | A year of runs and rides                                                                                        | Ein Jahr Läufe und Radtouren                                                                                                         |
| `ui_onboarding_fit_desc`         | Garmin, Wahoo, Zwift & co. — or a .zip                                                                          | Garmin, Wahoo, Zwift & Co. – oder .zip                                                                                               |
| `ui_onboarding_pill_start`       | Start setup                                                                                                     | Einrichtung starten                                                                                                                  |
| `ui_onboarding_pill_continue`    | Continue setup · {step}/{total}                                                                                 | Einrichtung fortsetzen · {step}/{total}                                                                                              |
| `ui_onboarding_source_title`     | Where are your sessions?                                                                                        | Wo liegen deine Einheiten?                                                                                                           |
| `ui_onboarding_source_subtitle`  | Pick one — you can add another source later.                                                                    | Wähle eine – weitere Quellen kannst du später ergänzen.                                                                              |
| `ui_onboarding_you_title`        | You and your heart rate                                                                                         | Du und deine Herzfrequenz                                                                                                            |
| `ui_onboarding_you_subtitle`     | Gender, resting and max HR feed the heart-rate-based training load; gender also goes into the calorie formulas. | Geschlecht, Ruhe- und Max-HF fließen in die herzfrequenzbasierte Trainingsbelastung ein, das Geschlecht auch in die Kalorienformeln. |
| `ui_onboarding_rest_hr_hint`     | Lowest value, e.g. right after waking up                                                                        | Niedrigster Wert, z. B. direkt nach dem Aufwachen                                                                                    |
| `ui_onboarding_max_hr_hint`      | Highest value in an all-out effort                                                                              | Höchster Wert bei voller Belastung                                                                                                   |
| `ui_onboarding_bike_title`       | Do you train with power?                                                                                        | Trainierst du mit Wattmessung?                                                                                                       |
| `ui_onboarding_bike_subtitle`    | FTP sets your power zones and the training load of rides.                                                       | Die FTP bestimmt deine Leistungszonen und die Trainingsbelastung von Radfahrten.                                                     |
| `ui_onboarding_add_later`        | You can add this later in Settings                                                                              | Kannst du später in den Einstellungen ergänzen                                                                                       |
| `ui_onboarding_connect_title`    | Connect intervals.icu                                                                                           | intervals.icu verbinden                                                                                                              |
| `ui_onboarding_connect_subtitle` | Paste your API key — new sessions then sync in automatically.                                                   | Füge deinen API-Key ein – neue Einheiten kommen dann automatisch dazu.                                                               |
| `ui_onboarding_upload_title`     | Add your FIT files                                                                                              | Füge deine FIT-Dateien hinzu                                                                                                         |
| `ui_btn_back`                    | Back                                                                                                            | Zurück                                                                                                                               |
| `ui_btn_continue`                | Continue                                                                                                        | Weiter                                                                                                                               |

- **Changed:** `ui_onboarding_intervals_desc` (`en.json:604`, `de.json:604`) becomes "Connect once — new sessions sync in" / "Einmal verbinden – synct automatisch" (the row tile's short caption).
- **Reused as they are:**
  - `ui_onboarding_intervals_title`, `ui_fit_files_title`, `ui_fit_files_desc` (the upload subtitle), `ui_fit_files_upload`.
  - `ui_thresholds_gender` / `_male` / `_female` / `_resting_hr` / `_max_hr` / `_ftp`.
  - `ui_sheet_drag_close`.
- **Removed:** see Removal.

### 7. Tone check

Every string states a fact or a question. There is no time estimate, no "free" and no praise. The "add later" hint appears only on optional fields.

## Files

**Create:**

- `src/store/onboarding.ts`
- `src/features/onboarding/OnboardingFlow.tsx`: form, desktop card / phone dialog + pill, demo handler.
- `src/features/onboarding/OnboardingIntro.tsx`
- `src/features/onboarding/OnboardingStep.tsx`: the four screens (question, subtitle, body, footer).
- `src/features/onboarding/OnboardingProgress.tsx`: the existing `SegmentBar` (`src/components/ui/SegmentBar.tsx:12`) + a "n/4" caption.
- `src/features/onboarding/OnboardingCrumbs.tsx`
- `src/features/onboarding/LogoLoader.tsx`
- `src/features/map/previewDrawIn.ts`
- `src/features/map/hooks/useOnboardingPreviewRoutes.ts`
- `src/features/map/hooks/useOnboardingPreviewLayer.ts`
- `src/features/map/hooks/useOnboardingPreviewCameraEffect.ts`
- `tests/features/map/previewDrawIn.spec.ts`
- `e2e/helpers/onboarding.ts`

**Modify:**

- `src/pages/OnboardingPage.tsx:1-117`: thin container that renders `<OnboardingFlow />`.
- `src/components/layout/AppLayout.tsx:100-104`: no `main` wrapper.
- `src/components/ui/Dialog.tsx:115-142`: `scrim` prop.
- `src/components/ui/Card.tsx:13`: add `overlayClass`.
- `src/components/ui/ImportProgressOverlay.tsx:133`: use `overlayClass`.
- `src/components/ui/StatTile.tsx:48-57`: `Crumbs` `wrap` prop (Open 2).
- `src/components/ui/ActionTile.tsx:11,18-40,115-120` and `src/features/filters/FilterList.tsx:90,106,121,136`: drop `StackTile` and the `layout` prop (Removal).
- `src/features/intervals/IntervalsConnectionForm.tsx:38,137,166`: `h-8` status box, drop `children`.
- `src/features/settings/AboutSection.tsx:8`: `export const GITHUB_URL`.
- `src/features/settings/ThresholdsSection.tsx:7,25,38,45,66-115,144`: drop `other`, `OnboardingThresholds` and the staged helpers, and `mode="update"`.
- `src/features/settings/ThresholdTiles.tsx:31,136,157,169`: drop the `mode` prop and its `create` branches.
- `src/features/settings/hooks/useThresholdsForm.ts:13,40,162-163,170-191,198-203,225,247-259`: gender `null`, `fieldValid`.
- `src/packages/engine/types.ts:7`
- `src/packages/engine/energy.ts:12,79-87,112-113`
- `src/lib/moreStats.ts:152`
- `src/store/user.ts:71`
- `src/features/map/DeckGLOverlay.tsx:109,419-429`
- `src/index.css`: `logo-stroke-0..2` keyframes.
- `messages/en.json`, `messages/de.json`: `:28`, `:45`, `:107-108`, `:111-114` removed; `:604` changed; the new keys from §6.
- `tests/packages/engine/energy.spec.ts:75-78`
- `tests/store/userStore.integration.test.ts`
- `e2e/onboarding.spec.ts:7-70,113`
- `e2e/zipUpload.spec.ts:14-43`
- `e2e/intervals.spec.ts:47-65`

**Delete:** nothing (whole files).

## Removal

- `OnboardingThresholds` plus `stagedHistory` / `stagedNumber` / `stagedHistories` (`ThresholdsSection.tsx:66-115`), and the imports that only they use (`parsePaceInput` `:7`, `FormValues` `:25`).
- The `ThresholdTiles` `mode` prop, whose only `create` caller was `OnboardingThresholds` (`ThresholdsSection.tsx:101`). Also any `required` tile plumbing that becomes unused; grep at implementation.
- `ActionTile`'s `StackTile` (`ActionTile.tsx:18-40`) and the `layout` prop. The onboarding tiles were the only stack users, so `row` becomes the only layout.
- `IntervalsConnectionForm` `children` (`:38`, `:166`); only onboarding passed children.
- Gender `other`:
  - the type (`types.ts:7`), the schema (`user.ts:71`), `isGender` (`useThresholdsForm.ts:163`);
  - the Settings item (`ThresholdsSection.tsx:45`);
  - Keytel averaging (`energy.ts:86`) and `?? 'other'` (`moreStats.ts:152`);
  - the key `ui_thresholds_other` (`en.json:28`, `de.json:28`).
- Message keys: `ui_onboarding_welcome_title`, `ui_onboarding_welcome_desc` (`:107-108`), `ui_onboarding_testdata_title`, `ui_onboarding_testdata_desc`, `ui_onboarding_testdata_generate`, `ui_onboarding_testdata_generating` (`:111-114`) and `ui_thresholds_onboarding_note` (`:45`). The demo's loading state is now the import overlay.
- **Not dead:** `ActionPromptCard` and its `branded` variant are still used by `src/components/ui/ErrorFallbacks.tsx:41-44` and `src/pages/LabsPage.tsx:59`.

## Tests

- **New** `tests/features/map/previewDrawIn.spec.ts`, on `slicePath`:
  - at 0 ms (before `start`) it gives an empty path;
  - mid-pass it gives the prefix plus an end point interpolated at the exact fraction of the length;
  - at or after `start + duration` it gives the full path;
  - `buildPreviewPasses` is deterministic for the same input.
- **Update** `tests/packages/engine/energy.spec.ts:75-78`: "averages both equations for other" becomes "no heart-rate estimate without gender".
- **Add** one case to `tests/store/userStore.integration.test.ts`, using `rehydrateFrom`: a persisted profile with `gender: 'other'` rehydrates to `null`. This is the Zod fallback, and it doesn't throw.
- **E2E**, a new helper `e2e/helpers/onboarding.ts`:
  - `startOnboarding(page, source)`: wait for "Get started", pick the tile, Continue.
  - `fillOnboardingProfile(page)`: Male, Rest 50, Max 185, Continue, Continue.
- **E2E**, specs to update:
  - `e2e/onboarding.spec.ts:7-30`: FIT flow through the helper. Drop the threshold-tile assertions (`:12`, `:27`); keep the dock checks.
  - `e2e/onboarding.spec.ts:32-46`: "Try demo data" on the intro, no "Generate"; the `/test data/` assertion (`:45`) is the demo banner and stays.
  - `e2e/onboarding.spec.ts:48-70`: rewrite as "Continue is disabled until gender and valid HR": max HR 40 shows "Min 120 bpm" under the input.
  - `e2e/zipUpload.spec.ts:14-43`: both onboarding tests through the helpers.
  - `e2e/intervals.spec.ts:47-65`: intervals tile, profile, then the key on the import screen; drop `thresholdTile` (`:64`).
- **E2E**, new: one test in the existing phone describe (`e2e/onboarding.spec.ts:113`).
  - Open the flow, then drag on the map: the dialog stays.
  - Tap the grabber: the "Continue setup · 2/4" pill shows. Tap the pill: the same question opens with the values kept.
- Unchanged: `seedOnboardingComplete` (`e2e/helpers/seed.ts:91`; it writes kv after the first load and reloads), `e2e/helpers/upload.ts:14-21` (the file input exists only on the import screen; otherwise it falls back to Settings), and `e2e/helpers/thresholds.ts` (still used by the Settings tests).

## Verification

1. `vp build` (Paraglide keys), `vp check`, `vp test -- --run`, `vp exec playwright test`.
2. Manual, on desktop and at 390 px, in EN and DE:
   - **First start:**
     - The loader runs at least one full cycle and hands off with the logo empty.
     - With CPU throttled, a second cycle finishes cleanly.
     - Then the routes draw in (green runs, orange rides, no blue), and the camera is padded clear of the card or dialog.
   - **Each path:**
     - intervals.icu: source → you → bike → key → import → camera fits the user's tracks.
     - FIT: the same path, then upload.
     - Demo from the intro, and demo from the source screen.
     - Back on every screen, and the progress "n/4" on each.
   - **Gender:** nothing preselected, and Continue is disabled until a pick. Settings shows only Male / Female.
   - **intervals.icu status line:** "Not connected", "Checking key…", "Key valid" and the long error don't move the key field (Settings too).
   - **Phone:**
     - Drag the card down and tap the grabber: it closes and the pill shows.
     - The pill reopens the same question with the values kept, and the camera refits.
     - Escape closes it.
     - Map pan, pinch and tap with the card open: the card stays.
   - **Crumbs:** the line wraps with all four crumbs, and no "·" at a line start or end (DE at 390 px). "Open source" opens GitHub in a new tab.

## Delivery and acceptance

- **Review document (part of the implementation output):** `reviews/onboarding-redesign/index.html`. It is local only: one self-contained file plus screenshots in the same folder, not published and not committed.
  - Every UI or flow change is labelled (`C1`, `C2`, …) on a screenshot (desktop and 390 px; EN, plus DE where the copy changed) and explained in one or two lines: what changed, where (`path:line`), and why (which decision).
  - Changes without a UI (engine, store, migration) get one short labelled entry each, with what the owner can observe.
  - Screenshots come from the running app via the repo's Playwright, taken after the verification suite passes.
- **Acceptance:** the owner reviews the code and the review document. Only after the owner's explicit acceptance are `mockups/onboarding/`, `reviews/onboarding-redesign/` and this plan deleted. Nothing is cleaned up before that.

## Risks

- `DialogContent` and `ImportProgressOverlay` are both `z-50` portals in `body`. The overlay mounts later, so it renders above the open phone card. Check this manually.
- Per-frame layer rebuilds for ~4 s can drop frames on low-end phones. The loop stops afterwards.
- The loader adds at least 3 s to every onboarding e2e test. Actions auto-wait, but a first `expect` may need a longer timeout.
- With `modal={false}`, focus isn't trapped, so Tab can leave the card.
- A stored profile with `other` would rehydrate as `null`. The owner confirmed there is none.
- The `h-8` status line adds a little height in the Settings Integrations card.
- Follow-up, out of scope: the demo banner still says "test data" / "Testdaten" (`messages/en.json:530`, `de.json:530`).
