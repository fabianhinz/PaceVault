---
kind: pattern-apply-tdr-reference
id: explicit-vitest-global-imports
title: Import the test API explicitly, even with globals enabled
summary: Every spec imports describe, it, expect and vi by name from the runner even though ambient globals are on, and matcher registration happens once in the setup file.
governs:
  - "tests/**/*.spec.ts"
  - "tests/**/*.spec.tsx"
  - "tests/**/*.integration.test.ts"
  - "tests/setup.ts"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-09-17
---

# Import the test API explicitly, even with globals enabled

## 1. Context

This file carries R1–R5.

`vitest.config.ts` sets `test.globals: true`, so a spec that never imports `describe`, `it`, `expect` or `vi` still typechecks and still runs. Specs import them anyway. The point of the rule is that the import form is the one a reader, an editor and a future runner can all resolve: a spec read in isolation names where its API comes from, it survives being moved to a package or a runner with globals switched off, and go-to-definition works without an ambient type package in scope.

The one symbol that is deliberately *not* imported per spec is the assertion-matcher registration, which is a side effect and belongs once in `tests/setup.ts` — the file `setupFiles` names.

Scope: every spec file under `tests/` and the setup file. Out of scope: the Playwright specs under `e2e/`, which import from `@playwright/test` and have their own conventions; how suites and cases are titled; and how collaborators are stubbed.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Every spec file imports its runner API by name from `vitest`, even though the runner config enables ambient globals. | proposed |
| R2 | Each runner symbol a file uses appears in that file's own import list — never a partial import topped up with ambient globals for the rest. | proposed |
| R3 | A type-only symbol from `vitest` (`Mock`, `MockInstance`, `MockedFunction`) is imported by a separate `import type` statement, not with an inline `type` modifier inside the value import. | proposed |
| R4 | A spec never imports the assertion-matcher extension; matcher registration is not repeated per file. | proposed |
| R5 | `tests/setup.ts` carries the matcher registration as a bare side-effect import, together with the environment polyfills the suite needs — the IndexedDB shim, the Immer `Map`/`Set` plugin, and the per-test store and timer resets. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "from 'vitest'"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: manual
  reason: >
    Comparing the runner symbols a file *uses* against the ones it imports needs both sets
    computed per file; a pattern sees only the import list.
  enforcedBy: null
R3:
  type: grep
  pattern: "import \\{[^}]*\\btype\\b[^}]*\\} from 'vitest'"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R4:
  type: grep
  pattern: "jest-dom"
  include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx", "tests/**/*.integration.test.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R5:
  type: grep
  pattern: "^import '@testing-library/jest-dom"
  include: ["tests/setup.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** a spec read in isolation says where its API comes from, and go-to-definition works without an ambient type package in scope.
- **Good, because** the suite survives a config change — turning `globals` off, or moving a spec into a package with its own runner — without a sweep.
- **Bad, because** with `globals: true` still on, nothing enforces any of this; the rule holds only while everyone follows it, and the config actively permits the opposite.
- **Neutral, because** it adds an import line to every spec for a guarantee that pays off on a config change that may never happen.

## 5. Reference implementation

A spec, importing exactly what it uses:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';

import { useFiltersStore } from '@/store/filters.ts';
```

`tests/setup.ts`, carrying the side effects once:

```ts
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, vi } from 'vitest';
import { enableMapSet } from 'immer';

enableMapSet();
```

## 6. Forbidden practices

- ❌ Using `describe`, `it` or `expect` without importing them, on the grounds that `globals` is on — the spec then depends on a config setting it does not name.
- ❌ Importing `describe` and `it` but leaning on the ambient `vi`; a partial import is the worst of both forms.
- ❌ `import { describe, it, type Mock } from 'vitest'` — the inline `type` modifier mixes a value import with a type import in one statement.
- ❌ `import '@testing-library/jest-dom'` inside a spec; registration is a side effect and belongs once, in the setup file.
- ❌ Re-applying a polyfill or a store reset inside a spec that the setup file already applies.
