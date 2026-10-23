---
kind: pattern-apply-tdr-reference
id: navigation-through-router-hooks
title: Navigation and URL state go through the project's own router hooks
summary: Every destination is a named page in src/routing/pageRegistry.ts reached through usePageRouting, URL state goes through useRouterParam/useRouterQuery, react-router-dom is imported only in src/routing/, and in-app links are PageLink, never the framework's Link/NavLink.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Navigation and URL state go through the project's own router hooks

## 1. Context

This file carries rules R1–R9.

Every destination in PaceVault is a **named page** with a typed parameter object, not a path string assembled at the call site. `apps/web/src/routing/pageRegistry.ts` owns the map from page name to URL and to route pattern, and a small family of hooks beside it owns the three things a component ever needs from the router: go somewhere (`usePageRouting`), read or write a piece of URL state (`useRouterParam`, `useRouterQuery`), and ask where we currently are (`useCurrentPage`, `useRouteMatch`). Without this indirection a path shape is duplicated across call sites in template literals (`/sessions/${id}`, `/labs?tab=studio`), and moving a segment becomes a grep-and-pray refactor; with it, changing a URL shape is a one-file edit and a missing parameter is a compile error.

Scope: all modules under `apps/web/src`. React Router v7 (`react-router-dom`) is imported only inside `apps/web/src/routing/`, which also holds the router shell (`AppRouter`, `AppRoutes`, `PageOutlet`) and the in-app link `PageLink`. Tests under `apps/web/tests/` may mount `MemoryRouter` directly.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Navigate by calling `usePageRouting().open({ page, params })` with a page **name** and its typed parameter object — never by building a path string and handing it to `navigate`. | proposed |
| R2 | Register every destination in `apps/web/src/routing/pageRegistry.ts`: the `SUPPORTED_PAGES` const object, the `SupportedPage` union derived from it, `PAGE_PATTERNS` (name -> route pattern) and `PAGE_TO_URL` (name -> `(params) => string`), both constrained by `satisfies Record<SupportedPage, …>`. Adding a route means adding an entry there; `AppRoutes` takes its paths from `PAGE_PATTERNS`. | manual |
| R3 | Read a single piece of URL state — a path param or a search param — through `useRouterParam(key)`, keyed by a member of `SupportedQuery`, not by `useParams()`, `useSearchParams()` or a bare string. | proposed |
| R4 | Register every URL key in the `SUPPORTED_QUERY` const object in `apps/web/src/routing/urlQuery.ts` and derive the key union from it; a key that is not in that object does not exist. | manual |
| R5 | Write URL state through `useRouterQuery().push(key, value)`, never by calling `setSearchParams` outside `apps/web/src/routing/`. `push` replaces the whole query with the one key, as the app's tab switches always have. | proposed |
| R6 | Answer "which page am I on" with `useCurrentPage()` or `useRouteMatch(page)`, both of which resolve against `PAGE_PATTERNS`, rather than comparing `location.pathname` or prefixes by hand. | manual |
| R7 | Import `react-router-dom` only inside `apps/web/src/routing/`. Everywhere else, consume routing through a hook or component from that directory. | proposed |
| R8 | Never import the framework's link components (`Link`, `NavLink`) — not even inside `apps/web/src/routing/`. Render in-app navigation affordances with `PageLink` (`apps/web/src/routing/PageLink.tsx`: a native anchor with `href={pageUrl(to)}`, styled through `className` or `Button asChild`) whose plain left click makes the explicit `usePageRouting().open(to)` call; modified clicks keep the browser's behaviour. Active state (`aria-current`, highlight) comes from `useCurrentPage()`, not from `NavLink`. External links keep `@pacevault/ui/components/ExternalLink.tsx`. | proposed |
| R9 | When a module needs a routing capability the hooks do not expose yet (the raw path for an error-boundary reset key became `useCurrentPath`), widen the routing directory rather than reaching past it from a feature module. `apps/web/src/routing/` is the only place allowed to hold a lint suppression for a restricted router import. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "\\bnavigate\\(\\s*[`'\"]"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Cannot see a path built into a variable one line earlier. Also run
    `rg -n "useNavigate" apps/web/src --glob '!**/routing/**'`; any hit is a violation.
R2:
  type: manual
  reason: >
    Whether a new destination was added to the registry rather than hand-assembled requires
    knowing which URLs the app has. The `satisfies Record<SupportedPage, …>` constraints make the
    registry itself total, which the type checker already covers.
  enforcedBy: null
R3:
  type: grep
  pattern: "\\buse(Params|SearchParams)\\("
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Flags a bulk read of the whole query bag, which no hook covers yet; widen the hooks (R9)."
R4:
  type: grep
  pattern: "useRouterParam\\(\\s*['\"`]([^'\"`]+)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    The hook's argument is typed against SupportedQuery, so an unregistered key already fails the
    type checker; this entry catches keys written into URLs by other means.
R5:
  type: grep
  pattern: "setSearchParams\\("
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R6:
  type: grep
  pattern: "pathname\\s*(===|!==|\\.startsWith\\()"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Path fragments in analytics tags or test ids are not routing decisions; read each hit."
