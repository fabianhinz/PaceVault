---
kind: pattern-apply-tdr-reference
id: render-through-provider-helpers
title: Render through provider helpers, never bare testing-library render
summary: Specs mount components and hooks through renderWithProviders / renderHookWithProviders from @testUtils/render.ts, which compose the app's provider stack with a fresh retry-free query client per mount, and bind the result whole.
governs:
  - "apps/web/tests/**/*.spec.ts"
  - "apps/web/tests/**/*.spec.tsx"
  - "apps/web/tests/testUtils/**"
adopted_rules: [R1, R2, R4, R5, R6, R7, R8, R9]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Render through provider helpers, never bare testing-library render

## 1. Context

This file carries R1, R2, R4–R9. A component-tree spec that mounts its subject outside the app's provider stack either crashes on the first context read or silently exercises a different component than production runs. Every component and hook spec in `apps/web` therefore mounts through one shared helper module, `apps/web/tests/testUtils/render.ts`, whose wrapper (`apps/web/tests/testUtils/testProviders.tsx`) composes the stack once: `QueryClientProvider` around a `MemoryRouter`, mirroring `apps/web/src/main.tsx`. The stack is declared in one file rather than re-assembled per spec. A spec that asserts behaviour under React's double mount passes `strict: true`, and the wrapper puts the whole stack inside `StrictMode` (the app mounts in `StrictMode` too, `apps/web/src/main.tsx:41`); every other spec mounts without it. The query client comes from `createTestQueryClient` (`apps/web/tests/testUtils/queryClient.ts`), built on the app's own factory `createQueryClient` (`apps/web/src/queries/queryClient.ts`). This does not govern specs that mount nothing (plain function, store and parser specs under `apps/web/tests/`), Playwright specs (`apps/web/e2e/`), or `packages/ui`, whose kit has no provider. The result of either helper is bound whole and read through its name (`const view = renderWithProviders(…)`, `view.getByRole(…)`; `const hook = renderHookWithProviders(…)`, `hook.result.current`), never destructured.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Mount a component in a spec through `renderWithProviders` from `@testUtils/render.ts`, not through `@testing-library/react`'s `render`. | manual |
| R2 | Mount a hook in a spec through `renderHookWithProviders` from `@testUtils/render.ts` whenever the hook, or any collaborator left unmocked, reads context supplied by the provider stack (query client, router). | manual |
| R4 | Keep importing `act`, `waitFor`, `fireEvent` and `within` directly from `@testing-library/react`; only `render` and `renderHook` are replaced. | manual |
| R5 | Let a helper create the query client per mount by default. Pass `{ queryClient }` explicitly only when the spec must seed or inspect cache state, and obtain it from `createTestQueryClient()` rather than constructing a client inline in the spec. | manual |
| R6 | Never share one query client across spec files through a module-level instance; a client shared across files leaks cached results between tests. | manual |
| R7 | Override viewport- and pointer-dependent media queries with `window.matchMedia = createMatchMedia(width, options?)` from `@testUtils/matchMedia.ts`, not with a hand-rolled mock, and drive the width from the kit's breakpoint (`DESKTOP_MIN_WIDTH`, derived from `DESKTOP_MEDIA_QUERY` in `packages/ui/src/hooks/useDevice.ts`) rather than a literal pixel value. | manual |
| R8 | Bare `render` is permitted only when the subject is itself a provider or boundary under test, or when every provider it consumes is module-mocked; such a spec composes the minimum wrappers it needs explicitly. | manual |
| R9 | Preserve the helpers' re-wrapping `rerender`: call `rerender` from the helper's result rather than re-invoking a render function, so the subject is re-mounted inside the same stack. | manual |

## 3. Detection

Nothing in the root `vite.config.ts` lint block restricts imports from `@testing-library/react`, so every rule here is review-time today.

