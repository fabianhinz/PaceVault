---
id: navigation-through-router-hooks
tdr_reference: tdr/navigation-through-router-hooks.md
generated: 2026-09-17
---

# Navigation and URL state go through the project's own router hooks

Read `tdr/navigation-through-router-hooks.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Add the page registry.
   Files: new `src/routing/pages.ts`, new `tests/routing/pages.spec.ts`
   Change: declare a `SUPPORTED_PAGES` const object naming every destination the app has (dashboard, sessions, session detail, trips, trip detail, studio, studio route, labs, settings), a `SupportedPage` union derived from it, and a `PAGE_TO_URL` map of page name to a typed `(params) => string` builder, closed with `satisfies Record<SupportedPage, …>` so a new page fails the type check until it has a builder. Take the path shapes from the `<Route>` elements in `src/App.tsx` — the registry must agree with them exactly. Add the spec covering each builder's output.
   Check: `pnpm test -- --run tests/routing/pages.spec.ts` passes; every path in `src/App.tsx` has a matching entry.

2. Add the query-key registry.
   Files: `src/routing/pages.ts` or a sibling `src/routing/query.ts`, plus its spec
   Change: declare a `SUPPORTED_QUERY` const object holding every URL query key the app reads or writes, and derive the key union from it (R4). The current keys are whatever `src/pages/SessionsPage.tsx`, `SessionDetailPage.tsx`, `LabsPage.tsx`, `SettingsPage.tsx` and `src/features/map/hooks/useStudioMapTracks.ts` pass to `useSearchParams` — read all five and enumerate them. A key not in this object does not exist.
   Check: `grep -rn "searchParams.get(\|searchParams.set(" src` shows every key argument resolving to a member of `SUPPORTED_QUERY`.

3. Add the project's own routing hooks.
   Files: new `src/routing/useNavigateToPage.ts`, `src/routing/useQueryParam.ts`, `src/routing/useCurrentPage.ts`, plus specs
   Change: `useNavigateToPage` wraps React Router's `useNavigate` and takes a page name plus its typed params, resolving the URL through `PAGE_TO_URL` (R1). `useQueryParam` wraps `useSearchParams`, is keyed by a member of the query-key union, and exposes `push` / `replace` / `remove` that preserve unrelated keys (R3, R5). `useCurrentPage` resolves the current location against the registry rather than comparing path strings (R6).
   Check: `pnpm test -- --run tests/routing`; `pnpm check`.

4. Migrate the five pages and the map hook off React Router directly.
   Files: `src/pages/SessionsPage.tsx`, `src/pages/SessionDetailPage.tsx`, `src/pages/TripDetailPage.tsx`, `src/pages/LabsPage.tsx`, `src/pages/SettingsPage.tsx`, `src/features/map/hooks/useStudioMapTracks.ts`, `src/features/studio/StudioRouteItem.tsx`
   Change: replace `useSearchParams` with `useQueryParam` per key, and every `navigate('/some/' + id)` string build with a `useNavigateToPage` call naming the page and passing typed params. `src/features/studio/StudioRouteItem.tsx` has a `handleNavigate` that is the likely first path-string build.
   Check: R7's grep shows `react-router-dom` imported only under `src/routing/` and in `src/App.tsx`; `pnpm exec playwright test`.

5. Confine the router import to the routing directory.
   Files: all of `src/`
   Change: R7 — `react-router-dom` is imported only inside `src/routing/` and in `src/App.tsx`, which mounts the route tree and is the one place the router itself is configured. Everywhere else consumes a hook from `src/routing/`. Where a hook does not yet expose a capability a feature needs, widen the hook rather than reaching past it (R9).
   Check: `grep -rln "react-router-dom" src` lists only `src/App.tsx` and files under `src/routing/`; `pnpm check && pnpm build && pnpm exec playwright test`.

## Open items

R2's registry replaces path strings for *navigation*. It does not replace the `<Route path="…">` declarations in `src/App.tsx`, which are how React Router learns the shapes in the first place. The registry and the route tree therefore state the same paths twice, and nothing checks them against each other — item 1's spec is the only guard. If that duplication becomes a source of bugs, deriving the route tree from the registry is the follow-up, and it is out of scope here.

R8 of the original forbade the framework's own link component in favour of the UI library's link plus an explicit routing call. PaceVault has no `Link` usage today and no link primitive in `src/components/ui/`; the rule is carried in the TDR reference as a forward guard, and the first navigation affordance that needs one should add a `Link` wrapper to `src/components/ui/` rather than importing React Router's directly.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
