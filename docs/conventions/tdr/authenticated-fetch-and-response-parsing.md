---
kind: pattern-apply-tdr-reference
id: authenticated-fetch-and-response-parsing
title: Authenticated fetch and response parsing
summary: External requests use the platform fetch with the API's own auth header built in one place, take the API key as an argument, and throw FailedResponseError carrying the Response on a non-ok status.
governs:
  - "apps/web/src/lib/api/intervals.ts"
  - "apps/web/src/lib/api/weather.ts"
  - "apps/web/src/lib/api/fetchResponse.ts"
  - "apps/web/src/queries/**/*.ts"
  - "apps/web/src/mutations/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Authenticated fetch and response parsing

## 1. Context

This file carries rules R1–R6.

PaceVault talks to two HTTP APIs: intervals.icu (opt-in, authenticated with the user's own API key, `apps/web/src/lib/api/intervals.ts`) and Open-Meteo (anonymous, `apps/web/src/lib/api/weather.ts`). There is deliberately no shared HTTP client, interceptor or global key holder. Each transport module calls the platform `fetch` itself and repeats the same small sequence: attach the API's auth header (built in one place per API) from a key handed to it as an argument, guard the non-ok response, and throw an error that still carries the `Response`. Without that sequence the failure modes are silent: a request goes out with a stale key read from a store at the wrong moment, or a 4xx/5xx is turned into `undefined` and the UI renders emptiness as if it were the API's answer.

Scope: the transport modules in `apps/web/src/lib/api/` that call `fetch` (intervals.icu and Open-Meteo alike), and the read/write modules in `apps/web/src/queries/` and `apps/web/src/mutations/` that hand them the key. Body validation stays the Zod `safeParse` with a safe fallback from the root `CLAUDE.md` code rules; user-facing failure copy is mapped from the error's `reason` at the component boundary.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Perform the request with the platform `fetch` inside the transport module. Do not introduce or route through a shared client, wrapper, interceptor or third-party HTTP library. | manual |
| R2 | Send the API's own auth header on every call to an authenticated endpoint, built in exactly one function per API: intervals.icu `Authorization: Basic base64("API_KEY:<key>")` via `intervalsAuthorization(apiKey)`, with `credentials: 'omit'`. Anonymous APIs (Open-Meteo) send none. | manual |
| R3 | Take the API key as an explicit argument on every non-React function that needs it (`listIntervalsActivities(apiKey, ...)`, `runIntervalsSync({ apiKey, ... })`); read it from `useIntervalsStore` only in the React hook that calls them. Never read it from a store `getState()`, module scope or a global inside the fetching function. | manual |
| R4 | Guard `!response.ok` and throw from that branch, for intervals.icu and Open-Meteo alike. A failed Open-Meteo cluster request fails the whole weather lookup; it is not caught per cluster. Never return, parse or ignore a response that was not checked, and never turn a failed status into `undefined`, `[]` or a result union. | manual |
| R5 | In intervals.icu and Open-Meteo requests, throw `FailedResponseError` (`apps/web/src/lib/api/fetchResponse.ts`), which carries the originating `Response` and its `reason`, so a caller can branch on status. A bare `Error` is only for pre-flight guards that fail before a request is made; a network failure is the platform's own `TypeError`, rethrown untouched. | manual |
| R6 | Derive the failure reason with the shared parser `failedResponseReason(response)` (inside `FailedResponseError`'s constructor), not a per-module status switch or a hand-written static message. Map reasons to copy at the UI boundary through `intervalsErrorCode(error)`. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "from ['\"](axios|ky|superagent|got|ofetch)['\"]|apiClient|httpClient"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A local identifier coincidentally named httpClient that is not a shared transport."
R2:
  type: grep
  pattern: "Authorization:"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Expect exactly one header construction per authenticated API (today: one, in
    apps/web/src/lib/api/intervals.ts). A second hit means the header is being rebuilt elsewhere.
R3:
  type: grep
  pattern: "getState\\(\\)\\.apiKey"
  include: ["apps/web/src/lib/**/*.ts", "apps/web/src/components/**/*.ts", "apps/web/src/queries/**/*.ts", "apps/web/src/mutations/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Does not catch a key reached through an imported singleton under a different name."
R4:
  type: grep
  pattern: "if \\(!\\w*[rR]es(ponse)?\\.ok\\) return"
  include: ["apps/web/src/lib/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Response variables are named freely, so an unconventional name evades the pattern. Also run
    `rg -n "fetch\\(" apps/web/src` and confirm each call site has a `!response.ok` throw before the
    body is read.
R5:
  type: grep
  pattern: "throw new FailedResponseError\\("
  include: ["apps/web/src/lib/api/intervals.ts", "apps/web/src/lib/api/weather.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "Cannot tell a legitimate pre-flight `throw new Error` from a non-ok branch that should have thrown the response-carrying type."
R6:
  type: grep
  pattern: "status === (401|403|429)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/lib/api/fetchResponse.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Any status switch outside the shared parser is a second reason vocabulary. Also flags
    `as IntervalsErrorCode` casts of `error.message` (run `rg -n "as IntervalsErrorCode" apps/web/src`).
```

Nothing in the root `vite.config.ts` lint block covers any of this; every entry is review-time with `enforcedBy: null`.

## 4. Trade-offs

- **Good, because** the fetching function is a plain async function over its arguments — no provider, no module mock and no store reset is needed to test it, and a caller cannot send a request with a stale or absent key.
- **Good, because** the error that escapes the layer still carries the `Response`, so the connect form, the sync job and the import loop can branch on `reason` without each re-plumbing the status.
- **Bad, because** the guard-and-throw sequence is hand-rolled in every transport module rather than living in one client, and a change to the error vocabulary touches every module. A client that hides the key would reintroduce exactly the global the convention exists to avoid.
- **Neutral, because** the layer is uniform enough that a new endpoint is a copy of its neighbour, which partly offsets the duplication.

## 5. Reference implementation

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

```ts
const intervalsAuthorization = (apiKey: string): string => `Basic ${btoa(`API_KEY:${apiKey}`)}`;

export const listIntervalsActivities = async (
  apiKey: string,
  oldest: string = FULL_HISTORY_OLDEST,
): Promise<IntervalsActivity[]> => {
  const url = `${BASE_URL}/athlete/0/activities?${new URLSearchParams({ oldest, fields: ACTIVITY_FIELDS }).toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    headers: { Authorization: intervalsAuthorization(apiKey) },
  });
  if (!response.ok) {
    throw new FailedResponseError({ operation: 'intervals.icu GET /athlete/0/activities', response });
  }
  const raw: unknown = await response.json();
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    const parsed = intervalsActivitySchema.safeParse(entry);
    if (!parsed.success) return [];
    return [parsed.data];
  });
};

export const useIntervalsSync = (): UseQueryResult<QueryResults['intervalsSync']> => {
  const apiKey = useIntervalsStore((s) => s.apiKey);
  return useQuery({
    queryKey: intervalsSyncQueryKey(),
    queryFn: (ctx) => runIntervalsSync({ queryClient: ctx.client, apiKey }),
    enabled: apiKey !== null,
  });
};
```

## 6. Forbidden practices

- Reading the API key from `useIntervalsStore.getState()`, module scope or storage inside a fetching function — it decouples the request from the render that authorised it.
- Passing the whole store slice down instead of the key string.
- Parsing or returning the body before checking `response.ok`.
- Throwing a bare `Error` from the non-ok branch, or `throw new Error(code)` with the reason smuggled into the message — no caller can recover the status afterwards.
- Swallowing a non-ok response by returning `undefined`, `[]` or `{ ok: false }` — the query then resolves successfully and the UI renders emptiness as the API's answer.
- Casting `error.message as IntervalsErrorCode`; map the error with `intervalsErrorCode(error)`.
- A hand-written status switch outside `failedResponseReason`.
- Introducing a shared HTTP client or interceptor "just for auth" without retiring this convention first.

