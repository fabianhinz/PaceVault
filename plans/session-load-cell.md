# Session load cell

## Context

The training-effect row shows the load at the end of its subtitle ("Aerobic 2.5 · Anaerobic 0.0 · Est. load 48"). Three methods produce that number: TSS (power + FTP), TRIMP (average HR) and a duration estimate (30 per hour). All three are summed as one value in the dashboard load, fitness, fatigue and form. The user cannot see which method produced a session's load, and nothing explains it.

The duration estimate stays (no store migration). The load moves to its own cell in More stats, where the method and its source are visible and the info button explains the method.

## Decisions (settled)

- New **Load** cell, first cell in More stats. "Load" also leads the topic list in the row subtitle ("Load · Calories · Power · Zones").
- The method is the lead in front of the number, as text for all three: `TSS 238`, `TRIMP 74`, `Est. 48` (DE `Gesch. 48`).
- Note line names the source only: "from power" / "from heart rate" / "from duration only" (DE "aus Leistung" / "aus Herzfrequenz" / "nur aus der Dauer").
- The info button opens the explanation of the method used (`tss`, `trimp`, `duration`; the texts exist).
- The load is removed from the training-effect subtitle: "Aerobic 2.5 · Anaerobic 0.0".
- Without a profile (no max/rest HR), the training-effect row shows "Training effect" as its title instead of the load, still disabled with the hint.
- Every session has a load, so the cell is always present and More stats always renders.

## Approach

- `src/lib/moreStats.ts:18`: add `'load'` to `MoreStatsTopic`, first in `TOPIC_ORDER`; `topicPresent` returns true for it.
- `src/features/sessions/session/MoreStatsRow.tsx:230-238`: add `loadCell` first in `CELLS`, a `StatTile` with `title` "Load", `metricId` = `session.stressMethod`, `lead` = the method's short label, `value` = the formatted load, `note` = the source text. Add `load` to `TOPIC_LABELS` (`MoreStatsRow.tsx:37-43`).
- `src/features/sessions/session/TrainingEffectCard.tsx:142-143,151,177-178`: drop the load from the subtitle and from the no-profile title.
- `messages/en.json`, `messages/de.json`:
  - `ui_te_values` (`:269`) without `{method} {load}`.
  - `exp_duration_shortLabel` (`:352`): "Est." / "Gesch.".
  - New: `ui_more_stats_load`, `ui_more_stats_topic_load`, `ui_more_stats_load_from_power`, `ui_more_stats_load_from_hr`, `ui_more_stats_load_from_duration`, `ui_te_title`.

## Removal

- The `loadFmt`/`loadValue` and the `METRIC_EXPLANATIONS[stressMethod]` lookup in `TrainingEffectCard.tsx` move to the Load cell; nothing left behind in the card.

## Tests

- `tests/lib/moreStats.spec.ts`: `'load'` is always the first topic.
- Update e2e expectations that read the training-effect subtitle or the More stats topic list.

## Verification

- §5 suite: `vp check`, `vp test -- --run`, `vp exec playwright test`, `vp build`.
- By hand, desktop and 390 px: a power ride (TSS), an HR-only ride (TRIMP), a session with neither (Est.); info button opens the matching explanation; session without profile shows "Training effect".
