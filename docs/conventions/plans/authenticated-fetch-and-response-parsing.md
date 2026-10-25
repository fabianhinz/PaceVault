---
id: authenticated-fetch-and-response-parsing
tdr_reference: tdr/authenticated-fetch-and-response-parsing.md
generated: 2026-10-23
---

# Authenticated fetch and response parsing

Read `tdr/authenticated-fetch-and-response-parsing.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None. Several files below are also moved or reshaped by the hook-directory and one-server-call plans; each item names today's path and the path after those plans (`apps/web/src/queries/intervals/...`). Use whichever exists.

## Changes

1. Add the shared failed-response error type and its reason parser.
   Files: new `apps/web/src/lib/fetchResponse.ts`
   Change: create the module with exactly this content (no comments):

   ```ts
   export type FailedResponseReason = 'unauthorized' | 'rate-limited' | 'failed';

   export const failedResponseReason = (response: Response): FailedResponseReason => {
     if (response.status === 401 || response.status === 403) return 'unauthorized';
     if (response.status === 429) return 'rate-limited';
     return 'failed';
   };

   export class FailedResponseError extends Error {
     public readonly response: Response;
     public readonly reason: FailedResponseReason;

     constructor(options: { operation: string; response: Response }) {
       const reason = failedResponseReason(options.response);
       super(`${options.operation} failed with status ${options.response.status}. Reason: ${reason}`);
       this.name = 'FailedResponseError';
       this.response = options.response;
       this.reason = reason;
     }
   }
   ```

   Check: `vp check` passes; `rg -n "class FailedResponseError" apps/web/src` prints one line.

2. Make the intervals.icu transport throw on a failed response instead of returning a result union.
   Files: `apps/web/src/lib/intervals.ts`
   Change: delete `type IntervalsResult<T>` (`:9`) and `classify` (`:26-30`). `export type IntervalsErrorCode = 'unauthorized' | 'rate-limited' | 'network' | 'failed';` becomes `export type IntervalsErrorCode = FailedResponseReason | 'network';` and gains a mapper used at the UI boundary: `export const intervalsErrorCode = (error: unknown): IntervalsErrorCode => { if (error instanceof FailedResponseError) return error.reason; if (error instanceof TypeError || error instanceof DOMException) return 'network'; return 'failed'; };` (today every exception thrown while building or sending the request, including a `btoa` `DOMException` for a key with non-Latin-1 characters, becomes `'network'`; the mapper keeps that). Build the Basic auth header in one named place and make `intervalsRequest` return `Promise<Response>` with no `try/catch` (a network failure rejects with the platform `TypeError`):

   ```ts
   const intervalsAuthorization = (apiKey: string): string => `Basic ${btoa(`API_KEY:${apiKey}`)}`;

   const intervalsRequest = async (
     apiKey: string,
     path: string,
     params?: Record<string, string>,
   ): Promise<Response> => {
     let url = `${BASE_URL}${path}`;
     if (params !== undefined) url = `${url}?${new URLSearchParams(params).toString()}`;
     const response = await fetch(url, {
       method: 'GET',
       credentials: 'omit',
       headers: { Authorization: intervalsAuthorization(apiKey) },
     });
     if (!response.ok) {
       throw new FailedResponseError({ operation: `intervals.icu GET ${path}`, response });
     }
     return response;
   };
   ```

   `verifyIntervalsKey(apiKey): Promise<void>` awaits the request and returns nothing. `listIntervalsActivities(apiKey, oldest): Promise<IntervalsActivity[]>` returns the parsed array (the Zod `safeParse` per row and the `[]` fallback for a non-array body stay). `downloadActivityFit(apiKey, activity): Promise<ArrayBuffer>` keeps today's fallback rule (`:113-121`) and today's handling of a failed body read: add `const readActivityBody = async (response: Response): Promise<ArrayBuffer> => { try { return await response.arrayBuffer(); } catch (error) { throw new Error('Reading an intervals.icu FIT file failed', { cause: error }); } };`; for a FIT original, `let original: Response | undefined = undefined; try { original = await intervalsRequest(apiKey, `/activity/${activity.id}/file`); } catch (error) { if (error instanceof FailedResponseError && error.reason === 'rate-limited') throw error; } if (original !== undefined) return readActivityBody(original);` (only the request sits inside the `try`, so a failed body read still propagates instead of falling back), then `return readActivityBody(await intervalsRequest(apiKey, `/activity/${activity.id}/fit-file`));`. The wrapper keeps a body-read failure distinguishable from a request failure (`FailedResponseError`, the platform `TypeError`, or a `DOMException` from building the header), which item 4 relies on. Delete the two comment lines at `:53-54`.
   Check: `rg -n "ok: (true|false)|IntervalsResult|classify" apps/web/src/lib/intervals.ts` prints nothing; `vp check` reports errors only in the consumers fixed in items 3–5.

3. Pass the API key into the sync job explicitly and branch on the thrown error.
   Files: `apps/web/src/features/intervals/runIntervalsSync.ts`, `apps/web/src/features/intervals/hooks/useIntervalsSync.ts` (or `apps/web/src/queries/intervals/useIntervalsSync.ts`)
   Change: `runIntervalsSync(options: { queryClient; full?; foreground? })` gains `apiKey: string | null` in its options object and stops reading `useIntervalsStore.getState().apiKey` (`:45`); `if (options.apiKey === null || profile === null) return NOTHING;`. The listing call becomes `let listing: IntervalsActivity[]; try { listing = await listIntervalsActivities(options.apiKey, oldest); } catch (error) { if (intervalsErrorCode(error) === 'unauthorized') useIntervalsStore.getState().markIntervalsKeyInvalid(); throw error; }`, replacing `listed.ok`/`listed.code`/`listed.data` (`:52-64`, `:95`) with `listing`; the `throw new Error(listed.code)` goes away (the original error is rethrown). `runIntervalsImport` is called with `options.apiKey`. In `useIntervalsSync` the hook already selects `apiKey`; forward it: `queryFn: (ctx) => runIntervalsSync({ queryClient: ctx.client, apiKey })`.
   Check: `rg -n "getState\(\)\.apiKey" apps/web/src/features/intervals` prints nothing; `vp check` passes for these files.

4. Branch on the thrown download error in the import loop.
   Files: `apps/web/src/features/intervals/runIntervalsImport.ts`
   Change: replace `const download = await downloadActivityFit(apiKey, activity); if (!download.ok) { ... } else { ... }` (`:48-71`) with `let data: ArrayBuffer | undefined = undefined; try { data = await downloadActivityFit(apiKey, activity); } catch (error) { if (!(error instanceof FailedResponseError) && !(error instanceof TypeError) && !(error instanceof DOMException)) throw error; const code = intervalsErrorCode(error); if (code === 'rate-limited' || code === 'unauthorized') { fatal = code; break; } failed++; }` (only request failures are handled here, exactly the cases today's `download.ok === false` covers; a failed body read still aborts the import as today) followed by `if (data !== undefined) { try { <parse and batcher.add using data instead of download.data> } catch { failed++; } }`, then the unchanged `processed++; onProgress(processed);`.
   Check: `rg -n "download\.(ok|code|data)" apps/web/src` prints nothing; `vp test -- --run tests/features/intervals/intervalsImport.integration.test.ts` (from `apps/web/`) passes.

5. Read the key-check and connect errors through the mapper instead of casting the message.
   Files: `apps/web/src/features/intervals/hooks/useIntervalsKeyCheck.ts` (or `apps/web/src/queries/intervals/useIntervalsKeyCheck.ts`), `apps/web/src/features/intervals/IntervalsConnectionForm.tsx`
   Change: `verifyIntervalsKeyOrThrow` (or `checkIntervalsKey`) becomes a direct call: its body is `await verifyIntervalsKey(apiKey);` with no `result.ok` check and no `throw new Error(result.code)`. In the form, `const code = keyCheck.error.message as IntervalsErrorCode;` (`:65`) becomes `const code = intervalsErrorCode(keyCheck.error);`; the two `catch (err)` blocks (`:86-90`, `:123-127`) call `errorMessage(intervalsErrorCode(err))` instead of casting `err.message`; both `runIntervalsSync({ queryClient, ... })` calls (`:100`, `:106`) pass `apiKey: trimmed`.
   Check: `rg -n "as IntervalsErrorCode" apps/web/src` prints nothing; `vp check` passes.

6. Update the specs to the throwing contract and cover the failure branches.
   Files: `apps/web/tests/lib/intervals.spec.ts`, `apps/web/tests/features/intervals/intervalsSync.integration.test.ts`
   Change: `intervals.spec.ts`: `:31-32` becomes `const activities = await listIntervalsActivities(KEY);` (drop the `ok` guard); `:86-88` becomes `await expect(verifyIntervalsKey(KEY)).resolves.toBeUndefined();`; `:105-108` asserts `(await listIntervalsActivities(KEY)).map((a) => a.id)`; `:128-130` asserts `resolves.toBeInstanceOf(ArrayBuffer)`. Add `it('rejects with the failed response when the key is refused', ...)` stubbing a 401 and asserting `rejects.toMatchObject({ name: 'FailedResponseError', reason: 'unauthorized' })`, and `it('does not fall back to the generated file when the original is rate-limited', ...)` stubbing a 429 on `/file` and asserting one fetch call and `reason: 'rate-limited'`. `intervalsSync.integration.test.ts`: add `apiKey: 'key'` to every `runIntervalsSync({ ... })` call (the `connect()` helper stores that key); the 401 case (`:170-172`) asserts `rejects.toMatchObject({ reason: 'unauthorized' })`.
   Check: `vp test -- --run tests/lib/intervals.spec.ts tests/features/intervals` (from `apps/web/`) passes; then `vp run test` and `vp run e2e` from the root pass.

7. Make the Open-Meteo cluster request throw on a failed response (R4, R5).
   Files: `apps/web/src/lib/weather.ts`, `apps/web/tests/lib/weather.spec.ts`
   Change: in `fetchClusterWeather` (`weather.ts:318-331`) `if (!response.ok) return undefined;` → `if (!response.ok) { throw new FailedResponseError({ operation: 'Open-Meteo GET archive', response }); }`, with `import { FailedResponseError } from '@/lib/fetchResponse.ts';`; the `safeParse` and its `undefined` fallback for a malformed body stay, so the return type stays `Promise<OpenMeteoResponse | undefined>`. `fetchSessionWeather` keeps its `Promise.all` without a per-cluster catch, so one failed cluster rejects the whole lookup. Behaviour change accepted by the owner: the weather card shows no weather for that session and nothing is saved by `saveSessionWeather` (the query in `useSessionWeather.ts` ends in its error state, `retry: false`), where today the other clusters still give partial weather. In the spec, `stubFetch` (`weather.spec.ts:331-338`) gains a `status` argument passed through to the resolved object (`stubFetch(body, ok = true, status = 200)`), and the case `'returns undefined when the API responds with an error status'` (`:384-392`) is replaced by `it('rejects with the failed response when a cluster responds with 500', ...)`: `stubFetch({}, false, 500)`, then `await expect(fetchSessionWeather('s1', sessionDate, 1800, records)).rejects.toMatchObject({ name: 'FailedResponseError', reason: 'failed' });`.
   Check: `rg -n "if \(!response\.ok\) return" apps/web/src/lib` prints nothing; `vp test -- --run tests/lib/weather.spec.ts` (from `apps/web/`) passes, including the new 500 case; `vp run test` and `vp run e2e` pass.

## Open items

- R1 already holds: `apps/web/src/lib/intervals.ts` and `apps/web/src/lib/weather.ts` call the platform `fetch` directly; there is no shared client or HTTP library.
- R2 scope: intervals.icu uses Basic auth with the literal user `API_KEY` (built only in `intervalsAuthorization`); Open-Meteo and the CARTO tiles take no auth header. The CARTO key is a URL parameter read from `import.meta.env.VITE_CARTO_API_KEY`.
- Response-body validation stays the Zod `safeParse` + fallback the root `CLAUDE.md:30` prescribes; this record only changes how a non-ok status is signalled.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