```yaml
R1:
  type: grep
  pattern: "import\\s+\\{[^}]*\\brender\\b[^}]*\\}\\s+from\\s+'@testing-library/react'"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx"]
  exempt: ["apps/web/tests/testUtils/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Matches the legitimate R8 carve-out (provider/boundary subjects, fully module-mocked trees). The helper module itself imports both names legitimately."
R2:
  type: grep
  pattern: "import\\s+\\{[^}]*\\brenderHook\\b[^}]*\\}\\s+from\\s+'@testing-library/react'"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx"]
  exempt: ["apps/web/tests/testUtils/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A hook whose every context-consuming collaborator is module-mocked needs no stack and is correctly rendered bare; the grep cannot tell those apart from genuine misses."
R4:
  type: manual
  reason: "A negative rule — the absence of a violation is the norm; nothing to match."
R5:
  type: grep
  pattern: "new\\s+QueryClient\\("
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A spec that deliberately needs non-default query options (retries on, custom cache time) has a reason to construct its own client; flags those too. Also flags integration specs that pass a client into a non-React function without mounting anything (the createIngestBatcher and runIntervals* specs), which R5 does not govern."
R6:
  type: grep
  pattern: "^export const \\w+\\s*(:\\s*QueryClient)?\\s*=\\s*(new QueryClient|createTestQueryClient)\\("
  include: ["apps/web/tests/**/*.ts", "apps/web/tests/**/*.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "window\\.matchMedia\\s*=\\s*(?!createMatchMedia)|stubGlobal\\(\\s*'matchMedia'"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "A spec asserting on matchMedia call arguments, or restoring a saved original in teardown, assigns the property legitimately."
R8:
  type: manual
  reason: "Whether a bare render is a carve-out or a violation depends on the subject's role and on which modules the spec mocks."
R9:
  type: manual
  reason: "Requires knowing that the `rerender` in use came from a helper result rather than a bare render result."
```

## 4. Trade-offs

- **Good, because** the provider stack is declared once; adding a provider to the app is a one-file change in tests instead of a sweep across every spec.
- **Good, because** the default path gives every spec a fresh, retry-disabled query client per mount, so no cache state crosses test boundaries and no spec waits on retry backoff.
- **Good, because** the helpers pass the stack as testing-library's `wrapper` option, so `rerender` re-wraps, removing a whole class of "the subject lost its context on the second render" failures.
- **Bad, because** the stack is fixed: every spec pays the mount cost of providers its subject never touches, and a component that would break outside the stack — one that reads a context it should not depend on — is never caught, because no spec renders it bare.
- **Bad, because** the hook helper is opt-in by judgement (R2), so a spec can render bare, pass because its collaborators happen to be mocked, and then break the day a mock is removed.
- **Neutral, because** the split import — mount from the helper module, interaction and assertion utilities from the testing library — means two import sources in most specs; the alternative, re-exporting the whole library from the helper module, hides which API a spec actually uses.

## 5. Reference implementation

`apps/web/src/queries/queryClient.ts`:

```ts
import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

export const createQueryClient = (config: QueryClientConfig = {}): QueryClient =>
  new QueryClient(config);
```

`apps/web/tests/testUtils/queryClient.ts`:

```ts
import type { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/queries/queryClient.ts';

export const createTestQueryClient = (): QueryClient =>
  createQueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
```

`apps/web/tests/testUtils/testProviders.tsx`:

```tsx
import { StrictMode, type FC, type PropsWithChildren } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createTestQueryClient } from '@testUtils/queryClient.ts';

export interface ProviderOptions {
  queryClient?: QueryClient;
  initialPath?: string;
  strict?: boolean;
}

export const createTestProviders = (options: ProviderOptions = {}): FC<PropsWithChildren> => {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const initialEntries = [options.initialPath ?? '/'];
  const TestProviders: FC<PropsWithChildren> = (props) => {
    const stack = (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{props.children}</MemoryRouter>
      </QueryClientProvider>
    );
    return options.strict === true ? <StrictMode>{stack}</StrictMode> : stack;
  };
  return TestProviders;
};
```

