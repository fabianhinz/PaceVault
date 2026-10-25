---
id: comments-cite-sources-and-explain-why
tdr_reference: tdr/comments-cite-sources-and-explain-why.md
depends_on: [index-modules-are-not-barrels, mirrored-spec-layout]
generated: 2026-10-23
---

# Engine comments cite a source or explain why; units live in names

Read `tdr/comments-cite-sources-and-explain-why.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`index-modules-are-not-barrels`](index-modules-are-not-barrels.md) — its engine items (and, through it, the domain-only plan) delete or move the formatter, the track encoder, `getACWRColor` and the training-effect colour, so the comments those carried are already gone and are not listed here.
- [`mirrored-spec-layout`](mirrored-spec-layout.md) — moves the workbench specs under `tests/scripts/` and `tests/site/src/`, where item 13 removes their comments.

## Changes

Line numbers are those of today's files; where an earlier plan already edited a module, find the comment by its text. Run every Check from the repo root; "clean `vp check`" means `vp run -F @pacevault/i18n compile && vp check` finishes with no error. No item changes a computed value: item 1 renames fields, parameters and locals; items 2–3 edit comments only.

1. Put the units into the names, then delete the unit notes.
   Files: `packages/engine/src/effortDetection.ts`, `packages/engine/src/stress.ts`, `packages/engine/src/trainingEffect.ts`, `packages/engine/src/types.ts`, `packages/engine/src/zones.ts`, `packages/engine/src/vdot.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/tests/effortDetection.spec.ts`, `packages/engine/tests/zones.spec.ts`, `packages/engine/tests/windExposure.spec.ts`, `apps/web/src/lib/effortLaps.ts`, `apps/web/src/lib/zoneColors.ts`, `apps/web/src/lib/prescription.ts`, `apps/web/src/lib/weather.ts`, `apps/web/src/features/sessions/ZoneLegend.tsx`, and every further reader `vp check` reports
   Change: each rename below updates the declaration, every reader in the engine and the app, and the specs; the comment named in brackets is deleted in the same edit.
   - `EffortThresholds.thresholdPace` → `thresholdPaceSecPerKm` [`effortDetection.ts:13`]; the app builds this object in `apps/web/src/lib/effortLaps.ts` (or the laps module the helpers-group plan merged it into).
   - `EffortBlock.start` → `startSec`, `end` → `endSec` [`:19`, `:21`], `movingTime` → `movingSec` [`:25`]; readers `effortLaps.ts:40-42,78-79,85` and the spec.
   - `EffortSignalDefaults.minWork` → `minWorkSec`, `enter` → `enterShare`, `leave` → `leaveShare`, `steady` → `steadyShare` [`:41`, `:43`, `:45`, `:47`]; readers `EFFORT_SIGNAL_DEFAULTS` (`:57-61`), `detectEfforts` (`:691-694`), `postprocess` (`:566`). `SignalLevels` keeps `enter`/`leave`/`steady`: those are absolute levels, not shares.
   - `HrReserveSample.minutes` → `durationMin`, `ratio` → `reserveShare` [`stress.ts:30`]; readers `stress.ts:176,188`, `trainingEffect.ts:141-145`.
   - `RunningZone.minPace` → `slowestPaceSecPerKm`, `maxPace` → `fastestPaceSecPerKm` [`types.ts:105-106`]; readers `zones.ts:29-30,42,51`, `apps/web/src/lib/zoneColors.ts:79-80`, `apps/web/src/features/sessions/ZoneLegend.tsx:25` (`minPace={zone.slowestPaceSecPerKm} maxPace={zone.fastestPaceSecPerKm}`, the `PaceRange` props stay), `apps/web/src/lib/prescription.ts:48`, and the specs.
   - `ZONE_DEFS` columns `minPct` → `slowestPaceFactor`, `maxPct` → `fastestPaceFactor` [`zones.ts:9-10`].
   - `vdot.ts`: `vo2FromVelocity` parameter `v` → `velocityMetersPerMin` [`:16`]; `pctVo2max` parameter `t` → `durationMin` [`:19`]; in `thresholdPaceFromRace` `velocity` → `velocityMetersPerMin` [`:55`] and the result is bound before returning, `const paceSecPerKm = Math.round((1000 / velocityMetersPerMin) * 60); return paceSecPerKm;` [`:56`]; in `predictRaceTime` `lo` → `lowerMin`, `hi` → `upperMin` [`:71-72`], the inner `f` parameter `t` → `durationMin`, and the result `const durationMin = (lowerMin + upperMin) / 2; return durationMin * 60;` [`:92`] (same operations in the same order).
   - `WindSample.time` → `timeMs` [`windExposure.ts:12`], `direction` → `directionDegrees` [`:14`]; the block at `:7-10` stays (it states the meteorological "from" convention); readers `windExposure.ts:74,111`, `apps/web/src/lib/weather.ts:436` (`({ timeMs: s.time, directionDegrees: s.windDirection })`), the spec's `windFrom`.
   - `WindExposure.movingSeconds` → `movingSec` [`:26`], and the notes on `headwindPct` / `crosswindPct` / `tailwindPct` and the interface [`:18`, `:20`, `:22`, `:24`] go; readers are found by `vp check` (the session weather card and its hook).
   - Delete the three constant notes [`windExposure.ts:45`, `:47`, `:49`]; the behavioural-constants plan gives those constants their long unit suffix.
   Check: clean `vp check`; `vp run test` and `vp run e2e` pass; `rg -n "/\*\* (sec/km|elapsed seconds|seconds|Observation time|Direction the wind)|// (sec/km|m/min|minutes|slower|faster)" packages/engine/src` prints nothing.

2. Reduce the engine source comments to citations, file headers and why-notes.
   Files: `packages/engine/src/coaching.ts`, `packages/engine/src/effortDetection.ts`, `packages/engine/src/gps.ts`, `packages/engine/src/metrics.ts`, `packages/engine/src/paceCalculator.ts`, `packages/engine/src/stress.ts`, `packages/engine/src/trainingEffect.ts`, `packages/engine/src/types.ts`, `packages/engine/src/vdot.ts`, `packages/engine/src/windExposure.ts`, `packages/engine/src/zones.ts`
   Change: comment edits only. "Delete" removes the comment lines; "→" replaces a block by the one-line JSDoc shown.
   - `coaching.ts`: keep `:1-2`; delete every other comment (`:6-8`, `:10`, `:12`, `:14`, `:16`, `:19-23`, `:32-34`, `:36`, `:38`, `:40`, `:43-45`, `:47`, `:49`, `:52-57`, `:70-74`).
   - `effortDetection.ts`: keep `:27-30` (what the signal mean is per signal), `:51-56`, `:71`, `:73`, `:75`, `:278`, `:380`, `:663`; delete `:490` and `:578-582`.
   - `gps.ts`: keep the header `:1-2` (without the two keys the domain-only plan moved); `:19-25` → `/** @see [Veness2019] — standard haversine formula. */`; `:35-41` → `/** @see [Veness2019] — standard initial-bearing formula. */`; delete `:8-10`, `:14`, `:86-90`, `:128-133`, `:137-141`, `:157-164`, `:188`, `:205-209`, `:215-220`, `:227-235`.
   - `metrics.ts`: keep `:1-2`; `:8-11` → `/** alpha = 1 - e^(-1/days), matching TrainingPeaks / WKO / GoldenCheetah. */`; delete `:25-27`, `:57-60`, `:81-86`.
   - `paceCalculator.ts`: keep `:1-2`; delete `:4-9`, `:13-18`, `:22-27`.
   - `stress.ts`: keep `:1-2`, `:36-43`, `:49-53`, `:56`, `:96-99`, `:131`, `:137`; `:70` → `/** @see [Banister1991] */`; `:79-88` → `/** @see [CogganAllen2010] */`; `:120` → `/** @see [Banister1991] */`; `:143-148` → `/** The ratio is clamped into (0, 1), so a later rest or max HR edit can't break the load. @see [Karvonen1957], [Swain1998] */`; `:156-161` → `/** Pairs more than 10 s apart (pauses) count 0, like Normalized Power. @see [Karvonen1957] */`; `:181-184` → `/** @see [Banister1991] */`; `:192-201` → `/** NP 0 W gives TSS 0. Runs never score TSS. @see [CogganAllen2010] [Banister1991] */`; `:215-226` → `/** @see [CogganAllen2010] [Banister1991] */`; delete `:18` and `:60`.
   - `trainingEffect.ts`: keep `:1-2` and the rationale `:7-25`; delete its banner and heading lines `:4-6` and `:26`; keep `:42-46`, `:49-52`, `:55-58`, `:61-64`, `:67-70`; `:114-121` → `/** Pauses (records more than 10 s apart) don't count, like the HR load. */`; delete `:73-76`, `:80`, `:86`, `:95`, `:142`, `:148`, `:151`, `:158`, `:170-174`, `:184-189`.
   - `types.ts`: delete the banners `:1-3`, `:27-29`, `:119-121`.
   - `vdot.ts`: keep `:1-2` and `:79`; `:23-30`, `:59-67` and `:95-102` → `/** @see [DanielsGilbert1979] @see [Daniels2013] */`; delete `:6-8`, `:36`, `:46-51`.
   - `windExposure.ts`: keep `:1-2`, `:7-10`, `:58`, `:198`; `:154-168` → `/** @see [Veness2019] */`; delete `:67`.
   - `zones.ts`: keep `:1-2`; delete `:20-24`, `:35-40`, `:45-49`.
   `decoupling.ts`, `energy.ts`, `normalize.ts` and `zoneDistribution.ts` carry only citations, headers and the Keytel why-note (`energy.ts:146`) and stay as they are.
   Check: `rg -n "^\s*(//|/\*|\*)" packages/engine/src | rg -v "@see|// Sources:|// See packages/engine/SOURCES.md|// App-specific logic|SOURCES.md \(App-Specific"` prints only the kept why-notes listed above (a human reads them against the list); `rg -n "\-{10}|@param|@returns" packages/engine/src` prints nothing; clean `vp check`.

3. Remove the comments from the engine specs and test config.
   Files: `packages/engine/vitest.config.ts`, `packages/engine/tests/vdot.spec.ts`, `packages/engine/tests/windExposure.spec.ts`, `packages/engine/tests/formatter.spec.ts` (if the domain-only plan has not deleted it), `packages/engine/tests/zones.spec.ts`, `packages/engine/tests/stress.spec.ts`, `packages/engine/tests/gps.spec.ts`, `packages/engine/tests/effortDetection.spec.ts`, `packages/engine/tests/ewmaAlpha.spec.ts` (or `metrics.ewmaAlpha.spec.ts`), `packages/engine/tests/trainingEffect.spec.ts`, `packages/engine/tests/gpsPick.spec.ts` (or `gps.pick.spec.ts`)
   Change: delete every comment line: `vitest.config.ts:3`; `vdot.spec.ts:13-14,19-20,25-26,75,125`; `windExposure.spec.ts:7,11,15,20,30,38,46,67,75,83,87,94`; `zones.spec.ts:5,19,24,49-50,55-56`; `stress.spec.ts:35,127`; `gps.spec.ts:90,94,99,112,118,131`; `effortDetection.spec.ts:57,279,299,312,327`; `ewmaAlpha.spec.ts:21-25,42-46,57-59,61`; `trainingEffect.spec.ts:55,65,85,102,112,121,150-152,203,246,255-256`; `gpsPick.spec.ts:26`; `formatter.spec.ts:11,13`. A note that carries a reason the case title does not say goes into the case title instead (for example an `ewmaAlpha` derivation note becomes part of its `it(…)` title), never into a new comment.
   Check: `rg -n "^\s*(//|/\*|\*)|[^:]// " packages/engine/tests packages/engine/vitest.config.ts` prints nothing; `vp run test` passes with the same test count.

4. Write the comment rule into the engine rules.
   Files: `packages/engine/CLAUDE.md`
   Change: the **Citations** bullet (`CLAUDE.md:15`) is replaced by:

   ```md
   - **Comments**: Three kinds only. A `@see [SourceKey]` JSDoc tag on every formula or constant derived from published science (the key resolves in `SOURCES.md`; when adding or modifying engine modules, update `SOURCES.md` with any new citations and keep the module in the Validation Summary table). The `// Sources: [Key], …` file header with its `// See packages/engine/SOURCES.md` line. A note that explains why: a choice between published variants, a deliberate non-obvious rule, an accepted approximation. No section banners, no comment that restates the code, no `@param`/`@returns` prose, no unit notes: units are part of the name (`durationSec`, `distanceMeters`, `timeMs`). Specs and config carry no comments.
   ```

   Check: a human reads `packages/engine/CLAUDE.md` against `tdr/comments-cite-sources-and-explain-why.md` §2; `rg -n "Citations" packages/engine/CLAUDE.md` prints nothing.

5. (packages/i18n) Reduce the i18n build-file comments to the one why-note.
   Files: `packages/i18n/vite.ts`, `packages/i18n/paraglide.config.ts`
   Change: delete `vite.ts:4` (`// Compiles the messages on dev and build start and again whenever a message file changes.`), which restates what `paraglideVitePlugin` does and what `packages/i18n/CLAUDE.md` § Compiling says. In `paraglide.config.ts:4-5` drop the restating first half (the sentence "Compile options, shared by scripts/compile.ts and i18nPlugin() in vite.ts.") and keep the rationale as one line:

   ```ts
   // Paths are absolute because paraglide resolves `outdir` against the cwd of whoever calls it.
   ```

   `scripts/compile.ts` carries no comment and stays.
   Check: `rg -n "^\s*(//|/\*|\*)" packages/i18n/vite.ts packages/i18n/paraglide.config.ts packages/i18n/scripts` prints exactly the one `paraglide.config.ts` line above; `vp run -F @pacevault/i18n compile` and `vp check` from `packages/i18n` pass.

