---
kind: pattern-apply-tdr-reference
id: accessible-queries-in-component-tests
title: Accessible queries in component specs
summary: Component specs find elements by role, text or label through the render-helper result bound whole, wait with waitFor, scope with within, and reach for test ids or selectors only where no accessible identity exists.
governs:
  - "apps/web/tests/**/*.spec.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Accessible queries in component specs

## 1. Context

This file carries R1–R6. A component spec reaches into the rendered tree the way a user perceives it: by accessible role, by visible text, by label. Bound that way, a spec survives a refactor of the markup and fails when the thing a user relies on disappears — and an element that cannot be queried is a component a screen reader cannot navigate, so the accessibility gap shows up as test friction at the moment it is introduced. Bound to test ids or CSS selectors instead, the spec passes while the interface rots. This governs component specs under `apps/web/tests/` mounted through `renderWithProviders` (`@testUtils/render.ts`); Playwright specs in `apps/web/e2e/` and specs that mount nothing are out of scope. The render result is bound whole and queried through its name, in line with the no-destructuring rule at `CLAUDE.md:28`.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Locate elements with `getByRole`, `getByText` or `getByLabelText` (and their `queryBy` / `getAllBy` variants). A role query carries an accessible `name` option rather than a positional index. | manual |
| R2 | Use `*ByTestId` only where the element has no accessible identity to query — a spinner or animation, a purely presentational wrapper asserted for visibility, a host element such as an `iframe` — or where the spec itself renders the id, as a stub returned from `vi.mock` standing in for a child component. Never to reach a button, link, input, heading or any element that already carries a role. | manual |
| R3 | Do not locate elements with `container.querySelector` / `baseElement.querySelector`. The only admissible use is asserting on a computed style, class or structural property of a node that has no accessible surface at all, and even then the node is reached by an accessible query first where one exists. | manual |
| R4 | Await asynchronous appearance with `await waitFor(() => expect(...))`, not with `findBy*`. The same construct covers assertions that are not element lookups (a mutation call, a navigation), so one waiting idiom serves the whole file. | manual |
| R5 | Bind the render helper's return value whole (`const view = renderWithProviders(…)`) and call the queries through it (`view.getByRole(…)`). Never destructure the queries out of it, and do not import and use the global `screen`, which silently widens every query to the whole document and defeats `within` scoping. | manual |
| R6 | Scope a query to a subtree with `within(node)` rather than by making the query string more specific. | manual |

## 3. Detection

```yaml
R1:
  type: manual
  reason: "Presence of accessible queries is not a violation signal; the violation is a missing one, which only reading the spec against its component reveals."
R2:
  type: grep
  pattern: "(get|query|getAll|queryAll)ByTestId\\("
  include: ["apps/web/tests/**/*.spec.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Flags every sanctioned use — a mock stub's own id, a spinner, an iframe host, a presentational wrapper under a visibility assertion. Each hit needs the queried element read before it is called a violation; the grep narrows the reading list, it does not decide."
R3:
  type: grep
  pattern: "(container|baseElement)\\.querySelector"
  include: ["apps/web/tests/**/*.spec.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Flags admissible style- and structure-only assertions on nodes with no accessible surface. Misses `.closest()`, `document.querySelector`, and a selector held in a variable before use."
R4:
  type: grep
  pattern: "await\\s+(\\w+\\.)?find(All)?By[A-Za-z]+\\("
  include: ["apps/web/tests/**/*.spec.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Misses a `findBy*` whose promise is stored or passed to an assertion helper instead of awaited inline. Does not flag the inverse mistake of a bare `getBy*` that should have been wrapped in `waitFor`."
R5:
  type: grep
  pattern: "\\bscreen\\.[a-zA-Z]+By|const\\s*\\{[^}]*\\}\\s*=\\s*renderWithProviders\\("
  include: ["apps/web/tests/**/*.spec.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Would flag a local variable named `screen` (a viewport fixture), and misses `screen` aliased on import and a destructuring split across lines."
R6:
  type: manual
  reason: "Absence of `within` is only wrong where a query is ambiguous across subtrees; that requires the rendered tree, not a pattern."
```

## 4. Trade-offs

- **Good, because** the spec breaks when the user-facing contract breaks and not before, so a markup refactor costs nothing and a removed label costs a red test.
- **Good, because** every query doubles as an accessibility assertion — writing one forces the component to expose a role and a name, and the friction of a missing one lands on the author rather than on a user.
- **Good, because** one waiting idiom (`waitFor`) covers element appearance and non-element assertions alike, so a reader never has to decide which of two async forms a given line uses.
- **Bad, because** role queries traverse and compute the accessibility tree, so they are measurably slower than an id lookup and their failure output dumps the rendered DOM instead of naming the missing id — a diagnosis cost paid on every red run.
- **Bad, because** a query keyed on semantics breaks when a designer changes an element's type or label while its behaviour is unchanged, producing failures that carry no information.
- **Bad, because** `waitFor` over `findBy*` retries the whole assertion block, so a genuinely failing expectation burns the full timeout before reporting.
- **Neutral, because** the rules are unenforced: no testing-library lint plugin is configured in the root `vite.config.ts`, so the greps in section 3 are the only signal.

## 5. Reference implementation

```tsx
import { describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@testUtils/render.ts';
import { Subject } from '@/components/subject/Subject.tsx';
import type { ChildProps } from '@/components/subject/Child.tsx';

vi.mock('@/components/subject/Child.tsx', () => ({
  Child: (props: ChildProps) => <div data-testid={`child-${props.id}`} />,
}));

describe(Subject.name, () => {
  it('saves the edited resting heart rate', async () => {
    const onSave = vi.fn();
    const view = renderWithProviders(<Subject onSave={onSave} />);

    fireEvent.click(view.getByLabelText('Edit resting heart rate'));
    fireEvent.change(view.getByRole('spinbutton', { name: 'Resting heart rate' }), {
      target: { value: '48' },
    });
    fireEvent.click(view.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ restHr: 48 });
    });

    expect(view.getByText('Saved')).toBeInTheDocument();
  });

  it('renders one tile per threshold', () => {
    const view = renderWithProviders(<Subject onSave={vi.fn()} />);

    const group = view.getByTestId('child-a');

    expect(within(group).queryByRole('heading')).not.toBeInTheDocument();
  });
});
```

`Subject` and `Child` stand for the component under test and a child it renders; a real spec uses its subject's actual path, props and copy.

## 6. Forbidden practices

- ❌ `getByTestId('save-button')` against a real `<button>` — the element already has a role and a name; the id is a second, private contract that nothing else checks.
- ❌ Adding a `data-testid` to app markup to make a spec pass, where a label, `aria-label` or visible text would have made the element queryable and accessible at once.
- ❌ `container.querySelector('[class*=rounded-xl]')` to locate an element — it couples the spec to Tailwind class names, which change with a styling refactor that changes nothing a user sees.
- ❌ `await findByRole(...)` — the minority async form; use `await waitFor(() => expect(getByRole(...)).toBeInTheDocument())` so one idiom covers the file.
- ❌ `const { getByRole } = renderWithProviders(…)` — destructuring the result; bind it whole as `view` and call `view.getByRole(…)`.
- ❌ `screen.getByRole(...)` — queries the whole document rather than the render result, so it silently escapes `within` scoping and picks up nodes from a Radix portal or a previous render.
- ❌ `getAllByRole('button')[2]` — a positional index re-couples the spec to layout order; pass an accessible `name` instead.