`apps/web/tests/testUtils/render.ts`:

```ts
import type { ReactElement } from 'react';
import {
  render,
  renderHook,
  type RenderHookResult,
  type RenderResult,
} from '@testing-library/react';
import { createTestProviders, type ProviderOptions } from '@testUtils/testProviders.tsx';

export const renderWithProviders = (
  ui: ReactElement,
  options: ProviderOptions = {},
): RenderResult => render(ui, { wrapper: createTestProviders(options) });

export const renderHookWithProviders = <Result, Props>(
  hook: (initialProps: Props) => Result,
  options: ProviderOptions & { initialProps?: Props } = {},
): RenderHookResult<Result, Props> =>
  renderHook(hook, { wrapper: createTestProviders(options), initialProps: options.initialProps });
```

`apps/web/tests/testUtils/matchMedia.ts`:

```ts
import { DESKTOP_MEDIA_QUERY, FINE_POINTER_QUERY } from '@pacevault/ui/hooks/useDevice.ts';

const minWidthOf = (query: string): number | undefined => {
  const match = /min-width:\s*(\d+)px/.exec(query);
  if (match?.[1] === undefined) {
    return undefined;
  }
  return Number(match[1]);
};

export const DESKTOP_MIN_WIDTH = minWidthOf(DESKTOP_MEDIA_QUERY) ?? 0;

const matchesQuery = (args: { query: string; width: number; pointerFine: boolean }): boolean => {
  if (args.query === FINE_POINTER_QUERY) {
    return args.pointerFine;
  }
  const minWidth = minWidthOf(args.query);
  if (minWidth === undefined) {
    return false;
  }
  return args.width >= minWidth;
};

export const createMatchMedia =
  (width: number, options: { pointerFine?: boolean } = {}): Window['matchMedia'] =>
  (query: string) => ({
    matches: matchesQuery({ query, width, pointerFine: options.pointerFine ?? false }),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
```

Call sites:

```ts
const hook = renderHookWithProviders(() => useMapTracks(gpsData), { initialPath: '/studio' });

window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true });
const hover = renderHookWithProviders(() => useMapHover('session', 'session-abc'));
hover.unmount();

const handOver = renderHookWithProviders(
  (props: { terrain: boolean }) => useMapRendererHandOver({ terrain: props.terrain, mapLoaded: true }),
  { initialProps: { terrain: false }, strict: true },
);
```

## 6. Forbidden practices

- ❌ Importing `render` from `@testing-library/react` in a spec whose subject is an ordinary component — it mounts a tree the app never produces, and the first context read fails or, worse, silently falls back to a default.
- ❌ Importing `renderHook` from `@testing-library/react` for a hook that reads the query client or the router without mocking those collaborators away — the hook under test is not the hook that ships.
- ❌ Re-declaring a local query-client factory inside a spec file when `@testUtils/queryClient.ts` already exports one — the local copy drifts from the shared default options, typically re-enabling retries.
- ❌ Exporting a pre-built query client from a test-utility module — one cache shared across specs makes results order-dependent.
- ❌ Hand-rolling a `window.matchMedia` stub with `vi.fn()` returning a fixed `matches` value — it ignores the query string, so the spec passes for breakpoints it never actually simulated.
- ❌ Re-assembling the provider stack inline in a spec (a local `MemoryRouter` wrapper) when the helper covers it — the stack then has two definitions and only one gets updated.
- ❌ A local `StrictMode` wrapper passed as `wrapper` to a bare `renderHook` — pass `strict: true` to the helper instead.
- ❌ Destructuring the helper's result (`const { result } = renderHookWithProviders(…)`, `const { getByRole } = renderWithProviders(…)`) — bind it whole and read through the name, as every other hook and call result in the project.
- ❌ Calling a bare render function a second time to simulate a re-render instead of the helper result's `rerender` — it mounts a second tree rather than updating the first.
