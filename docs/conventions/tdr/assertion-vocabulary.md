---
kind: pattern-apply-tdr-reference
id: assertion-vocabulary
title: Specs assert through a small, exact matcher vocabulary
summary: App specs assert interactions with their arguments, values with the matcher chosen by their shape, DOM facts with jest-dom, and never a computed predicate or a recorded snapshot.
governs:
  - "apps/web/tests/**/*.spec.ts"
  - "apps/web/tests/**/*.spec.tsx"
  - "apps/web/tests/setup.ts"
  - "apps/web/tests/types/**"
  - "packages/ui/tests/**/*.spec.ts"
  - "packages/ui/tests/**/*.spec.tsx"
  - "packages/engine/tests/**/*.spec.ts"
  - "packages/gpx/tests/**/*.spec.ts"
  - "tools/workbench/tests/**/*.ts"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Specs assert through a small, exact matcher vocabulary

## 1. Context

This file carries R1–R8. Every spec ends in an assertion, and the matcher chosen for it decides how much the spec actually proves. The vocabulary is deliberately narrow: interaction is asserted with its arguments, value equality with a matcher chosen by the shape of the value, DOM facts with the jest-dom matchers that name the fact, and nothing is asserted by recording whatever the code happened to produce. Without that discipline a suite fills up with assertions that are green by construction — a spy called with the wrong payload, a predicate reduced to `true`, a snapshot re-recorded rather than read — and the suite stops being evidence.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant; the kit has no jest-dom and no setup file (no component specs), so R6 and R8 have nothing to govern there yet. The same holds for `packages/engine` (specs in `packages/engine/tests`, node environment): R1–R5 and R7 bind its specs, R6 and R8 have no subject.

The same holds for `packages/gpx` (specs in `packages/gpx/tests`, jsdom without jest-dom): R6 and R8 have nothing to govern there. R7 has one exception: `packages/gpx/tests/buildGpx.spec.ts` keeps its file snapshot `packages/gpx/tests/__snapshots__/buildGpx.spec.ts.snap`, the golden GPX file other applications read (`packages/gpx/CLAUDE.md`, Tests).

Scope: the vitest project of `apps/web` (`apps/web/tests/`) and its setup file `apps/web/tests/setup.ts`. Test APIs, `expect` included, are imported from `vite-plus/test`, which re-exports `vitest`. Out of scope: the Playwright specs in `apps/web/e2e/`, which use Playwright's own auto-retrying `expect`. How elements are found before being asserted on is `accessible-queries-in-component-tests`; how collaborators become assertable substitutes is `collaborators-replaced-with-mocks`. The one documented exception to "no snapshots" is file-format output in `packages/gpx` (`packages/gpx/CLAUDE.md` § Rules, Tests), outside `apps/web`. Nothing in the root `vite.config.ts` lint block checks assertions, so a test that asserts nothing passes silently; these rules are the only guard.

