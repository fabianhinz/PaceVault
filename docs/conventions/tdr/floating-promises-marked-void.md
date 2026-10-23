---
kind: pattern-apply-tdr-reference
id: floating-promises-marked-void
title: Deliberate fire-and-forget promises are prefixed with void
summary: A promise deliberately not awaited is marked with the void operator (async callbacks are wrapped as () => void fn()), and a call whose rejection matters is awaited instead.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
  - "apps/web/tests/**/*.ts"
  - "packages/ui/src/**/*.ts"
  - "packages/ui/src/**/*.tsx"
  - "packages/ui/tests/**/*.ts"
  - "tools/workbench/scripts/**/*.ts"
  - "tools/workbench/site/src/**/*.ts"
  - "tools/workbench/site/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Deliberate fire-and-forget promises are prefixed with void

## 1. Context

This file carries R1, R2, R3 and R4.

The rules also bind `packages/ui` (`packages/ui/src`, specs in `packages/ui/tests`); where the text below names an `apps/web` path, the kit's counterpart is meant; motion's `animate()` returns a thenable and counts as a promise here.

A promise-returning expression used as a statement is either a bug (a forgotten `await`) or a decision (fire-and-forget). The `void` operator marks the decision, so a reader sees at the call site that the missing `await` is intentional. In this app the common cases are query invalidations (`invalidatePersonalBests`), React Router's `navigate`, IndexedDB reads started from an effect, and async handlers passed to props that expect a void-returning callback (`onClick`, `onSelect`, `onValueChange`), which are wrapped as `() => void handler()`. The oxlint rules `typescript/no-floating-promises` and `typescript/no-misused-promises` check both halves; they are switched off in the root `vite.config.ts` today, which is why this record is a review rule until the tooling plan arms them.

Scope: all TypeScript and TSX under `apps/web/src` and `apps/web/tests`.

R1 binds `tools/workbench` (`scripts/`, `site/src/`) as well.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Prefix a promise-returning expression that is deliberately not awaited with the `void` operator; an async function handed to a callback that expects a void return is wrapped as `() => void fn()`. | proposed |
| R2 | Prefer `void` over any other discard form — an empty `.catch()`, a no-op `.then()`, or an inline lint suppression — so that every intentional fire-and-forget reads the same way. An awaited `.catch(() => undefined)` that deliberately ignores a failure the code then moves past is not a discard and stays. | manual |
| R3 | Do not `void` a call whose rejection matters (a write or delete of user data, a step the caller's next line depends on). If the enclosing function is already async, or the caller can surface the failure, `await` it instead. | manual |
| R4 | Attach terminal `.then`/`.catch` handling to a long-lived `void`ed chain (the boot chain in `apps/web/src/main.tsx`, background loops) rather than relying on `void` alone to deal with rejection. | manual |

## 3. Detection

```yaml
R1:
  type: lint
  pattern: "typescript/no-floating-promises, typescript/no-misused-promises (type-aware oxlint)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "apps/web/tests/**/*.ts", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "packages/ui/tests/**/*.ts", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    None from the lint rules themselves. Until they are on in vite.config.ts, run oxlint by hand
    with `--type-aware -A all -D typescript/no-floating-promises -D typescript/no-misused-promises`
    (the oxlint-tsgolint binary must be reachable, e.g. via OXLINT_TSGOLINT_PATH). A grep substitute
    conflates the `void` operator with `void` type annotations.
R2:
  type: grep
  pattern: "^\\s*[\\w.]+\\([^)]*\\)\\.catch\\(\\(\\) => (undefined|\\{\\s*\\}|null)\\);"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx", "packages/ui/src/**/*.ts", "packages/ui/src/**/*.tsx", "tools/workbench/scripts/**/*.ts", "tools/workbench/site/src/**/*.ts", "tools/workbench/site/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    An awaited `await x().catch(() => undefined);` does not match (the statement starts with
    `await`), so it is not flagged. A multi-line chain is missed.
R3:
  type: manual
  reason: >
    Whether a rejection matters is a question about the call's consequences. The reviewable signal
    is a `void`ed call inside a function that is already async and touches persisted data.
  enforcedBy: null
R4:
  type: manual
  reason: >
    Requires knowing that a chain is long-lived rather than a fleeting UI side effect.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** an unawaited call is self-documenting: the reader does not have to decide whether a missing `await` is a bug.
- **Good, because** once the lint rules are on, the marker cannot silently stop being applied.
- **Bad, because** `void` silences the linter without handling rejection. The promise still rejects and the browser logs an unhandled rejection, so the marker can make a genuine mistake look reviewed.
- **Bad, because** the wrapper form required for async handlers adds an arrow function at every such prop.
- **Neutral, because** the keyword is overloaded: the same token is a type annotation everywhere else, which makes the discard harder to search for than a dedicated helper would be.

## 5. Reference implementation

```ts
const boot = async (rootEl: HTMLElement) => { … };

boot(rootEl).catch((error: unknown) => {
  console.error(error);
  createRoot(rootEl).render(<RootErrorFallback error={error} />);
});
```

```tsx
useEffect(() => {
  let cancelled = false;
  void getSessionRecords(targetId).then((records) => {
    if (!cancelled) setLoaded({ id: targetId, records });
  });
  return () => {
    cancelled = true;
  };
}, [targetId]);

<Button variant="danger" onClick={() => void handleDelete()}>
  {m.ui_delete_dialog_title()}
</Button>;
```

```ts
export const deleteSessionGPS = async (sessionId: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('session-gps', 'readwrite');
  const keys = await tx.store.index('sessionId').getAllKeys(sessionId);
  await Promise.all(keys.map((key) => tx.store.delete(key)));
  await tx.done;
};
```

## 6. Forbidden practices

- ❌ An `// oxlint-disable-next-line typescript/no-floating-promises` suppression — `void` keeps the call visible and searchable.
- ❌ Passing an async function straight into `onClick`, `onSelect`, `onChange` or any callback typed to return `void` — rejections escape the caller. Wrap it: `() => void handler()`.
- ❌ `void` on a call whose failure would matter, in a function that is already async — an IndexedDB write or delete is awaited.
- ❌ `void array.map(async (x) => …)` — this discards an array of promises. Use `await Promise.all(…)`, or `void Promise.all(…)` if the wait is genuinely unwanted.
- ❌ `void` as the standing answer to a lint error in new code. Reach for `await` first.
- ❌ `fn().catch(() => undefined);` or `fn().then(() => {});` as a statement to discard a promise — write `void fn();`, so every fire-and-forget reads the same way.
