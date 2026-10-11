# Handoff: housekeeping round (2026-10-11)

For a new agent session with no knowledge of the session that produced this. Read this file, then `CLAUDE.md`, then the plans it names.

## How the owner works (follow this)

- **Orchestrator mode:** the main session only tracks topics, runs discussions and keeps decisions. Research, mockups, plan writing, implementation and verification go to subagents.
- **One topic at a time:** a 2–4 line catch-up summary, then a short questionnaire (AskUserQuestion). No big decision tables. Every question must be a clear choice, never "uncheck what you disagree with".
- **No code before "lets dev":** research, mockups and plan files are fine before that.
- **No git operations:** no commit, stash, checkout, reset, clean, `rm --cached`. The owner commits.
- **Plans** go in `plans/<name>.md`: terse, change-focused (Context, Decisions (settled), Approach, Tests, Verification), with file:line refs.
- **Verification suite:** `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`. Always use the `vp` commands, never the pnpm wrappers.
- **Mockups:** self-contained HTML in `mockups/<topic>/`, following `.claude/skills/explore-ui/SKILL.md`. `mockups/` is gitignored, so they exist only on the owner's machine.
- **Parallel dev agents in one working tree:** each touches only its own plan's files, runs targeted tests and reports errors in other lanes' files instead of fixing them.

## State: implemented (uncommitted at time of writing, verified green)

Final run before the banner rework: `vp check` ✓, `vp test` 1132/1132 ✓, `vp exec playwright test` 72/72 ✓, `vp build` ✓.

