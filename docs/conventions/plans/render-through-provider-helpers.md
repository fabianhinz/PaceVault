---
id: render-through-provider-helpers
tdr_reference: tdr/render-through-provider-helpers.md
depends_on: [mirrored-spec-layout]
generated: 2026-10-23
---

# Render through provider helpers, never bare testing-library render

Read `tdr/render-through-provider-helpers.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`mirrored-spec-layout`](mirrored-spec-layout.md) — adds the `@testUtils` alias (and `tsconfig.test.json` path) that every item here imports through, and renames the hook specs below from `.integration.test.ts` to `.integration.spec.ts`; the spec paths below are the post-rename paths.

## Changes

1. Extract the production query-client factory out of the boot code.
   Files: `apps/web/src/lib/queryClient.ts` (new), `apps/web/src/main.tsx:4,37`
   Change: New module exporting `export const createQueryClient = (config: QueryClientConfig = {}): QueryClient => new QueryClient(config);` (`QueryClient` and `type QueryClientConfig` from `@tanstack/react-query`). In `main.tsx` replace `const queryClient = new QueryClient();` (line 37) with `const queryClient = createQueryClient();`, import it from `./lib/queryClient.ts`, and drop `QueryClient` from the `@tanstack/react-query` import on line 4 (keep `QueryClientProvider`).
   Check: `rg -n "new QueryClient\(" apps/web/src` prints only `apps/web/src/lib/queryClient.ts`; `vp check` from the root is clean; `vp build` succeeds.

2. Add the test query-client factory and the provider wrapper factory.
   Files: `apps/web/tests/testUtils/queryClient.ts` (new), `apps/web/tests/testUtils/testProviders.tsx` (new)
   Change: `queryClient.ts` exports `createTestQueryClient = (): QueryClient => createQueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })` built on `@/lib/queryClient.ts`. `testProviders.tsx` exports `interface ProviderOptions { queryClient?: QueryClient; initialPath?: string }` and `createTestProviders = (options: ProviderOptions = {}): FC<PropsWithChildren>`, which takes `options.queryClient ?? createTestQueryClient()` once per call (one client per mount) and returns a component rendering `QueryClientProvider client={queryClient}` around `MemoryRouter initialEntries={[options.initialPath ?? '/']}` around `props.children` — the test counterpart of the stack in `apps/web/src/main.tsx:43-47` (`ErrorBoundary`, `ToastHost` and the devtools are not providers and stay out). Exact code: §5 of the TDR reference.
   Check: `vp check` from the root is clean (no `react/only-export-components` error: the module exports a factory and a type, no component).

3. Add the render helpers.
   Files: `apps/web/tests/testUtils/render.ts` (new)
   Change: Export `renderWithProviders = (ui: ReactElement, options: ProviderOptions = {}): RenderResult => render(ui, { wrapper: createTestProviders(options) })` and `renderHookWithProviders = <Result, Props>(hook: (initialProps: Props) => Result, options: ProviderOptions & { initialProps?: Props } = {}): RenderHookResult<Result, Props> => renderHook(hook, { wrapper: createTestProviders(options), initialProps: options.initialProps })`. Passing the stack as testing-library's `wrapper` option is what keeps `rerender` inside the same stack (R9). This is the only module under `apps/web/tests/` that imports `render`/`renderHook` from `@testing-library/react`.
   Check: `vp check` from the root is clean.

4. Add the viewport/pointer media-query stub driven by the kit's breakpoint token.
   Files: `apps/web/tests/testUtils/matchMedia.ts` (new)
   Change: Export `DESKTOP_MIN_WIDTH`, parsed from `DESKTOP_MEDIA_QUERY` (`packages/ui/src/hooks/useDevice.ts:3`, `'(min-width: 1024px)'`) with `/min-width:\s*(\d+)px/`, and `createMatchMedia = (width: number, options: { pointerFine?: boolean } = {}): Window['matchMedia']`, whose returned function answers `matches` for `(min-width: Npx)` by comparing against `width`, answers `FINE_POINTER_QUERY` (`packages/ui/src/hooks/useDevice.ts:5`) with `options.pointerFine ?? false`, and returns a complete `MediaQueryList` (no-op listener methods, `dispatchEvent` returning `false`). Exact code: §5 of the TDR reference.
   Check: `vp check` from the root is clean.

5. Mount the router-dependent hook spec through the helper.
   Files: `apps/web/tests/features/map/hooks/useMapTracks.integration.spec.ts:2-4,25-44`
   Change: Delete the local `wrapper` (`createElement(MemoryRouter, { initialEntries: [initialPath] }, props.children)`) and the `createElement`/`ReactNode`/`MemoryRouter`/`renderHook` imports; `renderMapAt` calls `renderHookWithProviders(() => { … return navigate; }, { initialPath })` from `@testUtils/render.ts`. `useLocation`/`useNavigate` keep coming from `react-router-dom`; `act` keeps coming from `@testing-library/react` (R4).
   Check: `vp test -- --run tests/features/map/hooks/useMapTracks.integration.spec.ts` from `apps/web/` passes with the same test count as before.

6. Mount the remaining hook specs through the helper and the media-query stub.
   Files: `apps/web/tests/lib/hooks/useChartZoom.integration.spec.ts:3,31-155`, `apps/web/tests/lib/hooks/useMapHover.integration.spec.ts:2,6-20,25,40,56,75`, `apps/web/tests/features/map/hooks/useGpsBackfill.integration.spec.ts:2,42`
   Change: Every `renderHook(…)` becomes `renderHookWithProviders(…)`, and its result is bound whole (`const hook = renderHookWithProviders(…)`, read as `hook.result.current`, `hook.rerender(…)`, `hook.unmount()`) instead of `const { result } = …` / `const { unmount } = …` — if the hook-results plan has already rebound these sites, keep its names. The `useChartZoom` call that passes `{ initialProps: … }` keeps it as the helper's `initialProps` option and keeps calling the returned `rerender` through the bound result. In `useMapHover`, delete `stubMatchMedia` (the `vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches, … }))` stand-in) and the `vi.unstubAllGlobals()` in its `beforeEach`; each test assigns `window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true })` (or `{ pointerFine: false }` where it called `stubMatchMedia(false)`) before mounting. Import only `act` from `@testing-library/react`.
   Check: `rg -n "import \{[^}]*\b(render|renderHook)\b[^}]*\} from '@testing-library/react'" apps/web/tests --glob '!testUtils/**'` prints nothing; `rg -n "window\.matchMedia\s*=\s*(?!createMatchMedia)|stubGlobal\('matchMedia'" --pcre2 apps/web/tests --glob '!testUtils/**'` prints nothing; `rg -n "const \{[^}]*\} = renderHook" apps/web/tests` prints nothing; `vp test -- --run` from `apps/web/` passes with the same test count as before this item.

7. Lift the render-test ban from the testing strategy.
   Files: `apps/web/tests/CLAUDE.md:11`
   Change: Replace `React components (no render tests)` in the Skip bullet with `components without behaviour of their own`, and append one bullet after line 11: `- **Rendering**: Component and hook specs mount through \`renderWithProviders\` / \`renderHookWithProviders\` (\`@testUtils/render.ts\`), never testing-library's bare \`render\`/\`renderHook\`, and bind the result whole (\`const view = renderWithProviders(…)\`, \`const hook = renderHookWithProviders(…)\`); pass \`createTestQueryClient()\` (\`@testUtils/queryClient.ts\`) only to seed or inspect the cache; stub viewport and pointer queries with \`window.matchMedia = createMatchMedia(width)\` (\`@testUtils/matchMedia.ts\`).`
   Check: `rg -n "no render tests" apps/web/tests/CLAUDE.md` prints nothing; a human reads the new Rendering bullet.

## Open items

- R3 (choosing a selected-entity variant of the helpers) is moot: `apps/web` has no tenant or selected-entity context, so there is one helper pair.
- `packages/ui/src/theme.css` defines no breakpoint token today; the kit's only breakpoint value is `DESKTOP_MEDIA_QUERY` in `packages/ui/src/hooks/useDevice.ts:3`, so item 4 derives `DESKTOP_MIN_WIDTH` from it. If the later `packages/ui` run adds a `--breakpoint-*` token in `theme.css`, `matchMedia.ts` switches to it.
- `apps/web/tests/features/records/hooks/usePersonalBests.spec.ts:19` constructs `new QueryClient()`; the collaborators plan replaces that client with a `mock<QueryClient>()` substitute, so this plan leaves it alone. Specs that pass `new QueryClient()` into non-React functions without mounting anything (`createIngestBatcher`, `runIntervalsSync`, `runIntervalsImport` integration specs) are outside R5, which governs mounts.
- No component (`.spec.tsx`) spec exists yet; R1 and R8 bind the first one written.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
