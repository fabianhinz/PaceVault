---
kind: pattern-apply-tdr-reference
id: render-through-provider-helpers
title: Mount hooks through the shared provider helper, never bare renderHook
summary: A spec that mounts a hook does it through one shared helper that composes the application's provider stack and builds a fresh query client per mount.
governs:
  - "tests/**/*.integration.test.ts"
  - "tests/**/*.spec.tsx"
  - "tests/renderWithProviders.tsx"
adopted_rules: [R1, R2, R4, R5, R6, R7, R8, R9]
adopted: 2026-09-17
---

# Mount hooks through the shared provider helper, never bare renderHook

## 1. Context

This file carries R1, R2 and R4–R9.

A hook mounted outside the application's provider stack either crashes on the first context read or silently exercises something different from what production runs. One test-utility module owns the mount call, wrapping the tree in `QueryClientProvider` and `BrowserRouter` the way `src/main.tsx` composes them, so the stack is declared in one file rather than re-assembled per spec — and so a `rerender` cannot silently drop the stack partway through a test.

Scope is deliberately narrow: **hook specs**. `tests/CLAUDE.md` states that UI components get no unit tests, and that decision stands. The helper exports a component-render variant for symmetry and so that a future change of mind has one funnel, but its existence is not an invitation to start writing component render tests. Two sibling conventions that presuppose them — accessible queries into a rendered tree, and destructuring queries from a render result — were deliberately not adopted in this project.

One rule of the original is Moot: it chose between a plain helper variant and one that supplies a selected-tenant context. There is no tenant or selected-entity context here, so there is one variant.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A spec never calls the testing library's `render` directly; that import belongs only to the helper module. | proposed |
| R2 | Mount a hook through `renderHookWithProviders` whenever the hook, or any collaborator left unmocked, reads context supplied by the provider stack — a query client, the router, or anything added to the stack later. | proposed |
| R4 | Keep importing `act`, `waitFor` and `fireEvent` directly from the testing library as needed. Only `render` and `renderHook` are replaced. | manual |
| R5 | Let the helper create the query client per mount by default. Pass a client explicitly only when the spec must seed or inspect cache state, and obtain it from the module's exported factory rather than constructing one inline. | manual |
| R6 | Never import a module-level pre-built query client into a spec; a client shared across files leaks cached results between tests. | proposed |
| R7 | Override viewport-dependent media queries with the module's `createMatchMedia(width)` assigned to `window.matchMedia`, not with a hand-rolled mock, and drive it from a named constant rather than a bare pixel literal. | manual |
| R8 | A bare `render` / `renderHook` is permitted only when the subject is itself a provider or boundary under test, or when every provider it consumes is module-mocked; such a spec composes the minimum wrappers it needs explicitly. | manual |
| R9 | Preserve the helper's re-wrapping `rerender`: call `rerender` from the helper's result rather than re-invoking a render function, so the subject is re-mounted inside the same stack. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "\\brender\\b.*from '@testing-library/react'"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: ["tests/renderWithProviders.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches an import of `renderHook` too, which R2 also routes through the helper — both are
    violations outside the helper module, so the overlap is harmless.
R2:
  type: grep
  pattern: "renderHook\\("
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: ["tests/renderWithProviders.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `renderHookWithProviders(` contains the substring and matches; anchor on a word boundary or
    read the call.
R4:
  type: manual
  reason: >
    This rule permits an import rather than forbidding one; there is nothing to flag.
  enforcedBy: null
R5:
  type: grep
  pattern: "new QueryClient\\("
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: ["tests/renderWithProviders.tsx"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R6:
  type: grep
  pattern: "^const queryClient = new QueryClient"
  include: ["tests/**/*.ts", "tests/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "window\\.matchMedia = "
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    An assignment of `createMatchMedia(...)` is the correct form and matches; read the right-hand
    side.
R8:
  type: manual
  reason: >
    Whether every provider a subject consumes is module-mocked is a reading of the spec's setup.
  enforcedBy: null
R9:
  type: manual
  reason: >
    Distinguishing the helper's `rerender` from a re-invocation of a render function needs the
    binding traced.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the provider stack is declared once, so a spec cannot exercise a subject under a stack that differs from production's.
- **Good, because** a per-mount query client means a cached result cannot survive into the next spec, which is the leak that makes suites order-dependent.
- **Bad, because** the helper has to be kept in step with `src/main.tsx` by hand; nothing checks that the two provider stacks still match, and a new provider added to the app is silently absent from every spec.
- **Bad, because** it exists for two specs today, which is a lot of machinery for a small population — its value is entirely in what it prevents later.
- **Neutral, because** exporting a component-render variant that this project's testing policy forbids using is a deliberate loaded gun; the policy, not the helper, is what keeps it holstered.

## 5. Reference implementation

`tests/renderWithProviders.tsx`:

```tsx
export const createTestQueryClient = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

export const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: { client?: QueryClient },
) => {
  const client = options?.client ?? createTestQueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
  return renderHook(hook, { wrapper });
};
```

A spec:

```ts
const zoom = renderHookWithProviders(() => useChartZoom());
act(() => zoom.result.current.setRange([0, 100]));
await waitFor(() => expect(zoom.result.current.range).toEqual([0, 100]));
```

## 6. Forbidden practices

- ❌ A bare `renderHook` in a spec whose subject reads the query client or the router — it either throws or exercises a different tree than production.
- ❌ Re-assembling the provider stack inside a spec; the copy drifts from `src/main.tsx` the first time a provider is added.
- ❌ `new QueryClient()` in a spec — the client then outlives the mount and its cache reaches the next test.
- ❌ A module-level query client imported by several specs.
- ❌ A hand-rolled `window.matchMedia` stub per spec; they disagree about the shape of `MediaQueryList` and each is wrong in its own way.
- ❌ Re-invoking a render function instead of the helper's `rerender`, which re-mounts the subject outside the stack.
- ❌ Writing a component render test because the helper offers one; `tests/CLAUDE.md` forbids them and this record does not overturn that.