R7:
  type: grep
  pattern: "from\\s+['\"]react-router(-dom)?['\"]"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Flags a type-only import of a router type in a helper signature, which is inert but still belongs in routing/."
R8:
  type: lint
  pattern: "no-restricted-imports (paths: react-router-dom, importNames Link and NavLink)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Not configured in the root `vite.config.ts` lint block today. Until it is:
    `rg -n "\\b(Link|NavLink)\\b" apps/web/src | rg "react-router"` must print nothing.
R9:
  type: grep
  pattern: "(oxlint|eslint)-disable(-next-line)?\\s+.*no-restricted-imports"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A suppression for an unrelated restricted module; read the suppressed line."
```

## 4. Trade-offs

- **Good, because** a destination becomes a compile-time name with a typed parameter object: a renamed segment or a newly required parameter breaks the build at every call site instead of silently landing on the `*` redirect.
- **Good, because** URL shape lives in exactly one module, so restructuring the URL space is a one-file edit.
- **Good, because** every URL write goes through one hook, so the write semantics (today: replace the query with the one key) are decided in one place.
- **Bad, because** `PageLink` pushes a history entry even when the target is the current location, where the framework's `Link` replaced it, and active-tab state has to be derived from `useCurrentPage()` by hand.
- **Good, because** the indirection is a seam: the registry entries are plain functions, testable without mounting a router.
- **Bad, because** the registry must be updated for every new route and grows monotonically; it is the one file every routing change touches.
- **Bad, because** the wrapper hides router capabilities. Anything the hooks do not expose has no compliant option until the routing directory is widened.
- **Bad, because** a named page carries less information than a path: a reader must open the registry to learn what URL a call produces.
- **Neutral, because** the registry doubles as the app's route inventory, so `AppRoutes` and `useCurrentPage` read the same source.

## 5. Reference implementation

```ts
export const SUPPORTED_PAGES = {
  dashboard: 'dashboard',
  sessions: 'sessions',
  sessionDetail: 'sessionDetail',
  tripDetail: 'tripDetail',
  studioDetail: 'studioDetail',
  labs: 'labs',
  settings: 'settings',
} as const;
export type SupportedPage = (typeof SUPPORTED_PAGES)[keyof typeof SUPPORTED_PAGES];

export const PAGE_TO_URL = {
  dashboard: (_params: NoParams) => '/',
  sessions: (params: { tab?: SessionsTab }) => withTab('/sessions', params.tab),
  sessionDetail: (params: { sessionId: string }) =>
    `/sessions/${encodeURIComponent(params.sessionId)}`,
  tripDetail: (params: { tripId: string }) => `/trips/${encodeURIComponent(params.tripId)}`,
  studioDetail: (params: { routeId: string; tab?: StudioDetailTab }) =>
    withTab(`/studio/${encodeURIComponent(params.routeId)}`, params.tab),
  labs: (params: { tab?: LabsTab }) => withTab('/labs', params.tab),
  settings: (params: { tab?: SettingsTab }) => withTab('/settings', params.tab),
} satisfies Record<SupportedPage, (params: never) => string>;

export type PageTarget = {
  [P in SupportedPage]: { page: P; params: Parameters<(typeof PAGE_TO_URL)[P]>[0] };
}[SupportedPage];

export interface PageRouting {
  open: (target: PageTarget) => void;
}

export const usePageRouting = (): PageRouting => {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      open: (target) => {
        void navigate(pageUrl(target));
      },
    }),
    [navigate],
  );
};
```

At the call sites, navigation names a destination, never a path:

```tsx
const pageRouting = usePageRouting();
pageRouting.open({ page: 'labs', params: { tab: 'studio' } });

const rawTab = useRouterParam('tab') ?? null;
const routerQuery = useRouterQuery();
routerQuery.push('tab', value);
```

In-app links render `PageLink`, never `Link`/`NavLink`:

```tsx
<PageLink to={{ page: 'sessionDetail', params: { sessionId: pb.sessionId } }} className="block">
  {row}
</PageLink>
```

## 6. Forbidden practices

- Importing `react-router-dom` in a feature, page or component module, in any form, and calling `navigate`, `useParams`, `useSearchParams`, `useMatch` or `useLocation` on it directly.
- Building a path with a template literal or string concatenation (`/trips/${id}`, `/labs?tab=studio`) and passing it to any navigation call or `href`.
- Reading a URL value with `searchParams.get('tab')` or `useParams<{ id: string }>()` outside the routing directory.
- Writing URL state with `setSearchParams` outside `apps/web/src/routing/` instead of `useRouterQuery().push`.
- Importing `Link` or `NavLink` from `react-router-dom` anywhere, including `apps/web/src/routing/`.
- Adding a URL key at a call site without registering it in `SUPPORTED_QUERY`.
- Rendering an anchor whose `href` is a hand-built application path in new code.
- Deciding "am I on page X" with `location.pathname === '/'` or `pathname.startsWith('/sessions')` instead of `useCurrentPage()` / `useRouteMatch()`.
- A lint suppression for a restricted router import outside `apps/web/src/routing/`.
