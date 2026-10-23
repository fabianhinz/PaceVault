---
kind: pattern-apply-tdr-reference
id: env-access-through-validated-facade
title: Environment access through a validated facade
summary: Application code reads environment variables only as env.VITE_* from the Zod-validated apps/web/src/lib/env.ts, which declares every key statically and coerces values in its schema.
governs:
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
adopted_rules: [R1, R2, R4, R5, R6, R7]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Environment access through a validated facade

## 1. Context

This file carries rules R1, R2, R4, R5, R6 and R7.

Every environment variable the app consumes is declared once in `apps/web/src/lib/env.ts`, validated with a Zod schema, and read by application code as a property of the exported `env` object, never from `import.meta.env`. Without the facade every call site re-implements its own coercion (`if (!apiKey)` for an empty key) and reads an untyped raw string. The app is a pure client-side SPA, so every variable is a public `VITE_*` variable inlined by Vite at build time; there is no server/public split to guard.

On a failed parse the facade logs the treeified error and throws at import, so a misconfigured build does not start; it is the one named exception to the root `CLAUDE.md` safe-fallback rule. `apps/web/vitest.config.ts` sets `VITE_APP_COMMIT` in `test.env`, because the Vitest run does not load `apps/web/vite.config.ts`, which sets it from git. Scope: `apps/web/src`. Config files that run outside the module graph (`apps/web/vite.config.ts`, `apps/web/vitest.config.ts`, `apps/web/playwright.config.ts`) are out of scope.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Read every environment variable as a property of `env` from `apps/web/src/lib/env.ts`; do not read `import.meta.env.VITE_*` in application source. | proposed |
| R2 | Declare each new variable in `envSchema` and its `ImportMetaEnv` entry in `apps/web/src/vite-env.d.ts` before using it — an undeclared variable is not available to application code. | manual |
| R4 | Do the coercion and format checking in the schema, not at the call site: empty strings become `undefined` through `emptyAsUndefined`, booleans through a string-to-boolean transform, numbers through `z.coerce.number()`, closed value sets through `z.enum`. Consumers receive a typed value. | proposed |
| R5 | Fail at import time when validation fails: log the treeified error and throw. Do not fall back to a default, and do not let a partially valid environment through. Required variables carry `.min(1)` so an empty value fails. | proposed |
| R6 | Keep the raw key map static and exhaustive — list every declared key as an explicit `import.meta.env.VITE_KEY` property so Vite can inline it. Never build it by spreading `import.meta.env` or by dynamic key access. | proposed |
| R7 | `import.meta.env` may be touched outside the facade only to read the build-mode flags `import.meta.env.DEV`, `MODE` or `PROD`. Every other read is a violation. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "import\\.meta\\.env\\.VITE_"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/lib/env.ts", "apps/web/src/vite-env.d.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: manual
  reason: >
    Requires correlating a property read at a call site against the schema declarations; the type
    checker already rejects `env.UNDECLARED`, so the remaining risk is a key declared in the schema
    but missing from the raw map, which R6's review catches.
  enforcedBy: null
R4:
  type: grep
  pattern: "env\\.[A-Z0-9_]+ ?(===|!==) ?['\"](true|false|)['\"]|parseInt\\(\\s*env\\.|Number\\(\\s*env\\."
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/lib/env.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Flags a legitimate comparison against a textual variable whose value space includes those words."
R5:
  type: grep
  pattern: "throw new Error\\('Invalid environment variables'\\)"
  include: ["apps/web/src/lib/env.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: "Matches the throw without proving it sits in the failed-parse branch; read the branch. The spec case 'fails at import when the build id is empty' in apps/web/tests/lib/env.spec.ts pins it."
R6:
  type: grep
  pattern: "\\.\\.\\.import\\.meta\\.env|import\\.meta\\.env\\["
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "import\\.meta\\.env\\.(?!DEV\\b|MODE\\b|PROD\\b|VITE_)"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/lib/env.ts", "apps/web/src/vite-env.d.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "Requires `rg -P` for the lookahead. `VITE_` reads are R1's concern."
```

No lint rule in the root `vite.config.ts` restricts `import.meta.env` access today; every entry is review-time with `enforcedBy: null`.

## 4. Trade-offs

- **Good, because** coercion lives once in the schema, so every consumer gets a typed value rather than re-implementing `=== ''` or `=== 'true'` at each call site.
- **Bad, because** every new variable touches the facade in two places (schema, raw map) plus `vite-env.d.ts` and `.env.example`.
- **Good, because** a misconfigured build fails loudly at start instead of shipping a blank or `undefined` value.
- **Bad, because** one missing variable stops the whole app from starting, and every test runner that evaluates the module graph has to provide the required variables.
- **Neutral, because** Vite already inlines `import.meta.env` statically; the facade adds validation on top of that, not a different loading mechanism.

## 5. Reference implementation

```ts
import { z } from 'zod';

const emptyAsUndefined = (value: string | undefined): string | undefined => {
  if (value === '') return undefined;
  return value;
};

const envSchema = z.object({
  VITE_APP_COMMIT: z.string().min(1),
  VITE_CARTO_API_KEY: z.string().optional().transform(emptyAsUndefined),
});

type Env = z.infer<typeof envSchema>;

const rawEnv = {
  VITE_APP_COMMIT: import.meta.env.VITE_APP_COMMIT,
  VITE_CARTO_API_KEY: import.meta.env.VITE_CARTO_API_KEY,
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  console.error('Invalid environment variables', z.treeifyError(parsedEnv.error));
  throw new Error('Invalid environment variables');
}

export const env: Env = parsedEnv.data;
```

```ts
import { env } from '@/lib/env.ts';

const apiKey = env.VITE_CARTO_API_KEY;
```

## 6. Forbidden practices

- Reading `import.meta.env.VITE_SOMETHING` at a call site for a variable the facade declares — it bypasses the type and the coercion for no gain.
- Introducing an undeclared variable as an ad-hoc knob with an inline `parseInt` and `|| 0` fallback.
- Comparing a raw environment string to `''`, `'true'` or `'false'` at a call site — the schema produces the typed value.
- Spreading or bracket-indexing `import.meta.env`, in the facade or outside it.
- `try`/`catch`-ing the facade's import.
- Adding a key to the schema without adding it to the raw key map.
- Falling back to raw values or defaults when the parse fails — the facade throws.