R5 binds the specs of `tools/workbench` (`tools/workbench/tests/`) as well.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Assert an interaction with its arguments: `expect(spy).toHaveBeenCalledWith(...)`. Bare `expect(spy).toHaveBeenCalled()` is reserved for a call whose arguments the spec does not determine — a zero-argument callback, a refetch, a close. If the spec set up an input, the assertion names it. | manual |
| R2 | Assert that something did *not* happen with `expect(spy).not.toHaveBeenCalled()`. Do not express absence as a count. | manual |
| R3 | Use `toBe` for primitives, identity, and `null`/`undefined`, and `toEqual` for objects and arrays. `toBe` is never applied to a structure literal. | manual |
| R4 | Assert a boolean exactly: `toBe(true)` / `toBe(false)`. `toBeTruthy` / `toBeFalsy` pass on any truthy value and hide the difference between `true`, a non-empty string and an object. | manual |
| R5 | Never assert a computed predicate. Assert the underlying value with the matcher that names the claim — `toContain` / `toContainEqual` over a membership check, `toHaveLength` over a length comparison, `toThrow` / `rejects` over a caught-error flag, `expect(xs.filter(p)).toEqual([])` over `every`/`some`. A predicate collapses the diff to `false`, so the failure message says nothing. | manual |
| R6 | Assert DOM presence with `toBeInTheDocument()` and its negation. Use `toBeVisible()` only where visibility rather than presence is the claim. Assert element state with the matcher that names it (`toBeDisabled`, `toHaveValue`, `toHaveAttribute`, `toBeChecked`) rather than reading a property off the node and comparing it. The matchers come from `@testing-library/jest-dom`, registered in `apps/web/tests/setup.ts`. | manual |
| R7 | Do not write file-based snapshots. `toMatchInlineSnapshot` is permitted only where the assertion *is* the full literal text and that text is short enough to read in the diff — a thrown error's message, a generated file's contents, an empty render. Exception: the GPX golden file `packages/gpx/tests/__snapshots__/buildGpx.spec.ts.snap` written by `packages/gpx/tests/buildGpx.spec.ts`. | manual |
| R8 | Extend the matcher vocabulary rather than writing an assertion helper that wraps `expect`. A new matcher is registered with `expect.extend` in `apps/web/tests/setup.ts` and declared in `apps/web/tests/types/`, so it composes with `.not`, produces a real failure message, and is reachable from every spec. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "expect\\([^)]*\\)\\.toHaveBeenCalled\\(\\)"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx", "packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Heavy — this produces candidates, not violations. The bare form is correct for a call that takes
    no arguments. Deciding requires the callee's signature, which is not in the spec file. It also
    misses the inverse and more serious failure: a `toHaveBeenCalledWith` whose expected argument
    was copied from the observed output.
R2:
  type: grep
  pattern: "\\.toHaveBeenCalledTimes\\(\\s*0\\s*\\)"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx", "packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: none known
R3:
  type: grep
  pattern: "\\.toBe\\(\\s*[\\{\\[]"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx", "packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A match is reliable. Does not catch the reverse — `toEqual` applied to a primitive — which is
    looser than necessary but not a violation here.
R4:
  type: grep
  pattern: "\\.(not\\.)?toBe(Truthy|Falsy)\\(\\)"
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx", "packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Legitimate where the subject's type is genuinely `unknown` or a union whose only checkable
    property is truthiness.
R5:
  type: grep
  pattern: "expect\\([^;]*\\.(includes|some|every|indexOf|startsWith|endsWith)\\([^;]*\\)\\s*\\)?\\s*\\.(not\\.)?toBe(Truthy|Falsy|\\(\\s*(true|false)\\s*\\))|expect\\([^)]*\\.length\\)\\.(toBe|toEqual)\\("
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx", "packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts", "tools/workbench/tests/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Misses predicates expressed as a named local computed on an earlier line. Also flags a case
    where the predicate itself is the unit under test, in which case asserting its boolean result
    is correct.
R6:
  type: grep
  pattern: "expect\\([^)]*\\.(textContent|innerHTML|value|checked|disabled|className)\\s*\\)\\s*\\.(not\\.)?to(Be|Equal)\\("
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx", "packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Reading `.value` off a non-DOM object (a hook result, a ref) matches and is fine. Does not catch
    `toBeVisible` used where presence was meant.
