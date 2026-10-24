---
id: user-facing-strings-in-copy-modules
tdr_reference: tdr/user-facing-strings-in-copy-modules.md
generated: 2026-10-23
---

# User-facing copy: flat message keys and state-keyed copy maps in topic modules

Read `tdr/user-facing-strings-in-copy-modules.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

Every item's Check includes `vp run check` clean (it compiles the translations first) and `vp run test` green.

1. Rename the 109 message keys that are not flat snake_case.
   Files: `packages/i18n/messages/en.json`, `packages/i18n/messages/de.json`, `apps/web/src/lib/explanations.ts`, `apps/web/src/features/sessions/session/ColorByControl.tsx:54-65`, `apps/web/src/features/sessions/charts/SessionChartsExplorer.tsx:476`.
   Change: in both message files and every `m.<key>` reference, convert each camelCase segment of a key to snake_case: `shortLabel`→`short_label`, `friendlyName`→`friendly_name`, `oneLiner`→`one_liner`, `tripLoad`→`trip_load`, `normalizedPower`→`normalized_power`, `gradeAdjustedPace`→`grade_adjusted_pace`, `trainingZones`→`training_zones`, `aerobicTE`→`aerobic_te`, `anaerobicTE`→`anaerobic_te`, `avgHr`→`avg_hr`, `avgPace`→`avg_pace`, `avgSpeed`→`avg_speed`, `avgPower`→`avg_power`, `movingTime`→`moving_time`, `intensityFactor`→`intensity_factor`, `variabilityIndex`→`variability_index`, `peakPower`→`peak_power`, `stepLength`→`step_length`, and in the nine `ui_color_by_reason_*` keys `hrThresholds`→`hr_thresholds`, `thresholdPace`→`threshold_pace`, `noHrData`→`no_hr_data`, `noPowerData`→`no_power_data`, `noPaceData`→`no_pace_data`, `noSpeedData`→`no_speed_data`, `noWeather`→`no_weather`, `weatherLoading`→`weather_loading`, `noGps`→`no_gps` (e.g. `exp_normalizedPower_shortLabel` → `exp_normalized_power_short_label`). Values and placeholders stay byte-identical; no renamed key collides with an existing one. The object keys of the TypeScript maps that reference them (`ColorModeUnavailableReason` members, `MetricExplanation` fields) do not change — only the message keys.
   Check: `uv run --no-project python -c "import json,re;[print(f,[k for k in json.load(open(f'packages/i18n/messages/{f}.json')) if not k.startswith('\$') and not re.fullmatch(r'[a-z0-9]+(_[a-z0-9]+)*',k)]) for f in ('en','de')]"` prints two empty lists; `rg -n "m\.\w*[A-Z]\w*\(" apps/web/src packages/ui/src` → nothing.

2. Move the sport-name maps into `apps/web/src/microcopy/sports.ts`.
   Files: new `apps/web/src/microcopy/sports.ts`; edit `apps/web/src/features/dashboard/LoadChart.tsx:40-43,183,256`, `apps/web/src/features/records/SportRecordsCard.tsx:12-20,33,34`, `apps/web/src/lib/savedFilters.ts:138-141,252`.
   Change: three identical `Record<Sport, () => string>` maps (`sportNames`, `SPORT_NAMES`, `sportLabels`) become one `export const LABEL_BY_SPORT: Record<Sport, () => string> = { running: m.ui_sport_running, cycling: m.ui_sport_cycling };`; `sportSubtitle` becomes `RECORDS_SUBTITLE_BY_SPORT` in the same module. Call sites read `LABEL_BY_SPORT[sport]()`.
   Check: `rg -n "m\.ui_sport_running\b" apps/web/src` → one hit, in `apps/web/src/microcopy/sports.ts`.

3. Move the dashboard gauge and chart maps.
   Files: new `apps/web/src/microcopy/trainingLoad.ts`, new `apps/web/src/microcopy/volume.ts`; edit `apps/web/src/features/dashboard/ReadinessGauge.tsx:12-18,68`, `apps/web/src/features/dashboard/ACWRGauge.tsx:12-16,56`, `apps/web/src/features/dashboard/VolumeChart.tsx:43-47,139`.
   Change: `readinessLabel` → `LABEL_BY_FORM_STATUS: Record<FormStatus, () => string>` and `acwrRiskLabel` → `LABEL_BY_INJURY_RISK: Record<InjuryRisk, () => string>` in `trainingLoad.ts`; `metricLabels` → `LABEL_BY_VOLUME_METRIC: Record<VolumeMetric, () => string>` in `volume.ts`.
   Check: `rg -n "const (readinessLabel|acwrRiskLabel|metricLabels)" apps/web/src` → nothing.

4. Move the settings and map maps.
   Files: new `apps/web/src/microcopy/thresholds.ts`, new `apps/web/src/microcopy/trackIntensity.ts`; edit `apps/web/src/features/settings/ThresholdEditDialog.tsx:26-33,44`, `apps/web/src/features/map/TrackIntensityControl.tsx:15-25,76,79,107,110`.
   Change: `FIELD_TITLES` → `TITLE_BY_THRESHOLD_FIELD: Record<ThresholdKey, () => string>` in `thresholds.ts` (create the module, or extend it if the exhaustive-record-maps plan created it first); `INTENSITY_LABEL` → `LABEL_BY_TRACK_INTENSITY`, `INTENSITY_DESC` → `DESCRIPTION_BY_TRACK_INTENSITY`, both `Record<TrackIntensity, () => string>`, in `trackIntensity.ts`.
   Check: `rg -n "const (FIELD_TITLES|INTENSITY_LABEL|INTENSITY_DESC)" apps/web/src` → nothing.

5. Move the session-detail maps.
   Files: new `apps/web/src/microcopy/colorModes.ts`, `apps/web/src/microcopy/zones.ts`, `apps/web/src/microcopy/moreStats.ts`, `apps/web/src/microcopy/laps.ts`; edit `apps/web/src/features/sessions/session/ColorByControl.tsx:23-65,99,129,138,168`, `apps/web/src/features/sessions/ZoneLegend.tsx:5-11,24`, `apps/web/src/features/sessions/session/MoreStatsRow.tsx:39-57,77,107,292`, `apps/web/src/features/sessions/session/LapsControl.tsx:36-42,144,145`.
   Change: `MODE_LABEL` → `LABEL_BY_COLOR_MODE`, `PILL_LABEL` → `PILL_LABEL_BY_COLOR_MODE`, `COMPACT_MODE_LABEL` → `COMPACT_LABEL_BY_COLOR_MODE` (keeps its `...PILL_LABEL_BY_COLOR_MODE` spread), `REASON` → `REASON_BY_UNAVAILABLE_COLOR_MODE` (`Record<ColorModeUnavailableReason, () => string>`) in `colorModes.ts`; `ZONE_LABELS` → `LABEL_BY_RUNNING_ZONE` in `zones.ts`, and since the map is total over `RunningZoneName` and `zone.name` is typed `RunningZoneName` (`packages/engine/src/types.ts:103`), `ZoneLegend.tsx:24` becomes `{LABEL_BY_RUNNING_ZONE[zone.name]()}` without `?.() ?? zone.label`; `TOPIC_LABELS` → `LABEL_BY_MORE_STATS_TOPIC`, `LOAD_SOURCES` → `LABEL_BY_STRESS_METHOD` (`Record<TrainingSession['stressMethod'], () => string>`), `BLOCKER_LABELS` → `LABEL_BY_ENERGY_BLOCKER` in `moreStats.ts`; `LIMITER_LABELS` → `NUDGE_BY_EFFORT_LIMITER: Record<EffortLimiter, { precise: () => string; detect: () => string }>` in `laps.ts` (one nesting level, mirroring the precise/detect state axis).
   Check: `rg -nP 'const \w+: Record<[^>]+,\s*(?:\(\)\s*=>\s*string|\{[^}]*\(\)\s*=>\s*string)' apps/web/src --glob '*.tsx'` → nothing.

6. (packages/i18n) Write the key-naming rule into the translation docs.
   Files: `packages/i18n/CLAUDE.md` (§ Adding a key, line 1 of the numbered list).
   Change: step 1 ("Add the key to `messages/en.json` …") gains the sentences: "Keys are flat snake_case (`ui_color_by_reason_no_gps`, never a camelCase segment), one level, prefixed by the surface that shows the copy (`ui_`, `toast_`, `exp_`, `coach_`), never by the package that computes the value. A count-dependent message is a pair `<key>_one` / `<key>_other` (`ui_laps_pill_one`, `ui_laps_pill_other`), never `_count` or `_plural`. A label with the same role and the same text in every locale is one key (`ui_btn_close`), not one key per screen." Items 7–9 bring the message files to this rule.
   Check: a human reads the updated step against `tdr/user-facing-strings-in-copy-modules.md` §2 R5.

7. (packages/i18n) Name every count-dependent message pair `_one` / `_other`.
   Files: `packages/i18n/messages/en.json`, `packages/i18n/messages/de.json`, `apps/web/src/features/sessions/session/lapLabels.ts:31-42`, `apps/web/src/features/studio/hooks/useGpxImport.ts:41-60`, `apps/web/src/components/ImportProgressOverlay.tsx:45-53`.
   Change: rename these keys in both message files (values and `{count}` placeholders byte-identical, key position in the file unchanged) and at every `m.<key>` call site: `ui_laps_pill_count` → `ui_laps_pill_other`, `ui_laps_splits_count` → `ui_laps_splits_other`, `ui_laps_efforts_count` → `ui_laps_efforts_other` (the `_one` keys stay); `toast_gpx_import_success` → `toast_gpx_import_success_one`, `toast_gpx_import_success_plural` → `toast_gpx_import_success_other`, `toast_gpx_import_failed` → `toast_gpx_import_failed_one`, `toast_gpx_import_failed_plural` → `toast_gpx_import_failed_other`, `ui_import_summary_new` → `ui_import_summary_new_one`, `ui_import_summary_new_plural` → `ui_import_summary_new_other`, `ui_import_summary_duplicates` → `ui_import_summary_duplicates_one`, `ui_import_summary_duplicates_plural` → `ui_import_summary_duplicates_other`. No new key collides with an existing one. The branches that choose between the two keys stay as they are; moving them to `formatPlural` is item 7 of the formatting plan, which runs after this one. The toast id `'gpx-import-failed'` is not a message key and stays.
   Check: `rg -n "_plural\"|ui_laps_\w+_count\"|\"(toast_gpx_import_(success|failed)|ui_import_summary_(new|duplicates))\"" packages/i18n/messages` prints nothing; `rg -n "m\.(\w+_plural|ui_laps_\w+_count|toast_gpx_import_(success|failed)|ui_import_summary_(new|duplicates))\(" apps packages/ui tools` prints nothing; `vp run e2e` passes (import summary). `ui_delete_dialog_count` is not a plural pair (its `{summary}` is a whole phrase) and keeps its name.

8. (packages/i18n) Merge the duplicate close and save labels into the shared button keys.
   Files: `packages/i18n/messages/en.json`, `packages/i18n/messages/de.json`, `apps/web/src/components/ImportProgressOverlay.tsx:150`, `apps/web/src/features/settings/ThresholdsSection.tsx:121`, `tools/workbench/shared/capture.ts:93`, `tools/docs/banner/capture.ts:76`.
   Change: `{m.ui_import_close()}` → `{m.ui_btn_close()}` and `{m.ui_thresholds_save()}` → `{m.ui_btn_save()}`; the capture scripts look the label up by key string, so `t(locale, 'ui_import_close')` → `t(locale, 'ui_btn_close')` and `t('ui_import_close')` → `t('ui_btn_close')`. Delete `ui_import_close` and `ui_thresholds_save` from both message files. Both pairs hold identical text in both locales (`Close`/`Schließen`, `Save`/`Speichern`), so nothing visible changes.
   Check: `rg -n "ui_import_close|ui_thresholds_save" apps packages tools --glob '!**/paraglide/**'` prints nothing; `vp run e2e` passes; `vp run workbench:capture` and the `tools/docs` banner capture still find the summary close button.

9. (packages/i18n) Prefix the training-effect keys by their surface.
   Files: `packages/i18n/messages/en.json:272-285`, `packages/i18n/messages/de.json` (same keys), `apps/web/src/lib/localizedTrainingEffect.ts:5-21`.
   Change: the six label keys `engine_te_<effect>` → `ui_te_effect_<effect>` (`engine_te_overreaching` → `ui_te_effect_overreaching`, likewise `highly_improving`, `improving`, `maintaining`, `minor`, `no_effect`) and the eight summary keys `engine_te_sum_<summary>` → `ui_te_summary_<summary>` (`engine_te_sum_too_easy` → `ui_te_summary_too_easy`, likewise `extreme`, `steady_aerobic`, `high_intensity`, `mixed_intensity`, `easy_maintenance`, `moderate`, `light`), in both message files and in the two maps of `localizedTrainingEffect.ts`. Values unchanged; no new key collides with an existing `ui_te_*` key.
   Check: `rg -n "engine_" packages/i18n/messages apps/web/src` prints nothing.

## Open items

- R1, R2 and R4 are dropped: the app keeps Paraglide (`@pacevault/i18n`) as its copy layer, so user-facing strings are message keys, not literals in per-topic constant objects, and entries are `m.*` functions (Paraglide resolves the locale at call time). R3 (`as const` on the copy object) is moot with no such object.
- R7 (delete unused entries): all 782 keys in `packages/i18n/messages/en.json` are referenced through `m.<key>` today; nothing to delete beyond the two keys item 8 merges away. The check stays a diff-time review.
- `apps/web/src/pages/SettingsPage.tsx:26` `localeLabels` maps locales to their endonyms (`English`, `Deutsch`), deliberately untranslated; it holds no `m.*` copy and stays.
- Array-shaped spec lists that mix copy with icons and accessors (`SOURCES` in `apps/web/src/features/onboarding/OnboardingStep.tsx:86`, `WIND_LEGEND` in `apps/web/src/features/sessions/session/WeatherCard.tsx:41`, `TILES` in `apps/web/src/features/settings/ThresholdTiles.tsx:44`) are not state-keyed maps and stay in their components.
- State-keyed `m.*` maps already in `.ts` lib modules (`apps/web/src/lib/coachingMessages.ts`, `localizedTrainingEffect.ts`, `sessionTitleFormatter.ts`, `apps/web/src/features/sessions/session/weatherConditions.ts`, `apps/web/src/features/labs/workoutDisplay.ts`, `apps/web/src/features/sessions/charts/zoneLabel.ts`) are already out of components; R6 targets component-local maps only.
- `apps/web/src/microcopy/mapView.ts` (`LABEL_BY_MAP_VIEW`, `DESCRIPTION_BY_MAP_VIEW`, read by `apps/web/src/features/sessions/session/MapViewControl.tsx`) and its six `ui_map_view*` keys came with the 3D map view and already follow R5 and R6; it is the first module of the `microcopy/` directory items 2–5 fill.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
