---
id: outcome-unions-over-exceptions
tdr_reference: tdr/outcome-unions-over-exceptions.md
depends_on: [colocated-types-module]
generated: 2026-10-23
---

# Expected failure is a returned outcome union, not a thrown exception

Read `tdr/outcome-unions-over-exceptions.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`colocated-types-module`](colocated-types-module.md) — settles which engine module owns which type before items 5–9 add the outcome unions and warnings to the energy, decoupling and cadence modules.

## Changes

1. Rewrite the FIT convention line that prescribes throwing for missing required data.
   Files: `apps/web/CLAUDE.md`
   Change: replace the line at `apps/web/CLAUDE.md:33` (starts with `- **Required FIT data throws**:`) with exactly:

   ```markdown
   - **Required FIT data is an outcome**: `parseFitFile` (`src/parsers/fit.ts`) returns a `ParseFitFileOutcome` instead of throwing. A file the parser cannot read, or one missing a field the app cannot work without (session `start_time`, `sport`, `total_timer_time`; lap `start_time`, `timestamp`, `total_elapsed_time`, `total_timer_time`; record `timestamp`), is a failure member (`unreadable`, `missing session`, `unsupported sport`, `missing start time`, `missing timer time`, `invalid record`, `invalid lap`); a parsed file is `{ outcome: 'success', parsed }`. Callers handle every member before using `parsed`. Everything else is optional and stays `undefined`. Domain operations in `src/lib/` and `src/parsers/` follow the same rule (`docs/conventions/tdr/outcome-unions-over-exceptions.md`); `throw` is for broken invariants and infrastructure failures only.
   ```

   Check: `rg -n "Required FIT data throws" apps/web/CLAUDE.md` prints nothing.

2. Return a declared outcome union from the FIT parser instead of throwing.
   Files: `apps/web/src/parsers/fit.ts`
   Change: declare above `parseFitFile`:

   ```ts
   export type ParseFitFileOutcome =
     | { outcome: 'unreadable'; detail: string }
     | { outcome: 'missing session' }
     | { outcome: 'unsupported sport' }
     | { outcome: 'missing start time' }
     | { outcome: 'missing timer time' }
     | { outcome: 'invalid record'; detail: string }
     | { outcome: 'invalid lap'; detail: string }
     | { outcome: 'success'; parsed: ParsedFitResult };
   ```

   Annotate `parseFitFile(...): Promise<ParseFitFileOutcome>`. Each `throw new Error(...)` carrying a `Failed to parse FIT file` message becomes a `return` of its member: `:136` -> `return { outcome: 'unreadable', detail: errorDetail };`, `:141` -> `return { outcome: 'missing session' };`, `:146` -> `return { outcome: 'unsupported sport' };`, `:150` -> `return { outcome: 'missing start time' };`, `:156` -> `return { outcome: 'missing timer time' };`, `:161-163` -> `return { outcome: 'invalid record', detail: describeIssue(recordsResult.error) };`, `:169-171` -> `return { outcome: 'invalid lap', detail: describeIssue(lapsResult.error) };`. The final `return { session, records, laps, fingerprint };` (`:233`) becomes `return { outcome: 'success', parsed: { session, records, laps, fingerprint } };`. `fileName` stays a parameter (it still feeds `extractSessionName`).
   Check: `rg -n "throw new Error" apps/web/src/parsers/fit.ts` prints nothing; `vp check` reports errors only at the three callers fixed in item 3.

3. Handle every parser outcome at the three callers before using the parsed file.
   Files: `apps/web/src/features/sessions/hooks/useFileUpload.ts`, `apps/web/src/features/intervals/runIntervalsImport.ts`, `apps/web/src/features/sessions/reprocessSessions.ts`
   Change: in `useFileUpload.ts:61-69` the body of `ingestFit` becomes (the `try` now guards only `read()` and `batcher.add`, both infrastructure):

   ```ts
   try {
     const data = await read();
     const outcome = await parseFitFile(data, fileName, toFitParseProfile(profile));
     if (outcome.outcome !== 'success') {
       console.error('Parse error: ', fileName, outcome);
       failed++;
     } else {
       await batcher.add({ ...outcome.parsed, rawData: data, fileName, source: { kind: 'file' } });
     }
   } catch (error) {
     console.error('Parse error: ', error);
     failed++;
   }
   ```

   `runIntervalsImport.ts:57-71` takes the same shape: a failure member counts `failed++`, `success` spreads `outcome.parsed` into `batcher.add`. In `reprocessSessions.ts:60-70` `reparseFit` keeps its `try/catch` around `parseFitFile` (anything the parser still throws unexpectedly must keep skipping only that session, as today, instead of failing the reprocessing run), returns `outcome.parsed` for `success`, and for every failure member logs `console.error('Reparsing the FIT file of a session failed:', session.id, outcome)` and returns `undefined`.
   Check: `rg -n "parseFitFile\(" apps/web/src` lists exactly these three call sites, each followed by an `outcome !== 'success'` branch; `vp check` passes.

4. Update the parser specs to the outcome contract.
   Files: `apps/web/tests/parsers/fitRequiredFields.spec.ts`, `apps/web/tests/parsers/fit.spec.ts`, `apps/web/tests/parsers/fitThresholds.integration.test.ts`, `apps/web/tests/features/sessions/reprocessSessions.integration.test.ts`
   Change: in `fitRequiredFields.spec.ts` every `await expect(parse(...)).rejects.toThrow('<text>')` becomes `expect(await parse(...)).toMatchObject({ outcome: '<member>' })`: `session is missing` -> `missing session`, `start_time is missing` -> `missing start time`, `total_timer_time is missing` -> `missing timer time`, `invalid record 1.elapsed_time` -> `{ outcome: 'invalid record', detail: expect.stringContaining('1.elapsed_time') }`, each lap case -> `{ outcome: 'invalid lap', detail: expect.stringContaining('0.' + field) }`; rename the `it` titles from "rejects ..." to "reports ...". The optional-data cases read `result.parsed.records` after narrowing. In the other three files add this file-local helper and wrap each `await parseFitFile(...)` (`fit.spec.ts:138`, `fitThresholds.integration.test.ts:26,27,39`, `reprocessSessions.integration.test.ts:91,294,311`) in `parsedFit(...)`:

   ```ts
   const parsedFit = (outcome: ParseFitFileOutcome): ParsedFitResult => {
     if (outcome.outcome !== 'success') throw new Error(`expected a parsed FIT file, got ${outcome.outcome}`);
     return outcome.parsed;
   };
   ```

   Check: `vp test -- --run tests/parsers tests/features/sessions/reprocessSessions.integration.test.ts` (from `apps/web/`) passes; then `vp run test` and `vp run e2e` from the root pass (corrupt-file import still counts as failed in the import summary).

5. (packages/engine) Return an outcome union from `stepLength`.
   Files: `packages/engine/src/cadence.ts`, `packages/engine/tests/cadence.spec.ts`, `apps/web/src/lib/moreStats.ts`
   Change: in `cadence.ts` declare `export type StepLengthOutcome = { outcome: 'no moving records' } | { outcome: 'no steps' } | { outcome: 'success'; stepLength: StepLength };` and make `stepLength` (`:26-46`) return it: `if (seconds === 0) return { outcome: 'no moving records' }; if (steps === 0) return { outcome: 'no steps' }; return { outcome: 'success', stepLength: { metres: metres / steps, stepsPerMinute: (steps / seconds) * 60 } };` (same arithmetic). `StepLength` is exported with it. `buildStepLength` (`moreStats.ts:107-115`) becomes `const step = stepLength(records); if (step.outcome !== 'success') return undefined; return { metres: step.stepLength.metres, stepsPerMinute: step.stepLength.stepsPerMinute };`. In the spec the success case reads `result.stepLength` after narrowing (`if (result.outcome !== 'success') throw new Error(result.outcome);`), `toBeUndefined()` (`:54`) becomes `toEqual({ outcome: 'no moving records' })`, `toBeNull()` (`:58`) becomes `toEqual({ outcome: 'no steps' })`, and the two case titles name the outcome.
   Check: `rg -n "StepLength \| undefined \| null" packages/engine/src` prints nothing; `vp run check` clean; `vp run test` green; `apps/web/tests/lib/moreStats.spec.ts` passes unchanged.

6. (packages/engine) Return an outcome union from `aerobicDecoupling`.
   Files: `packages/engine/src/decoupling.ts`, `packages/engine/tests/decoupling.spec.ts`, `apps/web/src/lib/moreStats.ts`
   Change: declare `export type DecouplingOutcome = { outcome: 'too short' } | { outcome: 'no valid ratio' } | { outcome: 'success'; decoupling: Decoupling };`. `aerobicDecoupling` returns `{ outcome: 'too short' }` where it returned `undefined` (`:114`), `{ outcome: 'no valid ratio' }` where it returned `null` (`:130`), and `{ outcome: 'success', decoupling: { ratio, firstHalf, secondHalf, pct: … } }` (the object unchanged). `moreStats.ts:179-180` becomes `const decoupling = aerobicDecoupling(records, session.sport, gradients); if (decoupling.outcome === 'success') stats.decoupling = decoupling.decoupling;`. In the spec every `result?.x` read narrows first, `toBeUndefined()` (`:59`, `:65`) → `toEqual({ outcome: 'too short' })`, `toBeNull()` (`:69`) → `toEqual({ outcome: 'no valid ratio' })`.
   Check: `rg -n "Decoupling \| undefined \| null" packages/engine/src` prints nothing; `vp run check` clean; `vp run test` green.

7. (packages/engine) Return an outcome union from `estimateSessionEnergy`.
   Files: `packages/engine/src/energy.ts`, `packages/engine/tests/energy.spec.ts`, `apps/web/src/lib/moreStats.ts`
   Change: declare `export type EnergyOutcome = { outcome: 'no covered method' } | ({ outcome: 'blocked' } & EnergyBlocked) | { outcome: 'success'; estimate: EnergyEstimate };` (`EnergyBlocked` and `EnergyEstimate` stay exported: the app's `MoreStats.calories` keeps its shape). `MethodPick` (`:56`) becomes `type MethodOutcome = { outcome: 'no covered method' } | ({ outcome: 'blocked' } & EnergyBlocked) | { outcome: 'success'; method: EnergyMethod };`; `pickMethod` returns `{ outcome: 'success', method }` (`:148`), `{ outcome: 'no covered method' }` (`:150`) and `{ outcome: 'blocked', blockedBy }` (`:151`). `estimateSessionEnergy` (`:178-181`) becomes `const pick = pickMethod(records, sport, body, gradients); if (pick.outcome !== 'success') return pick; const kcal = sumJoules(methodSeries(pick.method, records, body, gradients)) / JOULES_PER_KCAL; return { outcome: 'success', estimate: { method: pick.method, kcal, uncertainty: UNCERTAINTY_BY_ENERGY_METHOD[pick.method] } };`. In `moreStats.ts` add a module-local `const caloriesStat = (energy: EnergyOutcome): MoreStats['calories'] => { switch (energy.outcome) { case 'success': return energy.estimate; case 'blocked': return { blockedBy: energy.blockedBy }; case 'no covered method': return undefined; } };` and assign `stats.calories = caloriesStat(estimateSessionEnergy(…))` at `:154` (the property is still assigned, `undefined` where it was). In the spec `kcalOf` (`:16-19`) narrows on `result.outcome === 'success'` and reads `result.estimate.kcal`; `toEqual({ blockedBy: 'x' })` (`:110`, `:117`, `:125`, `:133`) → `toEqual({ outcome: 'blocked', blockedBy: 'x' })`; `toBeUndefined()` (`:77`, `:137`) → `toEqual({ outcome: 'no covered method' })`; the `'blockedBy' in result` guard at `:24` → `result.outcome !== 'success'`.
   Check: `rg -n "EnergyBlocked \| undefined|'blockedBy' in" packages/engine` prints nothing; `vp run check` clean; `vp run test` and `vp run e2e` green (the calories cell renders as before).

8. (packages/engine) Rewrite the engine's return rule.
   Files: `packages/engine/CLAUDE.md`
   Change: the **Return nullability** bullet (`CLAUDE.md:11`) is replaced by:

   ```md
   - **Return shape**: An operation with two or more anticipated failures returns a named outcome union discriminated by `outcome`, failures first, `{ outcome: 'success'; <payload> }` last (`DecouplingOutcome`, `EnergyOutcome`). An operation with a single "no result" returns `T | undefined`. Insufficient data degrades silently.
   - **Broken contracts are loud**: An input that contradicts its declared type or a documented precondition — a non-finite number, a non-positive threshold, thresholds that contradict each other, a distance running backwards — is logged with `console.warn('<function>: <condition>', <value>)` and then degrades exactly as before. A `switch` over a closed domain union ends in `default: { const unreachable: never = <value>; throw new Error('<function>: unknown <union>', { cause: unreachable }); }`. Nothing else throws or logs.
   ```

   Check: a human reads `packages/engine/CLAUDE.md` against `tdr/outcome-unions-over-exceptions.md` §1 (engine paragraph) and R7/R8; `rg -n "T \| null. for no valid result|Never throw" packages/engine/CLAUDE.md` prints nothing.

9. (packages/engine) Warn where the engine degrades on a broken contract.
   Files: `packages/engine/src/metrics.ts`, `packages/engine/src/vdot.ts`, `packages/engine/src/trainingEffect.ts`, `packages/engine/src/energy.ts`, `packages/engine/src/stress.ts`, `packages/engine/src/effortDetection.ts`; `packages/engine/tests/metrics.spec.ts`, `packages/engine/tests/vdot.spec.ts`, `packages/engine/tests/trainingEffect.spec.ts`, `packages/engine/tests/stress.spec.ts`
   Change: each branch below keeps its return value and gains one `console.warn` before it, naming the function as it is called when this item runs (the names-spell-out plan may have renamed it) and the condition, with the offending value as second argument. Branches for insufficient data (too few records, a missing optional field, a threshold that is `undefined`) stay silent.
   - `metrics.ts:14` (`ewmaStep`): a non-finite `todayTss` → `console.warn('ewmaStep: non-finite TSS', todayTss)` before `safeTss` stays `0`; `:19` a non-finite `result` → `console.warn('ewmaStep: non-finite load', result)` before `return previous`.
   - `vdot.ts:80` (`predictRaceTime`): the solver bracket check `f(lo) < 0 || f(hi) > 0` → `console.warn('predictRaceTime: no root in the solver bracket', vdot)`; `:109` (`predictRaceTimes`): `!isFinite(vdot) || vdot <= 0` → `console.warn('predictRaceTimes: invalid VDOT', vdot)`.
   - `trainingEffect.ts:127`: `thresholds.maxHr <= thresholds.restHr` → `console.warn('calculateTrainingEffect: max HR not above rest HR', thresholds)`.
   - `energy.ts:103` (`intervalJoules`): `dx < 0` → `console.warn('intervalJoules: distance runs backwards', dx)`.
   - `stress.ts:133` (`intensityFactor`): `ftp <= 0` → `console.warn('intensityFactor: non-positive FTP', ftp)`.
   - `effortDetection.ts:656` and `:660` (`referenceOf`): split each condition so `=== undefined` stays a silent `return undefined` and `<= 0` warns first: `console.warn('referenceOf: non-positive FTP', thresholds.ftp)` / `console.warn('referenceOf: non-positive threshold pace', thresholds.thresholdPace)`.
   No `switch` exists in `packages/engine/src` today (`rg -n "switch \(" packages/engine/src` prints nothing), so R8's throwing default applies to new code only.
   Behaviour change (owner-accepted): new console output when the app passes contract-breaking input; every returned value is unchanged.
   Check: new spec cases pin the warning, each with `const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});` and `warn.mockRestore()` in `afterEach`: `trainingEffect.spec.ts` (`maxHr` equal to `restHr` returns `undefined` and calls `warn` with `'calculateTrainingEffect: max HR not above rest HR'` and the thresholds), `stress.spec.ts` (`intensityFactor(200, 0)` returns `undefined` and warns `'intensityFactor: non-positive FTP', 0`), `vdot.spec.ts` (`predictRaceTimes(0, 0)` returns `undefined` and warns), `metrics.spec.ts` (a session with `tss: Number.NaN` keeps the load and warns `'ewmaStep: non-finite TSS'`); an insufficient-data case in each spec asserts `expect(warn).not.toHaveBeenCalled()`. `vp run test` green; `rg -n "console\.warn" packages/engine/src` lists exactly the nine sites above.

### packages/gpx

`packages/gpx` never throws today. Only `parseGpx` has more than one anticipated failure; every other gpx function has a single "no result" case and keeps `T | null`.

10. (packages/gpx) Return an outcome union from `parseGpx`.
   Files: `packages/gpx/src/parseGpx.ts`, `packages/gpx/tests/parseGpx.spec.ts`, `packages/gpx/tests/routeCut.spec.ts`, `apps/web/src/features/studio/createStudioRoute.ts`
   Change: declare below `ParsedGpx` (`parseGpx.ts:11-14`) `export type ParseGpxOutcome = { outcome: 'malformed xml' } | { outcome: 'not gpx' } | { outcome: 'too few points' } | { outcome: 'success'; gpx: ParsedGpx };` and make `parseGpx` (`:84-96`) return it: `:86` `return { outcome: 'malformed xml' };`, `:87` `return { outcome: 'not gpx' };`, `:93` `return { outcome: 'too few points' };`, `:95` `return { outcome: 'success', gpx: { name: parseName(doc), points } };` (same checks in the same order, same payload). `createStudioRoute.ts:49-54` becomes `const parsed = parseGpx(text); if (parsed.outcome !== 'success') return null; return createStudioRouteFromPoints(parsed.gpx.points, { name: parsed.gpx.name ?? meta.fallbackName, sourceFileName: meta.sourceFileName });` — every failure still yields `null` until item 11 maps the failure members to copy. In `parseGpx.spec.ts` add below `trkpt` a local `const parsedGpx = (text: string): ParsedGpx => { const result = parseGpx(text); if (result.outcome !== 'success') throw new Error(result.outcome); return result.gpx; };` (import the type, exported for the spec) and read it in the success cases (`:17-120`, `result?.` becomes `result.`); the failure cases assert the member: `:123` and `:124` `toEqual({ outcome: 'too few points' })`, `:128` and `:129` `toEqual({ outcome: 'malformed xml' })`, `:133` `toEqual({ outcome: 'not gpx' })`. `routeCut.spec.ts:29-31` becomes `if (parsed.outcome !== 'success') throw new Error('fixture must parse'); return geometryOf(parsed.gpx.points).points;`.
   Check: `rg -n "ParsedGpx \| null|parseGpx\([^)]*\)\s*\?\?|if \(!parsed\)" packages/gpx apps/web/src --glob '!node_modules'` prints nothing; `vp run check` clean; `vp run test` and `vp run e2e` pass (GPX import and "edit in studio" behave as before).

11. (packages/gpx, apps/web) Name the GPX parse failure in the toast, one message per failure member.
   Files: `apps/web/src/features/studio/createStudioRoute.ts`, `apps/web/src/features/studio/hooks/useGpxImport.ts`, `apps/web/src/features/sessions/session/hooks/useEditInStudio.ts`, new `apps/web/src/microcopy/gpxImport.ts` (or the existing module of that name), `packages/i18n/messages/en.json`, `packages/i18n/messages/de.json`, `apps/web/e2e/studio.spec.ts`
   Change: `createStudioRouteFromGpx` returns `Promise<CreateStudioRouteOutcome>` with `export type CreateStudioRouteOutcome = { outcome: GpxParseFailure } | { outcome: 'success'; routeId: string };` and `export type GpxParseFailure = Exclude<ParseGpxOutcome['outcome'], 'success'>;` (both in `createStudioRoute.ts`): `if (parsed.outcome !== 'success') return { outcome: parsed.outcome };`, then `const routeId = await createStudioRouteFromPoints(…); if (routeId === null) return { outcome: 'too few points' }; return { outcome: 'success', routeId };` (`createStudioRouteFromPoints` returns `null` only when `buildRouteGeometry` gets fewer than two points, `packages/gpx/src/routeGeometry.ts:91`, the same condition). New message keys (en / de):
   - `toast_gpx_failure_malformed_xml`: "This file isn't readable XML." / "Diese Datei ist kein lesbares XML."
   - `toast_gpx_failure_not_gpx`: "This file isn't a GPX route." / "Diese Datei ist keine GPX-Route."
   - `toast_gpx_failure_too_few_points`: "This route has fewer than two points." / "Diese Route hat weniger als zwei Punkte."

   `microcopy/gpxImport.ts` exports `export const DESCRIPTION_BY_GPX_FAILURE: Record<GpxParseFailure, () => string> = { 'malformed xml': m.toast_gpx_failure_malformed_xml, 'not gpx': m.toast_gpx_failure_not_gpx, 'too few points': m.toast_gpx_failure_too_few_points };`. At the boundary that raises the toast:
   - `useGpxImport.ts`: `importFile` returns `CreateStudioRouteOutcome | { outcome: 'unreadable file' }` (the `file.text()` catch); `handleFiles` collects the parse failures in a `Set<GpxParseFailure>`. The failed toast (`:46-60`) keeps its title, id and variant and gets `description` = `DESCRIPTION_BY_GPX_FAILURE[failure]()` when the set holds exactly one failure, and no description when it holds several or none (an unreadable file).
   - `useEditInStudio.ts:30-33`: `if (created.outcome !== 'success') { toast(m.toast_edit_in_studio_failed(), DESCRIPTION_BY_GPX_FAILURE[created.outcome](), 'error'); return; }`, then navigate with `created.routeId`.
   If the snackbar-feedback-via-feature-maps plan has already replaced these `toast(...)` calls, pass the same description through its entry instead. Behaviour change (owner-accepted): the GPX import and edit-in-studio failure toasts carry a second line naming the reason.
   Check: `vp run -F @pacevault/i18n compile && vp check` clean; extend `apps/web/e2e/studio.spec.ts:150-163` ("rejects an invalid file with a toast") to assert `page.getByTestId('gpx-import-failed')` contains `"This file isn't readable XML."` for the `'not a gpx file'` buffer; `vp run test` and `vp run e2e` pass.

12. (packages/gpx) Rewrite the gpx return rule.
   Files: `packages/gpx/CLAUDE.md`
   Change: the **External data through Zod** bullet (`CLAUDE.md:9`) becomes:

   ```md
   - **External data through Zod, outcomes for failures**: Parsed GPX is validated with `safeParse`. An operation with two or more anticipated failures returns a named outcome union discriminated by `outcome`, failures first, `{ outcome: 'success'; <payload> }` last (`ParseGpxOutcome`). An operation with a single "no result" returns `T | null` (`buildGpxString`, `buildRouteGeometry`, `pointAtRouteDistance`, `routeDistanceAtPosition`). Never throw, never log.
   ```

   Check: a human reads `packages/gpx/CLAUDE.md` against `tdr/outcome-unions-over-exceptions.md` §1 (gpx paragraph).

### tools/workbench

The board's line edits and the scripts' git reading return outcome unions (owner decision). Every refusal keeps today's HTTP code and message, and every script keeps its stderr line and exit code.

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

13. (tools/workbench) Return the line edits' refusals as an outcome union (R1, R3, R5).
   Files: `tools/workbench/site/src/lib/writeBack.ts`, `tools/workbench/site/src/actions/index.ts`, `tools/workbench/tests/site/src/lib/writeBack.spec.ts` (`tools/workbench/tests/writeBack.spec.ts` if the mirrored-spec plan has not run)
   Change: `EditResult` (`writeBack.ts:13-15`, `{ ok: true; text; diff } | { ok: false; reason: 'missing' | 'duplicate' | 'unchanged' }`) becomes

   ```ts
   export type EditOutcome =
     | { outcome: 'missing' }
     | { outcome: 'duplicate' }
     | { outcome: 'unchanged' }
     | { outcome: 'success'; text: string; diff: string };
   ```

   `editLine`, `deleteLine`, `insertLine` and the module-local `done` return `EditOutcome`: every `{ ok: false, reason: 'x' }` becomes `{ outcome: 'x' }`, `{ ok: true, text, diff }` becomes `{ outcome: 'success', text, diff }`. In `actions/index.ts` the type import and the `edit` parameters of `planEdit` and `reviewEdit` read `EditOutcome`, and `applied` (`:81-90`) handles every member:

   ```ts
   const applied = (path: string, edit: EditOutcome): string => {
     switch (edit.outcome) {
       case 'success':
         return edit.text;
       case 'unchanged':
         throw new ActionError({ code: 'BAD_REQUEST', message: 'Nothing to change.' });
       case 'missing':
       case 'duplicate':
         throw new ActionError({
           code: 'CONFLICT',
           message: `tools/workbench/backlog/${path} changed since the board rendered it; the board now shows the current file.`,
         });
     }
   };
   ```

   The spec's expectations `{ ok: false, reason: 'missing' }` (`writeBack.spec.ts:100-131`) become `{ outcome: 'missing' }` and so on, and its helper at `:39` reads `if (result.outcome !== 'success') throw new Error(\`edit refused: ${result.outcome}\`);`.
   Check: `rg -n "ok: (true|false)|\.ok\b|reason: '(missing|duplicate|unchanged)'|result\.reason" tools/workbench/site/src/lib/writeBack.ts tools/workbench/site/src/actions/index.ts tools/workbench/tests` prints nothing; workbench check; suite (the action specs assert the 409 and 400 messages unchanged).

14. (tools/workbench) Return a failed git read as an outcome (R1, R3, R5).
   Files: `tools/workbench/scripts/changedFiles.ts`, `tools/workbench/scripts/deps.ts`, `tools/workbench/scripts/interfaces.ts`
   Change: `gitChanges` (`changedFiles.ts:96-109`) returns `GitChangesOutcome = { outcome: 'git failed' } | { outcome: 'success'; base: string; ref: string; changes: FileChange[] }` (replacing `GitChanges | undefined`): `if (base === undefined) return { outcome: 'git failed' };`, the same for `diff`/`untracked`, and the last line returns `{ outcome: 'success', base: sha, ref, changes: parseChanges(diff, untracked) }`. The module-local `git` helper keeps printing `git <args>: <stderr>` and returning `undefined`, so stderr is unchanged. The callers (`deps.ts:594-595`, `interfaces.ts:388-389`) read `const changes = gitChanges(…); if (changes.outcome !== 'success') process.exit(1);` and use `changes.base`, `changes.ref`, `changes.changes` after the guard as today.
   Check: `rg -n "=== undefined\) process\.exit" tools/workbench/scripts/deps.ts tools/workbench/scripts/interfaces.ts` no longer lists the git reads; `rg -n "GitChanges \| undefined" tools/workbench/scripts` prints nothing; workbench check; suite.

## Open items

- R1 audit of `apps/web/src/lib/` found no other anticipated failure signalled by `throw`: `lib/thresholdsAt.ts:26` (a profile without its required threshold history) and `lib/archive.ts:51` (an entry the same archive listing just returned) are broken invariants, `lib/indexeddb.ts:126` rethrows an infrastructure failure, and `lib/debug/*` throws on purpose. All conform to R2. HTTP failures in `lib/intervals.ts` and `lib/weather.ts` throw `FailedResponseError` per the authenticated-fetch record; they are transport, not domain operations.
- R4 is moot: there is no service/controller layering to propagate unions through.
- R6 subject: item 11 maps the `parseGpx` failure members to copy in the toast-raising hooks. Failed FIT parses still surface only as a count in the import summary (`ImportProgressOverlay`); when a FIT failure reason gets user-facing copy, map the `outcome` literal to a Paraglide message at the same boundary, not in the parser.

- `packages/engine`: functions with one "no result" case keep their current return (`T | undefined`, or `T | null` for `unionBounds`, `densestClusterBounds` and `computeWindExposure`); unifying those three on `undefined` changes a returned value and is not planned (follow-up: backlog item conventions-follow-ups). The engine throws only from R8's unreachable `default` branch and logs only R7's contract warnings (items 8 and 9).

- `packages/gpx`: the single-failure functions keep `null` rather than the engine's `undefined`; unifying them changes a returned value and is not planned (follow-up: backlog item conventions-follow-ups).
- `tools/workbench`: `cruiseRepo` (`scripts/deps.ts`) keeps `Cruise | undefined` and the module-local `git` helper `string | undefined`; each has one failure and prints its reason itself, and the owner chose unions for the line edits and `gitChanges`.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
