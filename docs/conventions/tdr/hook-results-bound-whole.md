---
kind: pattern-apply-tdr-reference
id: hook-results-bound-whole
title: Bind a hook's result whole and read through the name
summary: A hook call's result is bound to one const named for what it returns and read through that name; no destructuring, no renamed members, no stand-in names like query or result.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "apps/web/tests/**/*.ts"
  - "apps/web/tests/**/*.tsx"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/ui/tests/**/*.ts"
  - "packages/ui/tests/**/*.tsx"
adopted_rules: [R1, R2, R3, R4]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Bind a hook's result whole and read through the name

## 1. Context

This file carries rules R1–R4.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant.

This is a call-site record. Whatever shape a hook returns, the caller binds that value to one named `const` and reads its members through that name — `const sessionWeather = useSessionWeather(...)` and then `sessionWeather.data`. A reader three screens below the binding still knows where `sessionWeather.isLoading` came from. A destructured binding throws that provenance away at exactly the moment it is cheapest to keep, and once two hooks are in scope their loose members collide and get renamed to survive. The root `CLAUDE.md` code rules already forbid destructuring hook return values; this record adds the naming discipline. There are no exemptions: not for third-party hooks, not for tests.

Scope: call sites under `apps/web/src` and `apps/web/tests`. In a spec the same holds for what `renderHook` and the render helpers return: `const hook = renderHook(...)` read as `hook.result.current`, `const view = renderWithProviders(...)` read as `view.getByRole(...)`. What a hook *returns* is `hooks-return-the-fitting-shape`. Positional pairs (`const [open, setOpen] = useState(false)`) are tuples the caller names itself, not objects, and are untouched.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Bind a hook call's return value to a single named `const` and read its members through that name. Do not destructure an object result in the binding. In tests this includes the result of `renderHook` (`const hook = renderHook(...)`, `hook.result.current`, `hook.rerender(...)`) and of a render helper (`const view = renderWithProviders(...)`). | manual |
| R2 | Name the const for the thing returned, not for the hook that produced it and never with a stand-in: `personalBests`, `sessionWeather`, `hoveredX`, `prediction` — not `query`, `data`, `result`, `value`, `res` or `x`. | manual |
| R3 | Never rename a member on the way out of a binding. Two results that would collide are disambiguated by their two const names. | manual |
| R4 | Where a call site needs exactly one member exactly once, reading it directly off the call — `useDevice().pointerFine`, `useOnboardingPreviewRoutes().data?.bounds` — is an accepted alternative to a named const. Anything read twice, or read far from its binding, gets the named const. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "\\bconst\\s*\\{[^}]*\\}\\s*(?::[^=]*)?=\\s*(?:use[A-Z][A-Za-z0-9_]*|render[A-Za-z0-9_]*)\\s*[(<]"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "apps/web/tests/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/ui/tests/**/*.ts", "packages/ui/tests/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Run multi-line (`rg -nU`); a formatter-wrapped binding is otherwise missed. Does not match a
    destructured callback parameter (`renderHook(({ data }) => …)`), which is a parameter object
    and allowed. Tuple destructuring (`const [a, b] = useX()`) is not matched and is allowed.
R2:
  type: grep
  pattern: "const (query|data|result|value|res|x) = use[A-Z]"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "apps/web/tests/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/ui/tests/**/*.ts", "packages/ui/tests/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A stopword list catches the laziest cases only; whether a name names the returned thing is a
    review judgement. Covers useMemo bindings too, which is intended.
R3:
  type: grep
  pattern: "\\bconst\\s*\\{[^}]*[A-Za-z_$][\\w$]*\\s*:\\s*[A-Za-z_$][\\w$]*[^}]*\\}\\s*=\\s*(?:use[A-Z][A-Za-z0-9_]*|render[A-Za-z0-9_]*)\\s*[(<]"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "apps/web/tests/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/ui/tests/**/*.ts", "packages/ui/tests/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Same single-line blindness as R1; run with `rg -nU`. The `a: b` shape is also how a nested
    destructure opens, which is forbidden on its own account.
R4:
  type: manual
  reason: >
    A permission bounded by a judgement — "read once, near the call". Counting reads of a member
    needs scope resolution.
  enforcedBy: null
```

No lint rule in the root `vite.config.ts` requires or forbids destructuring, so there is no live conflict and every entry is `manual` or grep-only with `enforcedBy: null`.

## 4. Trade-offs

- **Good, because** provenance survives distance. A member read fifty lines below its binding still names its source.
- **Good, because** it removes the collision that renaming exists to solve. Two query results in one scope are two const names; their `data` and `isLoading` never meet.
- **Good, because** a diff that adds a member to a hook's result touches only the hook; no call site has to widen its binding.
- **Bad, because** every read pays a prefix, and a body that reads six members off one result is visibly noisier than the destructured equivalent. Most React examples destructure, so the pressure to drift back is continuous.
- **Bad, because** it is call-site discipline with no tooling behind it, so it holds only as long as review holds it.
- **Neutral, because** it says nothing about the hook's return shape; a hook that produces one value returns it bare and the const holds a scalar.

## 5. Reference implementation

```tsx
export const SportsRecords: FC = () => {
  const personalBests = usePersonalBests();
  const groupedPBs = useMemo(
    () => groupPBsBySport(personalBests.data ?? []),
    [personalBests.data],
  );
  return (
    <PageGrid>
      {SPORTS.map((sport) => (
        <SportRecordsCard
          key={sport}
          sport={sport}
          pbs={groupedPBs[sport]}
          loading={personalBests.isPending}
        />
      ))}
    </PageGrid>
  );
};
```

R4's short form: `const pointerFine = useDevice().pointerFine;`. The anti-pattern and its fix:

```tsx
const { data: weather, isLoading: weatherLoading } = useSessionWeather(options);

const sessionWeather = useSessionWeather(options);
```

The second line is the only accepted form; reads below are `sessionWeather.data` and `sessionWeather.isLoading`. In a spec:

```ts
const hook = renderHook(() => useMapHover('session', 'session-abc'));
act(() => hook.result.current.onPointerEnter());
hook.unmount();
```

## 6. Forbidden practices

- `const { a, b } = useSomething()`, for a hook declared in this codebase or a third-party one.
- Renaming a member in a binding (`{ data: weather }`, `{ isLoading: weatherLoading }`).
- Nested destructuring (`const { a: { b } } = useSomething()`).
- A const named `query`, `data`, `result`, `value`, `res` or `x` for a hook's return.
- Destructuring a codebase-local hook "because it only returns two things". Two members is a composite with a name.
- `const { result } = renderHook(...)` or `const { getByRole } = renderWithProviders(...)` in a spec — bind the handle whole and read through it.
