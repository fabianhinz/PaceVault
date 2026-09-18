---
id: env-access-through-validated-facade
tdr_reference: tdr/env-access-through-validated-facade.md
generated: 2026-09-17
---

# Environment access through a validated facade

Read `tdr/env-access-through-validated-facade.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Add the facade module.
   Files: new `src/lib/env.ts`, new `tests/lib/env.spec.ts`
   Change: declare a Zod schema over the variables this app actually reads, built from an exhaustive destructuring map of explicit `import.meta.env.KEY` properties so Vite can inline them statically (R6) — never by spreading `import.meta.env` or by dynamic key access. Parse at module scope; on failure log the treeified error and throw (R5). Export the parsed object as `env`. The current variables are `VITE_APP_COMMIT` (a string, set by `vite.config.ts` from the git sha, defaulting to `'dev'`), `VITE_CARTO_API_KEY` (a string) and `DEV` (a boolean Vite always provides). Name the schema `envSchema` and the derived type `Env`, per the schema-naming rules. Add the spec, which `tests/CLAUDE.md` requires for `src/lib/`.
   Check: `pnpm test -- --run tests/lib/env.spec.ts` passes; `pnpm build` succeeds.

2. Do the coercion and format checking in the schema, not at the call sites.
   Files: `src/lib/env.ts`
   Change: R4 — `DEV` is coerced to a boolean in the schema, not compared as a string at a call site; `VITE_CARTO_API_KEY` carries a minimum-length `refine` so an empty string fails at start rather than producing a 401 from the tile server later; `VITE_APP_COMMIT` gets a `.default('dev')` so the facade owns the fallback rather than each reader.
   Check: temporarily set `VITE_CARTO_API_KEY=` in `.env.local` and confirm `pnpm dev` fails at start naming the variable; restore it.

3. Route the three existing raw reads through the facade.
   Files: `src/features/settings/AboutSection.tsx:19`, `src/features/map/mapStyle.ts:16`, `src/features/map/DeckMetricsOverlay.tsx:106`
   Change: `import.meta.env.VITE_APP_COMMIT` becomes `env.appCommit`; `import.meta.env.VITE_CARTO_API_KEY` becomes `env.cartoApiKey`; `import.meta.env.DEV` becomes `env.dev`. Drop any call-site fallback the schema now owns.
   Check: R1's grep returns no `import.meta.env` outside `src/lib/env.ts` and `vite.config.ts`; `pnpm check && pnpm build && pnpm exec playwright test`.

4. Document the declared variables in the example env file.
   Files: `.env.example`
   Change: R2 makes the schema the gate on which variables exist. Confirm `.env.example` lists exactly the `VITE_`-prefixed keys the schema declares, so a new checkout can be configured from it without reading the schema. Add any that are missing; remove any that the schema does not declare.
   Check: every `VITE_` key in `.env.example` appears in `envSchema` and vice versa.

5. Confirm nothing reads an undeclared variable.
   Files: all of `src/`
   Change: run R1's and R7's signals. The only permitted `import.meta.env` reads outside the facade are in `vite.config.ts` and `vitest.config.ts`, which run before the module graph exists and are out of scope. Anything else is a violation, including a read of a variable the schema does not declare.
   Check: R1's grep returns nothing under `src/` except `src/lib/env.ts`.

## Open items

R3's server/client split does not apply: PaceVault is a pure client-side PWA with no server runtime, so there is no private half of the environment to keep out of the browser. Every variable the facade declares is bundled and visible — `VITE_CARTO_API_KEY` in particular is a public, domain-restricted basemap key, not a secret. The rule is not carried in the TDR reference, and the facade must not be read as protecting anything.

Failing at import time is deliberate here, and the consequence is stated so nobody softens it later: a bad environment white-screens the app rather than degrading it. That is correct for a value a *build* supplies — a shipped build cannot have a missing `VITE_` variable unless the build itself was wrong — and it moves the failure to `pnpm build` and `pnpm dev`, where someone can act on it.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
