---
id: env-access-through-validated-facade
tdr_reference: tdr/env-access-through-validated-facade.md
generated: 2026-10-23
---

# Environment access through a validated facade

Read `tdr/env-access-through-validated-facade.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

1. Rewrite the convention line the facade overrides.
   Files: `apps/web/CLAUDE.md`
   Change: replace the line at `apps/web/CLAUDE.md:37` (starts with `- **Environment**: Vite reads`) with exactly:

   ```markdown
   - **Environment**: Vite reads `.env.local` from `apps/web/` (see `.env.example`). Application code reads variables only as `env.VITE_*` from `src/lib/env.ts`, a Zod-validated facade; a new variable is declared in its schema and its static key map first. The only direct read allowed elsewhere is the build-mode flag `import.meta.env.DEV` (or `MODE`/`PROD`). Rules: `docs/conventions/tdr/env-access-through-validated-facade.md`.
   ```

   Check: `rg -n "env.ts" apps/web/CLAUDE.md` prints the line.

2. Create the validated facade that fails at import.
   Files: new `apps/web/src/lib/env.ts`
   Change: create the module with exactly this content. Behaviour change accepted by the owner: a build or run whose `VITE_APP_COMMIT` is missing or empty no longer starts (today it starts and shows a blank or `undefined` build id).

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

   Check: `vp check` passes; `rg -n "throw new Error\('Invalid environment variables'\)" apps/web/src/lib/env.ts` prints one hit.

3. Read every application variable through the facade.
   Files: `apps/web/src/features/map/mapStyle.ts`, `apps/web/src/lib/crashReport.ts`, `apps/web/src/features/settings/AboutSection.tsx`
   Change: `mapStyle.ts:17` `const apiKey = import.meta.env.VITE_CARTO_API_KEY;` becomes `const apiKey = env.VITE_CARTO_API_KEY;` with `import { env } from '@/lib/env.ts';` (the `if (!apiKey)` guard at `:19` stays; an empty `.env` entry was already treated as unset there, the schema now also says so). `crashReport.ts:40` `${import.meta.env.VITE_APP_COMMIT}` becomes `${env.VITE_APP_COMMIT}`. `AboutSection.tsx:18` `{import.meta.env.VITE_APP_COMMIT}` becomes `{env.VITE_APP_COMMIT}`. Delete the four commented-out voyager lines and `// TODO` comments in `mapStyle.ts` (`:3-4`, `:6`, `:38-41`, `:55-56`) while touching the file (no comments in this codebase).
   Check: `rg -n "import\.meta\.env\.VITE_" apps/web/src --glob '!**/lib/env.ts'` prints nothing; `vp check`, `vp test -- --run`, `vp run e2e` and `vp run build` pass.

4. Give the Vitest run the variable the build sets.
   Files: `apps/web/vitest.config.ts`
   Change: `apps/web/vite.config.ts:5-12` sets `process.env.VITE_APP_COMMIT` from git; `vitest.config.ts` does not load that file, so without a value every spec importing a module that reaches `env.ts` would fail at import. Add `env: { VITE_APP_COMMIT: 'test' },` to the `test` block, directly after `globals: true,`.
   Check: `rg -n "VITE_APP_COMMIT: 'test'" apps/web/vitest.config.ts` prints one hit; `vp run test` passes.

5. Cover the facade's coercion and its failure at import.
   Files: new `apps/web/tests/lib/env.spec.ts`
   Change: two cases, each with `vi.stubEnv` + `vi.resetModules()` and a dynamic `await import('@/lib/env.ts')`, under `describe('env', ...)`: `it('treats an empty CARTO key as unset', ...)` stubs `VITE_CARTO_API_KEY` to `''` and expects `env.VITE_CARTO_API_KEY` to be `undefined`; `it('fails at import when the build id is empty', ...)` stubs `VITE_APP_COMMIT` to `''`, silences the log with `vi.spyOn(console, 'error').mockImplementation(() => undefined)`, and asserts `await expect(import('@/lib/env.ts')).rejects.toThrow('Invalid environment variables')` and `expect(console.error).toHaveBeenCalledWith('Invalid environment variables', expect.any(Object))`. `vi.unstubAllEnvs()` and `vi.restoreAllMocks()` in `afterEach`. Import test APIs from the module the test-layout plan prescribes (today `vite-plus/test`).
   Check: `vp test -- --run tests/lib/env.spec.ts` (from `apps/web/`) passes, both cases; `vp run build` and `vp run e2e` pass (the build sets the commit id).

6. Name the facade as the one exception to the safe-fallback rule.
   Files: `CLAUDE.md`
   Change: the root code-rules bullet at `CLAUDE.md:30` (starts with `- **No \`as any\` for external data**`) keeps its text and gains, after `never throw.`, the sentence: ` Exception: the environment facade \`apps/web/src/lib/env.ts\` logs and throws at import when its schema fails, so a misconfigured build does not start (\`docs/conventions/tdr/env-access-through-validated-facade.md\` R5).`
   Check: `rg -n "Exception: the environment facade" CLAUDE.md` prints one hit, on the `No \`as any\`` bullet.

## Open items

- R3 is moot: there is no server, so there is no server/public split; every variable is a `VITE_*` client variable.
- R7 maps to one carve-out only: the build-mode flag `import.meta.env.DEV` (read today in `apps/web/src/lib/debug/debug.ts:2` and `apps/web/src/lib/debug/DebugCrashTrigger.tsx:9`) and its siblings `MODE`/`PROD` may be read directly. Config files that run outside the module graph (`apps/web/vite.config.ts`, `apps/web/playwright.config.ts` with `process.env.CI`) are out of scope.
- `apps/web/src/vite-env.d.ts` keeps its `ImportMetaEnv` declarations: they type the static key map in `env.ts`.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