### packages/gpx

`packages/gpx/src` has no comment today, so items 6–8 only remove the spec and config comments, add the citations the owner asked for, and write the rule into the gpx rules. Line numbers are today's; where an earlier plan moved code, find the line by its text.

6. (packages/gpx) Remove the comments from the gpx specs and test config.
   Files: `packages/gpx/vitest.config.ts`, `packages/gpx/tests/routeGeometry.spec.ts`
   Change: delete every comment line: `vitest.config.ts:3` (`// jsdom for DOMParser (parseGpx.ts); no app setup file.`); `routeGeometry.spec.ts:15,60,68,77,85,86,100,111` (the distance, segment-gap, jitter, cross-segment and grade notes). Each case title already states the behaviour the note explained; a reason it does not state goes into its `it(…)` title, never into a new comment.
   Check: `rg -n "^\s*(//|/\*|\*)|[^:]// " packages/gpx/tests packages/gpx/vitest.config.ts --glob '!*.snap'` prints nothing; `vp -C packages/gpx exec vitest run` passes with the same test count.

7. (packages/gpx) Cite the projection and list the elevation heuristic.
   Files: `packages/gpx/src/routeCut.ts`, `packages/engine/SOURCES.md`
   Change: give `routeCut.ts` the engine's file header (owner, Q9: `// Sources:` headers too, as in `packages/engine/src/windExposure.ts:1-2`): above its first line (`import type { RoutePoint } from './routeGeometry.ts';`, `routeCut.ts:1`) add `// Sources: [Veness2019]` and `// See packages/engine/SOURCES.md for full citations.`, followed by a blank line. It is the only gpx module that cites a source once `simplifyGpxPoints.ts` is gone (engine-holds-domain-logic-only, Q8): `routeGeometry.ts` calls the engine's `haversineM` (`routeGeometry.ts:2,98`), whose citation lives in `packages/engine/src/gps.ts`, and its elevation heuristic has no source; `parseGpx.ts`, `buildGpx.ts` and `routeProfile.ts` implement no published formula. A gpx module that gains a `@see` tag later gets the same header. Then add `/** @see [Veness2019] — equirectangular approximation. */` on the line above `export const routeDistanceAtPosition` (`routeCut.ts:88`); the unit-length plan moves the tag onto the projection step it extracts. In `SOURCES.md`: line 3 "implemented in `packages/engine/src/`" becomes "implemented in `packages/engine/src/` and `packages/gpx/src/`"; the Validation Summary gets, below the haversine row, `| \`packages/gpx/src/routeCut.ts\` | Equirectangular approximation (nearest route point to a map position) | \`[Veness2019]\` | Standard approximation |`; the App-Specific Logic table gets `| \`packages/gpx/src/routeGeometry.ts\` | Elevation gain and loss per GPX segment with a 3 m hysteresis (a change counts once it reaches 3 m from the last counted elevation); max grade is the steepest windowed gradient of any segment | Heuristic, no published source |`. The elevation heuristic gets no `@see` tag: no published source defines it.
   Check: `rg -n "@see \[Veness2019\]" packages/gpx/src` prints one line; `rg -n "^// Sources:" packages/gpx/src` prints exactly `packages/gpx/src/routeCut.ts:1:// Sources: [Veness2019]`; every gpx file with a `@see` tag has the header (`rg -l "@see \[" packages/gpx/src` and `rg -l "^// Sources:" packages/gpx/src` list the same files); `rg -c "packages/gpx" packages/engine/SOURCES.md` prints `3`; `vp check` is clean (it formats the tables).

