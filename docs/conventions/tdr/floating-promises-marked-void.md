---
kind: pattern-apply-tdr-reference
id: floating-promises-marked-void
title: Deliberate fire-and-forget promises are prefixed with void
summary: A promise-returning expression used as a statement is prefixed with the void operator, so a missing await reads as intentional rather than forgotten.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "tests/**/*.ts"
adopted_rules: [R1, R2, R3, R4]
adopted: 2026-09-17
---

# Deliberate fire-and-forget promises are prefixed with void

## 1. Context

This file carries R1–R4.

A promise-returning expression used as a statement is either a bug — a forgotten `await` — or a deliberate fire-and-forget, and nothing in the syntax tells the two apart. The `void` operator is what makes the difference legible: a reader sees at the call site that the missing `await` was a decision. In an offline-first PWA the distinction matters more than usual, because most of these calls are IndexedDB reads and writes whose rejection is the only signal that the user's data did not persist.

Scope: all TypeScript and TSX under `src/` and `tests/`.

The related concern that an `async` function handed to a React event prop returns a promise where a void-returning function is expected is covered here too, in R1's second form: the handler is wrapped (`onClick={() => void doThing()}`) rather than passed directly.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Prefix a promise-returning expression that is deliberately not awaited with the `void` operator. An `async` function passed to a React event prop is wrapped the same way: `onClick={() => void handleSave()}`, never passed directly. | proposed |
| R2 | Prefer `void` over any other discard form — an empty `.catch()`, a no-op `.then()`, or an inline lint suppression — so that every intentional fire-and-forget reads the same way. | manual |
| R3 | Do not `void` a call whose rejection matters. If the enclosing function is already `async`, or the caller can surface the failure to the user through the toast store, `await` it and handle the failure instead. | manual |
| R4 | Attach terminal `.then`/`.catch` handling to a long-lived `void`ed chain — app bootstrap, store hydration, service-worker registration, a background backfill — rather than relying on `void` alone to deal with rejection. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^\\s+[a-zA-Z_$][a-zA-Z0-9_$.]*\\([^)]*\\)\\.then\\("
  include: ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts"]
  exempt: ["src/paraglide/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Misses an awaited call spanning several lines and a promise stored in a variable before being
    discarded. Does not see an `async` handler passed by reference to a JSX prop — use R1's second
    signal below for that.
R1b:
  type: grep
  pattern: "on(Click|Change|Submit|Select|OpenChange)=\\{[a-zA-Z_$][a-zA-Z0-9_$]*\\}"
  include: ["src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches every handler passed by reference, most of which are synchronous and correct. Read
    each named handler's declaration for `async` before treating it as a violation.
R2:
  type: grep
  pattern: "\\.catch\\(\\(\\) => \\{\\}\\)|\\.catch\\(\\(\\) => undefined\\)|\\.then\\(\\(\\) => \\{\\}\\)"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    An empty `.catch` that deliberately swallows a known-harmless rejection is not a discard form,
    but it is indistinguishable from one by pattern.
R3:
  type: manual
  reason: >
    Whether a rejection matters depends on what the call does and what the user would see if it
    failed — a reading of the call site, not of the line.
  enforcedBy: null
R4:
  type: manual
  reason: >
    Identifying a long-lived chain means knowing the module's role (bootstrap, hydration,
    background work), which no pattern expresses.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** a reader can tell a deliberate fire-and-forget from a forgotten `await` without knowing what the callee returns.
- **Good, because** it is mechanically checkable once the gate is on, so it costs review attention only until then.
- **Bad, because** `void` is easy to reach for as a way to silence the linter, which converts a real unhandled rejection into a marked one. R3 is the only thing standing against that, and it is a judgement.
- **Neutral, because** the wrapped-handler form (`() => void handleSave()`) is noisier at the JSX site than passing the handler directly, for a guarantee that matters mostly when the handler starts rejecting.

## 5. Reference implementation

A deliberate discard inside an effect:

```ts
useEffect(() => {
  void getAllSessionGPS().then(setGpsData);
}, []);
```

A rejection that matters — awaited and surfaced instead:

```ts
const handleSave = async (): Promise<void> => {
  try {
    await putSession({ id, session });
  } catch {
    toast(m.ui_session_save_failed(), undefined, 'error');
  }
};
```

```tsx
<Button onClick={() => void handleSave()}>Save</Button>
```

## 6. Forbidden practices

- ❌ A bare `doThing()` statement where `doThing` returns a promise — the next reader cannot tell whether the `await` is missing or deliberate.
- ❌ `onClick={handleSave}` where `handleSave` is `async`; the promise is handed to a prop typed void-returning and its rejection goes nowhere.
- ❌ `.catch(() => {})` as a way to discard — it reads as error handling and handles nothing.
- ❌ An inline lint suppression instead of `void`; the suppression says "ignore this" where `void` says what is happening.
- ❌ `void`ing a write whose failure the user needs to know about — the operator marks the decision, it does not make the decision correct.
- ❌ A `void`ed bootstrap chain with no terminal `.catch`; a rejection there takes the whole app down silently.
