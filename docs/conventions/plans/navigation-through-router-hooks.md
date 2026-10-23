---
id: navigation-through-router-hooks
tdr_reference: tdr/navigation-through-router-hooks.md
depends_on: [hook-directory-placement]
generated: 2026-10-23
---

# Navigation and URL state go through the project's own router hooks

Read `tdr/navigation-through-router-hooks.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`hook-directory-placement`](hook-directory-placement.md) — establishes `apps/web/src/routing/` as the dedicated routing hook directory (no `hooks/` inside it) that every module below is created in.

## Changes

1. Create the page registry and the URL query-key registry.
   Files: new `apps/web/src/routing/pageRegistry.ts`, new `apps/web/src/routing/urlQuery.ts`, `apps/web/src/lib/labsTab.ts`
   Change: export `LabsTab` from `lib/labsTab.ts` (`type LabsTab` at `:1` becomes `export type LabsTab`). `urlQuery.ts`:

   ```ts
   export const SUPPORTED_QUERY = { id: 'id', tab: 'tab' } as const;
   export type SupportedQuery = (typeof SUPPORTED_QUERY)[keyof typeof SUPPORTED_QUERY];
   ```

   `pageRegistry.ts`:

   ```ts
   import type { LabsTab } from '@/lib/labsTab.ts';

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

   export type SessionsTab = 'log' | 'trips' | 'records';
   export type StudioDetailTab = 'overview' | 'tools';
   export type SettingsTab = 'general' | 'data';
   type NoParams = Record<string, never>;

   export const PAGE_PATTERNS = {
     dashboard: '/',
     sessions: '/sessions',
     sessionDetail: '/sessions/:id',
     tripDetail: '/trips/:id',
     studioDetail: '/studio/:id',
     labs: '/labs',
     settings: '/settings',
   } satisfies Record<SupportedPage, string>;

   const withTab = (path: string, tab: string | undefined): string => {
     if (tab === undefined) return path;
     return `${path}?${new URLSearchParams({ tab }).toString()}`;
   };

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

   export type ResolvePageParams<P extends SupportedPage> = Parameters<(typeof PAGE_TO_URL)[P]>[0];

   export type PageTarget = {
     [P in SupportedPage]: { page: P; params: ResolvePageParams<P> };
   }[SupportedPage];

   export const pageUrl = (target: PageTarget): string => {
     const build = PAGE_TO_URL[target.page] as (params: PageTarget['params']) => string;
     return build(target.params);
   };
   ```

   Add `apps/web/tests/routing/pageRegistry.spec.ts` asserting `pageUrl({ page: 'sessionDetail', params: { sessionId: 'a/b' } })` is `/sessions/a%2Fb` and `pageUrl({ page: 'labs', params: { tab: 'studio' } })` is `/labs?tab=studio`.
   Check: `vp check` passes; `vp test -- --run tests/routing` (from `apps/web/`) passes.

2. Create the routing hook family over the registry.
   Files: new `apps/web/src/routing/usePageRouting.ts`, `apps/web/src/routing/useRouterParam.ts`, `apps/web/src/routing/useRouterQuery.ts`, `apps/web/src/routing/useCurrentPage.ts`, `apps/web/src/routing/useRouteMatch.ts`, `apps/web/src/routing/useCurrentPath.ts`
   Change: one hook per module, each the only place its react-router-dom hook is imported:
   - `usePageRouting.ts`: `export interface PageRouting { open: (target: PageTarget) => void; }`; `export const usePageRouting = (): PageRouting => { const navigate = useNavigate(); return useMemo(() => ({ open: (target) => { void navigate(pageUrl(target)); } }), [navigate]); };`
   - `useRouterParam.ts`: `export const useRouterParam = (key: SupportedQuery): string | undefined` reading `useParams()[key]` first and falling back to `useSearchParams()[0].get(key) ?? undefined`.
   - `useRouterQuery.ts`: `export interface RouterQuery { push: (key: SupportedQuery, value: string) => void; }`; `push` calls `setSearchParams({ [key]: value })`, which replaces the whole query exactly like today's `setSearchParams({ tab: value })` call sites (unrelated keys are dropped).
   - `useCurrentPage.ts`: `export const useCurrentPage = (): SupportedPage | null` looping over `Object.values(SUPPORTED_PAGES)` and returning the first page whose `matchPath(PAGE_PATTERNS[page], useLocation().pathname)` is non-null.
   - `useRouteMatch.ts`: `export interface RouteMatch { id: string | undefined; }`; `export const useRouteMatch = (page: SupportedPage): RouteMatch | null` returning `{ id: match.params.id }` for `matchPath(PAGE_PATTERNS[page], pathname)`, or `null`.
   - `useCurrentPath.ts`: `export const useCurrentPath = (): string => useLocation().pathname;` (for the route error boundary's reset key, which must change on every navigation, including between two session ids).
   Check: `vp check` passes; `find apps/web/src/routing -type d -name hooks` prints nothing.

3. Move the router shell into the routing directory.
   Files: new `apps/web/src/routing/AppRouter.tsx`, `apps/web/src/routing/AppRoutes.tsx`, `apps/web/src/routing/PageOutlet.tsx`; `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/components/layout/AppLayout.tsx`
   Change: `AppRouter.tsx`: `export const AppRouter: FC<PropsWithChildren> = (props) => <BrowserRouter>{props.children}</BrowserRouter>;` — `main.tsx:44-47` wraps with `<AppRouter>` instead of `<BrowserRouter>`. `AppRoutes.tsx`: `export const AppRoutes: FC = () => ...` holding the `<Routes>` block from `App.tsx:22-34` with every `path` taken from `PAGE_PATTERNS` (`<Route index ...>` for the dashboard, `PAGE_PATTERNS.sessionDetail` etc.) and the fallback `<Route path="*" element={<Navigate to={pageUrl({ page: 'dashboard', params: {} })} replace />} />`; `App.tsx` renders `<AppRoutes />` after the hydration gate and no longer imports `react-router-dom`. `PageOutlet.tsx`: `export const PageOutlet: FC = () => <Outlet />;`. In `AppLayout.tsx` replace `useLocation` + `<Outlet />` (`:8`, `:24`, `:28-30`) with `const currentPath = useCurrentPath();`, `resetKeys={[currentPath]}` and `<PageOutlet />`.
   Check: `rg -n "react-router-dom" apps/web/src/main.tsx apps/web/src/App.tsx apps/web/src/components/layout/AppLayout.tsx` prints nothing; `vp run e2e` passes.

4. Navigate by page name instead of path strings.
   Files: `apps/web/src/features/trips/TripItem.tsx`, `apps/web/src/features/trips/TripActionsMenu.tsx`, `apps/web/src/features/studio/StudioRouteItem.tsx`, `apps/web/src/features/studio/StudioActionsMenu.tsx`, `apps/web/src/features/sessions/SessionItem.tsx`, `apps/web/src/features/sessions/session/hooks/useEditInStudio.ts`, `apps/web/src/features/sessions/session/DeleteSessionDialog.tsx`, `apps/web/src/features/settings/DeleteAllDataDialog.tsx`
   Change: replace `const navigate = useNavigate();` with `const pageRouting = usePageRouting();` and each call: `TripItem.tsx:14,18` (the `/trips/` path built from `props.trip.id`) -> `pageRouting.open({ page: 'tripDetail', params: { tripId: props.trip.id } })`; `TripActionsMenu.tsx:48` `'/sessions?tab=trips'` -> `{ page: 'sessions', params: { tab: 'trips' } }`; `StudioRouteItem.tsx:12` -> `{ page: 'studioDetail', params: { routeId: props.route.id } }`; `StudioActionsMenu.tsx:52` `'/labs?tab=studio'` -> `{ page: 'labs', params: { tab: 'studio' } }`; `SessionItem.tsx:16` -> `{ page: 'sessionDetail', params: { sessionId: props.session.id } }`; `useEditInStudio.ts:35` -> `{ page: 'studioDetail', params: { routeId: id } }`; `DeleteSessionDialog.tsx:64` `'/sessions'` -> `{ page: 'sessions', params: {} }`; `DeleteAllDataDialog.tsx:55` `'/'` -> `{ page: 'dashboard', params: {} }`.
   Check: `rg -n "useNavigate|navigate\(" apps/web/src --glob '!**/routing/**'` prints nothing; `vp run e2e` passes.

5. Read path params and URL query state through the param and query hooks.
   Files: `apps/web/src/pages/TripDetailPage.tsx`, `apps/web/src/pages/SessionDetailPage.tsx`, `apps/web/src/pages/StudioDetailPage.tsx`, `apps/web/src/pages/SettingsPage.tsx`, `apps/web/src/pages/SessionsPage.tsx`, `apps/web/src/pages/LabsPage.tsx`
   Change: `const params = useParams<{ id: string }>();` and every `params.id` (`TripDetailPage.tsx:18-19`, `SessionDetailPage.tsx:18-30`, `StudioDetailPage.tsx:19-20`) become `const id = useRouterParam('id');` and `id`. Each `const [searchParams, setSearchParams] = useSearchParams();` + `searchParams.get('tab')` + `setSearchParams({ tab: value })` (`SettingsPage.tsx:34-42`, `StudioDetailPage.tsx:34-40`, `SessionsPage.tsx:12-18`, `LabsPage.tsx:25-30`) becomes `const rawTab = useRouterParam('tab') ?? null;` (keep each page's existing tab validation) and `const routerQuery = useRouterQuery();` with `routerQuery.push('tab', value)` in the change handler.
   Check: `rg -n "useParams|useSearchParams" apps/web/src --glob '!**/routing/**'` prints nothing; `vp run e2e` passes (tab switching on sessions, labs, settings and studio detail; deep links to `/labs?tab=studio`).

6. Answer "which page am I on" through the registry in the map, filters and layout.
   Files: `apps/web/src/features/map/MapBackground.tsx`, `apps/web/src/features/map/DeckGLOverlay.tsx`, `apps/web/src/features/map/hooks/useStudioMapTracks.ts`, `apps/web/src/features/filters/FilterList.tsx`
   Change: `MapBackground.tsx:43` and `DeckGLOverlay.tsx:86` `const match = useMatch('/sessions/:id');` become `const sessionMatch = useRouteMatch('sessionDetail');` with `match?.params.id` -> `sessionMatch?.id`. `useStudioMapTracks.ts:33-36`: `useMatch('/studio/:id')` -> `useRouteMatch('studioDetail')` (`detailMatch?.params.id` -> `detailMatch?.id`), `useMatch('/labs')` -> `useRouteMatch('labs')`, `useSearchParams()` + `searchParams.get('tab')` -> `useRouterParam('tab') ?? null`. `FilterList.tsx:25,35` `const location = useLocation();` and `location.pathname === '/'` become `const currentPage = useCurrentPage();` and `currentPage === 'dashboard'`.
   Check: `rg -n "from 'react-router-dom'" apps/web/src --glob '!**/routing/**'` prints only the five link modules item 7 converts (`pages/LabsPage.tsx`, `features/records/SportRecordsCard.tsx`, `features/sessions/session/MoreStatsRow.tsx`, `features/sessions/session/LapsControl.tsx`, `components/layout/DockItems.tsx`); `vp test -- --run tests/features/map` (from `apps/web/`) and `vp run e2e` pass.

7. Replace the framework links with `PageLink`.
   Files: new `apps/web/src/routing/PageLink.tsx`; `apps/web/src/pages/LabsPage.tsx`, `apps/web/src/features/records/SportRecordsCard.tsx`, `apps/web/src/features/sessions/session/MoreStatsRow.tsx`, `apps/web/src/features/sessions/session/LapsControl.tsx`, `apps/web/src/components/layout/DockItems.tsx`; `apps/web/e2e/labs.spec.ts`, `apps/web/e2e/sessions.spec.ts`
   Change: `PageLink.tsx` is a native anchor whose `href` comes from the registry and whose plain left click makes the explicit routing call; modified or non-primary clicks keep the browser's own behaviour (new tab, new window):

   ```tsx
   import type { FC, MouseEvent, ReactNode } from 'react';
   import { pageUrl, type PageTarget } from './pageRegistry.ts';
   import { usePageRouting } from './usePageRouting.ts';

   interface PageLinkProps {
     to: PageTarget;
     className?: string;
     onClick?: () => void;
     'aria-label'?: string;
     'aria-current'?: 'page';
     children: ReactNode;
   }

   const opensElsewhere = (event: MouseEvent<HTMLAnchorElement>): boolean =>
     event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

   export const PageLink: FC<PageLinkProps> = (props) => {
     const pageRouting = usePageRouting();
     const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
       props.onClick?.();
       if (opensElsewhere(event)) return;
       event.preventDefault();
       pageRouting.open(props.to);
     };
     return (
       <a
         href={pageUrl(props.to)}
         className={props.className}
         onClick={handleClick}
         aria-label={props['aria-label']}
         aria-current={props['aria-current']}
       >
         {props.children}
       </a>
     );
   };
   ```

   Call sites (drop each `react-router-dom` import):
   - `LabsPage.tsx:65-68` `<Link to="/settings">…</Link>` inside `Button asChild` -> `<PageLink to={{ page: 'settings', params: {} }}>…</PageLink>`.
   - `SportRecordsCard.tsx:79-85` `<Link key=… to={`/sessions/${pb.sessionId}`} className="block">` -> `<PageLink key=… to={{ page: 'sessionDetail', params: { sessionId: pb.sessionId } }} className="block">`.
   - `MoreStatsRow.tsx:106-108` and `LapsControl.tsx:248-253` `<Link to="/settings" className=…>` -> `<PageLink to={{ page: 'settings', params: {} }} className=…>` (classes unchanged).
   - `DockItems.tsx`: `tabs` (`:25-30`) carries `page: SupportedPage` (`'dashboard'`, `'sessions'`, `'labs'`, `'settings'`) instead of `to`; `isTabActive` (`:32-37`) and `useLocation` (`:72`) are replaced by a page map and `useCurrentPage()`:

   ```ts
   const TAB_BY_PAGE = {
     dashboard: 'dashboard',
     sessions: 'sessions',
     sessionDetail: 'sessions',
     tripDetail: 'sessions',
     studioDetail: 'labs',
     labs: 'labs',
     settings: 'settings',
   } satisfies Record<SupportedPage, SupportedPage>;
   ```

   `const currentPage = useCurrentPage();` and `activeIndex = tabs.findIndex((tab) => currentPage !== null && TAB_BY_PAGE[currentPage] === tab.page)`. The `NavLink` (`:94-101`) becomes `<PageLink to={{ page: tab.page, params: {} }} onClick={props.onTabClick} aria-label={tab.label()} aria-current={index === activeIndex ? 'page' : undefined}>`; `key={tab.page}`. The dock keeps its own active styling through `activeIndex` (`:87-92`), so dropping NavLink's `active` class changes no pixel.
   Behaviour change (owner-accepted): a click on a link whose target is the current location now pushes a second history entry where `Link` replaced it, and `aria-current` is set by the page map instead of NavLink's `end` matching (a `/trips/:id` or `/studio/:id` page now marks its parent tab as current, which NavLink did not).
   Check: `rg -n "\b(Link|NavLink)\b" apps/web/src | rg "react-router"` and `rg -n "from 'react-router-dom'" apps/web/src --glob '!**/routing/**'` print nothing; `vp check` passes. New behaviour pinned in e2e: extend the "go to settings" test in `apps/web/e2e/labs.spec.ts:67` to assert `page.goBack()` lands on `/labs`, and the first sessions test in `apps/web/e2e/sessions.spec.ts:13` to assert the dock link named `/sessions/i` has `aria-current="page"` after the click; `vp run e2e` passes. Before/after screenshots of the dock, labs, records card and session detail at desktop and 390 px with `vp run workbench:capture` show no pixel change.

8. Rewrite the routing row of the app tech-stack table.
   Files: `apps/web/CLAUDE.md`
   Change: replace the table row at `apps/web/CLAUDE.md:14` (starts with `| Routing`) with:

   ```markdown
   | Routing       | React Router v7, imported only in `src/routing/`. Destinations are named pages in `src/routing/pageRegistry.ts`; navigate with `usePageRouting().open({ page, params })`, read URL state with `useRouterParam`, write it with `useRouterQuery`. Rules: `docs/conventions/tdr/navigation-through-router-hooks.md` |
   ```

   (`vp fmt` realigns the table.)
   Check: `rg -n "<BrowserRouter>" apps/web/CLAUDE.md` prints nothing; the row reads as above.

## Open items

- `useRouterQuery().push` replaces the whole query, exactly like today's `setSearchParams({ tab })` calls, so an unrelated query key (only ever hand-typed; no app-generated URL has one) is dropped on a tab switch. Making `push` keep unrelated keys is a behaviour change and not part of this plan (follow-up: backlog item conventions-follow-ups).
- `apps/web/tests/features/map/hooks/useMapTracks.integration.test.ts` keeps importing `MemoryRouter`, `useNavigate` and `useLocation` from `react-router-dom`: tests are outside R7's scope and need a router to mount the hooks.
- R8 is enforced by review and the item 7 `rg` check until the tooling plan arms `no-restricted-imports` for `Link`/`NavLink`.
- R9 has no subject today: no restricted-import lint rule exists yet, so there are no suppression comments to place.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