8. (packages/gpx) Write the comment rule into the gpx rules.
   Files: `packages/gpx/CLAUDE.md`
   Change: add after the **External data through Zod** bullet (`CLAUDE.md:9`):

   ```md
   - **Comments**: Three kinds only, as in `packages/engine`: a `@see [SourceKey]` JSDoc tag on a published formula (the key resolves in `packages/engine/SOURCES.md`; add new citations there and list gpx heuristics in its App-Specific Logic table), a `// Sources:` file header, and a note that explains why. No section banners, no comment that restates the code, no `@param`/`@returns` prose, no unit notes: units are part of the name (`distanceMeters`). Specs and config carry no comments.
   ```

   Check: `rg -n "\*\*Comments\*\*" packages/gpx/CLAUDE.md` prints one line.

### tools/docs

The tool cites no published source, so only R3 (why-notes stay) and R4 (no restating comments) have a subject. Three why-notes stay as they are: the full-window-shot and `networkidle` rationale above `waitForStill` (`tools/docs/banner/capture.ts:108-113`), the GPU rendering note on `channel: 'chromium'` (`tools/docs/playwright.config.ts:30-32`) and the hand-off note on the locale variable (`tools/docs/banner/env.ts:3`). R6 does not reach the first two: `capture.ts` is the Playwright capture script and `playwright.config.ts` its runner config, not a spec, and the owner keeps both notes. The `/// <reference lib="…" />` lines at `capture.ts:1-2` are compiler directives, not comments, and are not touched here.