| Plan                     | What shipped                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fit-file-names.md`      | intervals.icu `i<id>_Name.fit` keeps its title; Strava `.fit.gz` ZIP entries are imported; GPX/TCX entries are skipped                                                                                                                                                                          |
| `fit-data.md`            | Dead code removed: session calories, movingTime, device TSS/IF/FTP, altitude min/max/avg, maxPower, unused lap fields, lap enrichment, `FitUserProfile`. No store migration                                                                                                                     |
| `demo-data.md`           | Deterministic demo dataset in `src/features/demo/` (`DEMO_SEED`, 233 sessions over 52 weeks, Munich, real routes and elevation, Garda trip, "Tegernsee loop" studio route). Routes come from `scripts/generateDemoRoutes.ts` (dev-only network: routing.openstreetmap.de, Open-Meteo elevation) |
| `mobile-map.md`          | Handle 48 px, `PEEK_HEIGHT` 114. Lap fit via `fitPadding.ts` (24 px phone margin, min 120 px box, sheet cap 0.85 for laps). 44 px lap controls with a separate X; compact Color-by while a lap is selected                                                                                      |
| `filter-query.md`        | Typo suggestions, new date phrases (today, this month, since <month>, h:mm), rolling last 7/30/365, implicit name search, "not understood" vs "no match", fixed list height (input never moves), filters store v4 (old "last year" converted to 365 days)                                       |
| `mobile-touch.md`        | `useDevice()` returns `{ isDesktop, pointerFine }`. Mobile filter in a ResponsivePopover sheet; map and studio pickers anchored at the click point (sheet on mobile); old popup files deleted; touch hover off; tab shadow only on lg (`floatingLgClass`, CLAUDE.md §7)                         |
| `readme-banner.md`       | Locale-aware `scripts/readme/` capture script (separate Playwright config, not in e2e). README rewritten users-first                                                                                                                                                                            |
| `weather-attribution.md` | **Not from this round.** Probably another session of the owner. Open-Meteo credit link plus `ExternalLink.tsx`. Verification found it correct                                                                                                                                                   |

## State: README banner (done, verified)

- `vp run readme:banner [--locale de|en]` (default `de`) writes `docs/readme/de_banner.png` / `en_banner.png`. The README stays English and embeds `de_banner.png`. Banner texts per locale live in `scripts/readme/tiles.ts`.
- Capture uses full Chromium headless on the real GPU (`channel: 'chromium'`). SwiftShader/headless-shell dropped the backdrop blur. Shots are full-window and cropped after animations settle.
- 7 tiles:
  1. Heatmap: locate me → pick popover; GPX export is named in the subtitle only.
  2. Zones on "6×800 m Isar": whole session, all 5 zones.
  3. GAP ("Flaucher easy") + filter ("ride 50" / "rad 50").
  4. Fitness & form.
  5. Studio ("Tegernsee loop").
  6. Offline (phone, "Starnberger See long ride").
  7. Weather (phone, "Dachau loop").
- Tiles are byte-identical across runs. `de_banner.png` composite varies by ≤ 3/255 (GPU noise).
- Map labels stay English in the DE banner (CARTO labels don't follow the app locale).
- After the banner fix: `vp check` ✓, `vp exec playwright test` 72/72 ✓.

## Next topic: banner from the owner's real activities (not started)

Owner decision (2026-10-11): the banner may be built entirely from the owner's own activities, chosen so that no track starts or ends near home. This lifts the earlier "screenshots use test data only" rule for the banner only. The demo dataset stays as the default and fallback.

Recommendation, to confirm with the owner:

- **Input:** FIT files rather than intervals.icu activity IDs. They work offline, need no API key and give deterministic output. The script takes them via e.g. `vp run readme:banner --locale de --source <dir|zip>` and imports them through the normal upload path (the onboarding upload, as in `e2e/upload.spec.ts`).
- intervals.icu IDs would need the owner's API key at capture time: read from an env var only, never committed or logged.
- **Inputs stay local:** the real FIT files are never committed (e.g. `data/` is already gitignored). Only the resulting PNGs are committed.
- **Privacy guard:**
  - FIT files carry the user profile (name, weight, resting HR), real timestamps and device serials. None of it may show in a tile.
  - Before committing, check every tile for start/end points, home area, names and dates.
  - Optionally have the script refuse tracks whose start or end lies within a configurable radius of a home coordinate. That coordinate is passed via an env var and never written to the repo.
- **Tiles needing many sessions** (heatmap, fitness & form) need a whole set of activities, e.g. a ZIP export. The script's session picks (by name today, from `scripts/readme/tiles.ts`) must become configurable per source, for example by file name or session date.

Open questions for the owner: which activities or export to use, the home radius, whether tile picks should be automatic (scoring like the zones tile) or listed by hand.

## Deferred / next topics

1. **`plans/calorie-estimate.md`:** settled, deferred, ready for "lets dev" once the owner confirms. Session stats row (collapsible, variant C in `mockups/calories/index.html`):
   - calories estimate (range bar + kcal, no method label, info popover only)
   - moving/elapsed time, work kJ, max power, IF, VI
   - Settings: weight (saved as today's entry, replaces same day) + birth year only. No date picker, edit, delete or hint text.
   - Weight history via `weightAt`; no store version bump (owner decision).
2. **Carbs estimate:** backlog note in `plans/backlog.md`. Builds on the calorie plan's per-record energy.
3. **Follow-ups found during verification:**
   - The file picker still accepts `.tcx` (`UPLOAD_EXTENSIONS`), but `useFileUpload.ts` imports only `.fit`, so TCX uploads fail.
   - `?? 0` fallbacks in `src/features/demo/demoRecords.ts` and `buildDemoDataset.ts` (`:124` closest to violating "0 is data").
   - Garda demo tracks have elevation artefacts (20–32 % grade).
   - Manual checks still open: import a real intervals.icu file and a Strava ZIP.

## Owner preferences learned this round

- Banner: German banner in the README; titles/subtitles in the app's `CardHeader` style at 1.5×; `public/favicon.svg` as logo; strip subtitle "Your training, analyzed locally. No account. Works offline." Stand-out features: the interactive heatmap with locate-me, offline use.
- Filter: parser only (no chips/builder), placeholder only, no layout shift on mobile.
- KISS for settings forms; avoid explanatory helper text.
