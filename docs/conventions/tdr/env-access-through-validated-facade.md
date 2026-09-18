---
kind: pattern-apply-tdr-reference
id: env-access-through-validated-facade
title: Environment access through a validated facade
summary: Every build-time environment variable is declared in one Zod-validated module and read as a property of its exported env object; nothing reads import.meta.env directly.
governs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
adopted_rules: [R1, R2, R4, R5, R6, R7]
adopted: 2026-09-17
---

# Environment access through a validated facade

## 1. Context

This file carries R1, R2, R4, R5, R6 and R7.

Every environment variable this application consumes is declared once in a schema-validated facade module, `src/lib/env.ts`, and read by application code as a property of the exported `env` object — never from `import.meta.env`. Without the facade a missing or malformed variable surfaces as `undefined` in the middle of a render: a basemap URL built from the string `"undefined"`, a version chip showing nothing, a flag that is truthy because it is the string `"false"`. With it, the failure happens at start, names the variable, and says what is wrong.

One rule of the original is not carried: it owned a server/client boundary, keeping unprefixed variables out of browser code. This is a pure client-side PWA with no server runtime, so there is no private half of the environment. Every variable the facade declares is bundled and visible to anyone who opens the app, and the facade must not be read as protecting anything.

Scope: the application's own source under `src/`. Build tooling — `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts` — runs before or outside the module graph and is out of scope.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Read every environment variable as a property of the facade's exported `env` object; do not read `import.meta.env` in application source. | proposed |
| R2 | Declare each new variable in the facade's schema before using it — an undeclared variable is not available to application code. Keep `.env.example` listing exactly the `VITE_`-prefixed keys the schema declares. | manual |
| R4 | Do the coercion and format checking in the schema, not at the call site: booleans coerced, numbers through a coercing number schema, and structural constraints (minimum key length, URL shape, closed value sets) through `refine`/`url`/`enum`. Consumers receive a typed value and apply no fallback of their own. | manual |
| R5 | Fail at import time when validation fails: log the treeified error and throw. Do not fall back to a default, and do not let a partially valid environment through. A shipped build cannot reach this path unless the build itself was wrong, so the failure belongs to `pnpm build` and `pnpm dev`. | manual |
| R6 | Keep the destructuring map exhaustive — list every declared key as an explicit `import.meta.env.KEY` property so the bundler can inline it statically. Never build it by spreading `import.meta.env` or by dynamic key access; Vite replaces the literal member expression at build time and a spread defeats that. | manual |
| R7 | `import.meta.env` may be touched outside the facade only in build tooling that runs before the module graph exists — `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`. Every other read is a violation. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "import\\.meta\\.env"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/env.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R2:
  type: manual
  reason: >
    Comparing the schema's declared keys against `.env.example` is a cross-file set comparison.
  enforcedBy: null
R4:
  type: grep
  pattern: "env\\.[a-zA-Z]+ \\?\\?|env\\.[a-zA-Z]+ === 'true'|Number\\(env\\."
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/lib/env.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A `??` on a genuinely optional declared value is permitted if the schema marks it optional
    rather than defaulting it — read the schema entry.
R5:
  type: grep
  pattern: "safeParse\\("
  include: ["src/lib/env.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    `safeParse` in the facade is the signal of a silent fallback rather than a throw; elsewhere in
    the codebase `safeParse` is the correct form, which is why this entry is scoped to one file.
R6:
  type: grep
  pattern: "\\.\\.\\.import\\.meta\\.env|import\\.meta\\.env\\["
  include: ["src/lib/env.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R7:
  type: grep
  pattern: "import\\.meta\\.env"
  include: ["src/**/*.ts", "src/**/*.tsx", "e2e/**/*.ts", "tests/**/*.ts"]
  exempt: ["src/lib/env.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A test that deliberately stubs the environment may need the raw object; such a case belongs in
    the exempt list with a reason rather than being tolerated silently.
```

## 4. Trade-offs

- **Good, because** a missing or malformed variable fails at start, naming the variable, instead of producing a plausible-looking wrong value deep in a render.
- **Good, because** the set of variables the application consumes is one file, so `.env.example` can be checked against it and a new checkout can be configured without reading the source.
- **Bad, because** throwing at import time means a bad environment white-screens the app. That is the right trade for build-time values, but it is a real behaviour change and it must not be softened into a fallback later — a fallback returns exactly the failure mode the facade exists to remove.
- **Bad, because** the facade adds a module and an import for what is currently three reads; the gain is proportional to how many variables the app grows.
- **Neutral, because** in a client-side app the facade validates rather than protects — nothing it holds is secret, and a reader must not infer otherwise from the word "facade".

## 5. Reference implementation

`src/lib/env.ts`:

```ts
import { z } from 'zod';

const envSchema = z.object({
  appCommit: z.string().default('dev'),
  cartoApiKey: z.string().min(1),
  dev: z.coerce.boolean(),
});

type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  appCommit: import.meta.env.VITE_APP_COMMIT,
  cartoApiKey: import.meta.env.VITE_CARTO_API_KEY,
  dev: import.meta.env.DEV,
});

if (!parsed.success) {
  console.error(z.treeifyError(parsed.error));
  throw new Error('Invalid environment configuration');
}

export const env: Env = parsed.data;
```

A consumer:

```ts
const styleUrl = `https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json?key=${env.cartoApiKey}`;
```

## 6. Forbidden practices

- ❌ `import.meta.env.VITE_ANYTHING` in application source — the value arrives untyped, unchecked, and possibly `undefined`.
- ❌ Reading a variable the schema does not declare; the schema is what makes a variable exist.
- ❌ `env.cartoApiKey ?? ''` at a call site — the fallback belongs in the schema, or the variable should have been required.
- ❌ `safeParse` in the facade followed by a default object; that is the silent-partial-environment failure mode the throw exists to prevent.
- ❌ Building the destructuring map with a spread or a dynamic key — Vite inlines only literal member expressions, so the values come out `undefined` in a production build.
- ❌ Treating the facade as a secret boundary. Everything in it ships in the bundle.