**Banner check** (item 9): before the edit run `vp run docs:banner --locale de` and `vp run docs:banner --locale en` and copy `docs/banners/de_banner.png` and `docs/banners/en_banner.png` into a directory outside the repo; after the edit run both again and compare with `uv run --no-project --with pillow python -c "import sys;from PIL import Image,ImageChops;[print(n,ImageChops.difference(Image.open(f'{sys.argv[1]}/{n}_banner.png').convert('RGBA'),Image.open(f'docs/banners/{n}_banner.png').convert('RGBA')).getbbox()) for n in ('de','en')]" <that-directory>`, which must print `de None` and `en None`.

9. (tools/docs) Delete the comments that restate the code or the package docs.
   Files: `tools/docs/vite.config.ts`, `tools/docs/banner/env.ts`, `tools/docs/banner/run.ts`, `tools/docs/banner/page/banner.css`
   Change: delete the comment lines and nothing else: `vite.config.ts:6-7` (`// Serves the banner page …`, said by `tools/docs/CLAUDE.md:10`); `env.ts:13` (`/** The web app's dev server (apps/web), captured for the tiles. */`) and `:17` (`/** tools/docs' own dev server, … */`), both said by `tools/docs/CLAUDE.md:10`; `run.ts:7-10` (the usage JSDoc, said by `tools/docs/README.md:7-10`); `banner.css:1-2` (the `/* The kit theme … */` block, said by `tools/docs/CLAUDE.md:11`). Keep `env.ts:3`. Where an earlier plan renamed or moved one of these lines, delete it where it now sits.
   Check: `rg -n "^\s*(//|/\*|\*)" tools/docs --glob '!node_modules' --glob '!banner/out/**' --glob '!*.md'` prints only `capture.ts:1-2` (the `///` directives), the `capture.ts` block above `waitForStill`, the `playwright.config.ts` block above `channel` and the `env.ts` hand-off note; `vp check` from `tools/docs/` is clean; banner check passes.