R7:
  type: grep
  pattern: "\\.toMatchSnapshot\\(|\\.toMatchFileSnapshot\\("
  include: ["apps/web/tests/**/*.spec.ts", "apps/web/tests/**/*.spec.tsx", "packages/ui/tests/**/*.spec.ts", "packages/ui/tests/**/*.spec.tsx", "packages/engine/tests/**/*.spec.ts", "packages/gpx/tests/**/*.spec.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    none known for the file-based form. Deliberately does not flag `toMatchInlineSnapshot`. A
    companion glob over `apps/web/tests/**/__snapshots__/**` and `apps/web/tests/**/*.snap` catches
    committed snapshot files.
R8:
  type: grep
  pattern: "expect\\.extend\\("
  include: ["apps/web/tests/**/*.ts", "apps/web/tests/**/*.tsx", "packages/ui/tests/**/*.ts", "packages/ui/tests/**/*.tsx"]
  exempt: ["apps/web/tests/setup.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Catches only misplaced registration, not an assertion helper function that wraps `expect`
    instead of becoming a matcher.
```

## 4. Trade-offs

- **Good, because** a failure message names the discrepancy. `toHaveBeenCalledWith` prints the expected and received payloads, `toEqual` prints a structural diff, `expect(xs.filter(p)).toEqual([])` prints the offending rows, and `toBeInTheDocument` prints the element — where `toBe(true)` prints only `false`.
- **Good, because** an exact assertion fails when behaviour changes. A weak one survives the change it was written to catch, so the suite keeps passing while the contract moves underneath it.
- **Good, because** a narrow vocabulary is readable across every spec: a reviewer learns a dozen matchers once and can then read any spec without decoding a local idiom.
- **Bad, because** exactness makes specs brittle in the wrong places. `toHaveBeenCalledWith` on a wide options object fails whenever an unrelated field is added, and the cheap fix — pasting the received value back in — produces an assertion nobody read.
- **Bad, because** banning recorded snapshots means large generated artefacts have to be asserted field by field, which is more code and can miss what a whole-output comparison would have caught.
- **Neutral, because** none of this is enforced by tooling today.

## 5. Reference implementation

Interaction with its arguments; absence as a negated call; structure with `toEqual`:

```ts
import { describe, expect, it } from 'vite-plus/test';

it('invalidates when the deleted session holds a PB', () => {
  invalidatePersonalBestsOfSession(queryClient, 'a');

  expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
    queryKey: PERSONAL_BESTS_KEY,
    refetchType: 'all',
  });
});

it('skips when the deleted session holds no PB', () => {
  invalidatePersonalBestsOfSession(queryClient, 'b');

  expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
});
```

Values instead of predicates:

```ts
expect(out.filter((r) => r.power === null)).toEqual([]);
expect(warnings).toContainEqual(expect.objectContaining({ code: 'power_above_max' }));
expect(urls).not.toContainEqual(expect.stringContaining('/activity/i100/'));
expect(result.analysis).toHaveLength(3);
```

DOM presence and state, queried through the bound render result (`const view = renderWithProviders(…)`):

```ts
expect(view.getByRole('button', { name: 'Save' })).toBeDisabled();
expect(view.queryByRole('alert')).not.toBeInTheDocument();
```

Matcher registration, once in `apps/web/tests/setup.ts`, and its ambient declaration (`apps/web/tests/types/jestDom.d.ts`):

```ts
import '@testing-library/jest-dom/vitest';
```

## 6. Forbidden practices

- ❌ `expect(spy).toHaveBeenCalled()` on a call whose arguments the test arranged — it passes when the subject forwards the wrong payload, which is the defect the test existed to catch.
- ❌ `expect(spy).toHaveBeenCalledTimes(0)` for absence. `.not.toHaveBeenCalled()` reads as the claim and produces a better message.
- ❌ `toBeTruthy()` / `toBeFalsy()` on a value whose type is known. They pass on `'false'`, on `{}` and on `0.1`, and their failure output is a bare boolean.
- ❌ `expect(list.includes(x)).toBe(true)`, `expect(rows.every(p)).toBe(true)` and every variant that asserts a predicate instead of a value — use `toContain`, `toContainEqual` or `filter` against `[]`. Same for `expect(xs.length).toBe(n)` where `toHaveLength(n)` says it.
- ❌ `toBe` against an object or array literal — it compares references, so it either always fails or passes for a reason unrelated to the values.
- ❌ Reading a DOM property and comparing it (`expect(input.value).toBe('x')`, `expect(el.textContent).toContain(...)`) where a jest-dom matcher exists.
- ❌ `toMatchSnapshot()` and committed `.snap` files. An external snapshot is reviewed once, at creation, and thereafter regenerated on failure rather than read.
- ❌ An inline snapshot of a rendered component tree of any substance. Nobody reviews a forty-line HTML literal in a diff.
- ❌ A hand-written `assertThing(actual, expected)` helper wrapping `expect` where a custom matcher would do — it cannot be negated with `.not` and its failure message is the wrapper's, not the claim's.
- ❌ Registering a matcher with `expect.extend` inside a spec. It exists only in that file, while its declaration in `apps/web/tests/types/` promises it to every spec; the next spec that uses it type-checks and then fails at runtime.
