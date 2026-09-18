---
kind: pattern-apply-tdr-reference
id: navigation-through-router-hooks
title: Navigation and URL state go through the project's own router hooks
summary: Destinations and query keys are registry entries, and feature code navigates and reads URL state through project hooks rather than importing the router.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8, R9]
adopted: 2026-09-17
---

# Navigation and URL state go through the project's own router hooks

## 1. Context

This file carries R1–R9.

A destination is a name, not a path string. Feature code asks to go to a page by naming it and handing over typed parameters; `src/routing/` owns the single registry that turns that name into a URL, and the hooks that read and write URL state. Without it, a path is assembled inline at each call site, a renamed route breaks silently in the five places nobody searched, and a query key is a bare string that only agrees with the other four by luck.

URL state matters here more than navigation does. The session, labs and settings pages all keep tab and filter state in the query string, and a key read as `searchParams.get('tab')` in one module and written as `'activeTab'` in another is a bug nothing catches. The key registry is what closes that.

Scope: all of `src/`, except `src/routing/` itself and `src/App.tsx`, which mounts the route tree and is where the router is legitimately configured.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Navigate by calling the project's page-navigation hook with a page **name** and its typed parameter object — never by building a path string and handing it to the router's `navigate`. | proposed |
| R2 | Register every destination in the single page registry module: a `SUPPORTED_PAGES` const object, a union type derived from it, and a `PAGE_TO_URL` map of name to `(params) => string` builder, constrained by `satisfies Record<SupportedPage, …>`. Adding a route means adding an entry there. | manual |
| R3 | Read a single piece of URL state through the project's query-param hook, keyed by a member of the central query-key union — not by indexing a `searchParams` bag with a bare string. | proposed |
| R4 | Register every URL query key in the central `SUPPORTED_QUERY` const object and derive the key union from it; a key that is not in that object does not exist. | manual |
| R5 | Write URL state through the query hook's `push` / `replace` / `remove`, which preserve unrelated keys, rather than reassembling and replacing the whole query string. | proposed |
| R6 | Answer "which page am I on" with the current-page hook, which resolves the location against the registry, rather than comparing path strings by hand. | manual |
| R7 | Import `react-router-dom` only inside `src/routing/` and in `src/App.tsx`. Everywhere else, consume it through a hook from `src/routing/`. | proposed |
| R8 | Do not import the router's own `Link` component in feature code. A navigation affordance uses a link primitive from `src/components/ui/` with an explicit routing call. | proposed |
| R9 | When `src/routing/` does not yet expose a capability a feature needs, widen a hook there rather than reaching past it. `src/routing/` is the only place allowed to hold a suppression for the router import. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "navigate\\(`|navigate\\('/|navigate\\(\"/"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `navigate(-1)` and other history deltas do not match and are permitted.
R2:
  type: manual
  reason: >
    Confirming that every `<Route path>` in the route tree has a registry entry is a cross-file
    set comparison between two files.
  enforcedBy: null
R3:
  type: grep
  pattern: "useSearchParams\\(\\)"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: grep
  pattern: "searchParams\\.(get|set|delete)\\('"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R5:
  type: grep
  pattern: "setSearchParams\\(new URLSearchParams|setSearchParams\\(\\{"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A deliberate whole-query replacement — clearing every filter at once — is a legitimate
    operation that should be exposed as a hook method rather than written inline.
R6:
  type: grep
  pattern: "location\\.pathname (===|\\.startsWith|\\.includes)"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/routing/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "from 'react-router-dom'"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/routing/**", "src/App.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R8:
  type: grep
  pattern: "<Link\\b|\\bLink,|\\{ Link \\}"
  include: ["src/**/*.tsx"]
  exempt: ["src/routing/**", "src/components/ui/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches an unrelated component named `Link` from another library or from `src/components/ui/`.
R9:
  type: manual
  reason: >
    "Reaching past the hook" is a description of intent, visible only as an R7 violation with a
    justification attached.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** renaming a route is one registry edit, and every navigation to it fails the type check until the builder agrees.
- **Good, because** a query key is a union member, so the five modules that read and write tab and filter state cannot disagree about its spelling.
- **Good, because** URL writes preserve unrelated keys by construction, which is the bug that whole-query replacement causes and that nothing else catches.
- **Bad, because** the registry restates the paths that `<Route path="…">` already declares, and nothing checks the two against each other. A spec is the only guard, and it can rot.
- **Bad, because** it puts a project layer in front of a well-known library, so a developer who knows React Router has to learn this indirection before they can navigate anywhere.
- **Neutral, because** typed params make a builder's signature the place a route's shape is documented, which is precise but further from the route tree than the route tree is.

## 5. Reference implementation

`src/routing/pages.ts`:

```ts
export const SUPPORTED_PAGES = {
  dashboard: 'dashboard',
  sessionDetail: 'sessionDetail',
  tripDetail: 'tripDetail',
} as const;

export type SupportedPage = (typeof SUPPORTED_PAGES)[keyof typeof SUPPORTED_PAGES];

export const PAGE_TO_URL = {
  dashboard: () => '/',
  sessionDetail: ({ id }: { id: string }) => `/sessions/${id}`,
  tripDetail: ({ id }: { id: string }) => `/trips/${id}`,
} satisfies Record<SupportedPage, (params: never) => string>;

export const SUPPORTED_QUERY = { tab: 'tab', range: 'range', sport: 'sport' } as const;
export type SupportedQueryKey = (typeof SUPPORTED_QUERY)[keyof typeof SUPPORTED_QUERY];
```

Call sites:

```ts
const navigateToPage = useNavigateToPage();
navigateToPage('sessionDetail', { id: session.id });

const tab = useQueryParam(SUPPORTED_QUERY.tab);
tab.replace('laps');
```

## 6. Forbidden practices

- ❌ `navigate(`/sessions/${id}`)` — a path assembled at the call site, which a route rename breaks silently.
- ❌ `useSearchParams()` in feature code; the key is then a bare string and the write replaces the whole query.
- ❌ `searchParams.get('tab')` with a literal key — the next module spells it `activeTab` and neither is wrong until one of them is.
- ❌ `setSearchParams(new URLSearchParams({ tab }))` — it drops every unrelated key that was in the URL.
- ❌ `location.pathname.startsWith('/studio')` to decide which page is active; resolve against the registry instead.
- ❌ Importing `react-router-dom` outside `src/routing/` and `src/App.tsx`.
- ❌ Adding a route to `src/App.tsx` without adding it to the registry; the two are only in step because somebody keeps them there.