10. (tools/docs) Write the comment rule into the tool rules.
   Files: `tools/docs/CLAUDE.md`
   Change: add after the **Copy** bullet (`CLAUDE.md:12`, below any bullet another convention plan already added there):

   ```md
   - **Comments**: Only a note that explains why (a rendering workaround, a wait that looks redundant, a value handed between processes). No comment that restates the code, the README or this file, no section banners, no `@param`/`@returns` prose.
   ```

   Check: `rg -n "\*\*Comments\*\*" tools/docs/CLAUDE.md` prints one line.

### tools/workbench

`tools/workbench` cites no science, so a comment there is a why-note or nothing (R3, R4, R6). Each item below names the comments that stay, by their opening words; every other comment in the listed files goes: section banners, comments that restate the declaration under them (`/** True when …`, `/** The backlog folder, …`), unit notes, the config comments and every spec comment. A kept comment loses any review or question tag it carries (`(R17)`, `(Q8 a, R15)`, `(owner)`, `review round 2, R5`) and keeps its reason; where only part of a block is a reason, only that sentence stays. Line numbers are today's. Code, markup and class strings stay byte-identical apart from the removed comment lines.

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

11. (tools/workbench) Comments in the scripts and hooks.
   Files: `tools/workbench/scripts/{statusGuard,workerGitGuard,indexHook,frontmatter,check,cleanup,deps,interfaces,changedFiles}.ts`
   Change: keep, and only these:
   - `statusGuard.ts:18-36` (the hook's contract header), `:69` (`A plan without a status …`), `:73` (`` `ready` is the owner's "lets dev" gate …``), `:137-141` (the superseding rule, without `(R17)`), `:379` (`Edit on a missing file …`), `:422` (`Exit 1 is a non-blocking hook error …`).
   - `workerGitGuard.ts:1-3` (hook contract); `indexHook.ts:6-12` (hook contract) and `:44` (`Exit 1 is a non-blocking hook error …`).
   - `frontmatter.ts:65` (`Astro's YAML reads an unquoted …`), `:93` (`Done items from before the type/areas split … stay valid without them.`, without `(review round 2, R5)`), `:175` (`… GFM reads it as a plain item, not a task.`), `:212` (`Items already in \`before\` (written before the rule) and superseded items are not new decisions.`), `:354-356` (the sentence `State, options and answer come from the plan …; a legacy \`status\` or \`answer\` is ignored.`).
   - `check.ts:13-18` (the command's purpose and why the board shows the same list) and `:49-51` (`The kind … is not checked here: lines written before the rule stay valid, and \`statusGuard.ts\` requires it on every decision an agent adds.`).
   - `cleanup.ts:45` (`` `XY path`: both columns … ``).
   - `deps.ts:100` (`each package exports \`./*\` from \`./src/*\``, as `// Each package exports ./* from ./src/*.`), `:233` (`A planned path that is not code … is never missing.`), `:479` (`depcruise exits with the number of error-level violations …`).
   - `interfaces.ts:86` (`Options for files no tsconfig.json covers (the test fixtures).`), `:114` (`… its own files, so ambient types load`), `:134` (`The printer indents by four spaces; tech.md blocks use two.`), `:145` (`… no machine paths in the output.`), `:152` (`… as Oxfmt would.`).
   Everything else goes, among them the module headers `frontmatter.ts:5-11`, `deps.ts:11-24`, `interfaces.ts:9-19`, `changedFiles.ts:3-8`, `cleanup.ts:8-13`, the per-declaration docs (`frontmatter.ts:13,26,29,36,41-45,73,77,89,113,120,127,136,145,166-170,178,181-184,200,203,206,236-240,259,262-265,290,296-300,306,309,312-316,366-370`, `check.ts:20,24,30-33,41`, `cleanup.ts:15,18,21,24,38,41`, `statusGuard.ts:58,112,133,191,209,211-214,216,223,263,298,315,368`, `deps.ts:52,54,56,58,73,76,79,85,88,107,121,134-137,153,156-159,184,196-202,319,321,329-334,398,410-414,427,434,446,461,473-476,500,528,535,539,556,593`, `interfaces.ts:23,26,29,34-38,61-65,98,172,183-187,206,243,252,281,314-318,349,352-355,374`, `changedFiles.ts:15,17,19,23,26,38-41,63-66,92-95`).
   Check: `rg -n "^\s*(//|/\*|\*)" tools/workbench/scripts` prints only the kept lines above; `rg -n "\((R|Q)\d+" tools/workbench/scripts` prints nothing; workbench check; suite.

12. (tools/workbench) Comments in the board, its stylesheet and the configs.
   Files: every `.ts`/`.tsx`/`.astro` module under `tools/workbench/site/src/`, `tools/workbench/site/src/styles/board.css`, `tools/workbench/site/astro.config.mjs`, `tools/workbench/vitest.config.ts`, `tools/workbench/playwright.review.config.ts`, `tools/workbench/.dependency-cruiser.cjs`
   Change: keep, and only these:
   - `site/src/pages/index.astro:5` (`The island reads the board through the dev server's actions …`).
   - `site/astro.config.mjs:13-15` (`tech.ts imports these lazily; pre-bundle them …`).
   - `.dependency-cruiser.cjs`: of the header `:1-5` only the reason, as `/** node_modules patterns are not anchored with ^: pnpm resolves packages to node_modules/.pnpm/<name>@<version>/node_modules/<name>/…. */`; the `/** @type {import('dependency-cruiser').IConfiguration} */` annotation (`:6`) and the rules' `comment:` fields, which are data, stay.
   - `site/src/lib/board.ts:83` (`A literal \`<table>\` can only come from the table renderer …`), `:144` (`… the stale-file guard sends it back`), `:322` (`… creating one costs ~100 ms`).
   - `site/src/lib/devPlugin.ts:16-20` (the paragraph on Astro's memoized actions, without `(R27)`).
   - `site/src/lib/vocabulary.ts:3-6` reduced to `/** Shared by the server and the React island: no node imports here. */`.
   - `site/src/lib/writeBack.ts:1-7` (every edit names its place and expected lines; a mismatch becomes a 409).
   - `site/src/actions/index.ts:29-35` reduced to its last sentence `/** No token: local dev server only. */`, `:138` (`Astro reads an empty form field as \`null\` …`), `:155-156` (`A form sends line breaks as CRLF …`), `:311-312` (`The last deleted item folder, held in the dev server's memory for Undo …`).
   - `site/src/scripts/tech.ts:53-56` without its banner dashes and its first clause, as `/* The svg keeps its natural size and moves by a CSS transform inside a fixed box, so zooming never shifts the page. Inline, plain wheel scrolls the page: zoom is Ctrl/⌘ + wheel or a trackpad pinch (a wheel event with ctrlKey); at full screen the plain wheel zooms. */`, `:206` (`lucide rotate-ccw and maximize-2 …`), `:250` (`… Mermaid keeps global state`), `:294` (`… marked writes no heading ids`).
   - `site/src/app/Board.tsx:18` (`The board's own text is English; the kit's few Paraglide strings follow.`, without `(Q15)`), `:45` (`A tab switch never changes the width: only Expand/Collapse does.`, without `(owner)`).
   - `site/src/app/Prose.tsx:21` and `site/src/app/TechPane.tsx:30-32` (`React 19 sets innerHTML again for every new \`__html\` object …`).
   - `site/src/app/useBoard.ts:7` (`The arrow matters: \`orThrow\` passed directly would get TanStack's query context as its input.`).
   - `site/src/app/useWrite.ts:44` (`` `inline`: the caller shows the error itself … ``).
   - `site/src/app/MockupPane.tsx:5-10` (`?board=1` and the refetch message, without `Q17`), `site/src/app/ItemPanel.tsx:49-50` (`A tab stays mounted once shown … so an iframe keeps its page and the diagrams stay drawn.`), `site/src/app/Stage.tsx:31-33` (`the content stays the same DOM node …` and the backdrop-blur reason), `site/src/app/Panel.tsx:39`, `site/src/app/AnswerDialog.tsx:26`, `site/src/app/Columns.tsx:145`.
   - `board.css`: every comment except the two banners `:29` and `:189`, which go; `(R13)`, `(R29)`, `(R31)`, `(R30, R33)` and `(R32)` are stripped from `:15`, `:303`, `:304`, `:321`, `:404`.
   Everything else goes, among them `site/astro.config.mjs:8,10`, `vitest.config.ts:3`, `playwright.review.config.ts:3-8`, `site/src/lib/board.ts:35-38,40,55-58,94,127,162,175,179,182,184,186,233,279,302-306,317,332-337,365,372,376-379,421-424,464-467,479,483,498-503,536-539,554-559,598-603,640,657-660,669,671,673,699-702`, `site/src/lib/devPlugin.ts:9-15,30,33,44,52,58,65,69`, `site/src/lib/vocabulary.ts:21,37,47`, `site/src/lib/writeBack.ts:10,21,31,47,64-67,70,104,118,137,152,167,217,225-228,256,258,265,274,298,307-310,332`, `site/src/actions/index.ts:38-41,55,80,108,144,250,301,340,365,373,392`, the remaining `tech.ts` docs and its second banner `:152-153`, and the component docs (`ReviewPane.tsx:74-77,150-154`, `Prose.tsx:12,23,29`, `QuestionRow.tsx:11-14`, `PlanPane.tsx:30`, `Columns.tsx:15-20,38-43`, `TechPane.tsx:17-23,62-63`, `ItemPanel.tsx:28,46-48,51,56,62`, `WriteCard.tsx:11,101-104`, `NeedsYou.tsx:43-47`, `Panel.tsx:21-25`, `CheckRow.tsx:13,15,19-22`, `useWrite.ts:5-10,47,84`, `Board.tsx:27,30,47,136`, `icons.tsx:11,28,50,63`, `useBoard.ts:4-6,8`, `ItemCard.tsx:17-21`, `AnswerDialog.tsx:126-130`, `useBoardChangedEffect.ts:11-14`, `Stage.tsx:12,14,18-19,26-30,34`).
   Check: `rg -n "^\s*(//|/\*|\*)|\{/\*" tools/workbench/site/src tools/workbench/site/astro.config.mjs tools/workbench/vitest.config.ts tools/workbench/playwright.review.config.ts tools/workbench/.dependency-cruiser.cjs` prints only the kept comments above; `rg -n "\((R|Q)\d+|\(owner\)" tools/workbench/site` prints nothing; workbench check; board check; suite.

13. (tools/workbench) No comments in the specs (R6).
   Files: every spec under `tools/workbench/tests/`
   Change: delete every comment line and every `/** … */` helper doc in the specs (`rg -n "^\s*(//|/\*|\*)" tools/workbench/tests` lists them, about 40 lines, e.g. the setup notes at the top of the three action specs, `deps.spec.ts`'s fixture notes and `statusGuard.spec.ts`'s case notes). A note that names why a case exists moves into that case's title instead when the title does not already say it; no assertion changes.
   Check: `rg -n "^\s*(//|/\*|\*)" tools/workbench/tests` prints nothing; `vp test -- --run` from `tools/workbench/` passes 66 tests.

14. (tools/workbench) Write the comment rule into the tool rules.
   Files: `tools/workbench/CLAUDE.md`
   Change: § Rules gains "- **Comments**: a comment explains why — a hook's contract, a framework or tool behaviour the code relies on, a deliberate rule the code cannot show — never what the next line does; no banners, no review or question tags (`R17`, `Q8`), no unit notes, no comments in specs or configs."
   Check: `rg -n "\*\*Comments\*\*" tools/workbench/CLAUDE.md` prints one line.

## Open items

- No persisted field carries a unit note today (`SessionRecord`, `TrainingSession`, `SessionLap` in `types.ts` have none), so item 1 renames nothing that is stored. A unit note on a stored field would stay until a store migration renames it.
- `packages/engine/SOURCES.md:3-4` already describes the `@see` and `// Sources:` forms and needs no change.
- `packages/testing`: no item here. Its comments are removed by test-data-from-mock-factories item 3 as the code moves into `series.ts`, except the two why-notes the owner keeps (cardiac drift, `records.ts:84`; per-record HR jitter for the TRIMP gender split, `records.ts:100`); the unit notes there (`records.ts:31,45,67`) become names in names-spell-out-their-meaning item 9 (`slopeMetersPerRecord`, `elevationMeters`).

- `packages/gpx`: the Ramer–Douglas–Peucker simplification and the polyline encoding leave gpx with the engine-holds-domain-logic-only plan (items 9–14), into `apps/web/src/lib/gpsTrack.ts`, whose `// Sources: [Ramer1972], [DouglasPeucker1973]` header covers them; gpx keeps no citation for them.
- `tools/workbench` (owner, Q10, 2026-10-25: keep them): items 11–12 keep, beyond the hook contracts and the framework quirks, the why-notes that state a framework or tool behaviour the code relies on (Astro's YAML dates `frontmatter.ts:65`, GFM task parsing `frontmatter.ts:175`, Oxfmt's width `interfaces.ts:152`, the Shiki start-up cost `site/src/lib/board.ts:322`, the Mermaid global state `site/src/scripts/tech.ts:250`, marked's missing heading ids `site/src/scripts/tech.ts:294`, the Undo slot in memory `site/src/actions/index.ts:311-312`, the iframe that keeps its page `site/src/app/ItemPanel.tsx:49-50`). No item removes them; item 14 names the kind in the tool rules.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
