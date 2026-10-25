---
id: tooling
depends_on: [accessible-queries-in-component-tests, assertion-vocabulary, authenticated-fetch-and-response-parsing, behavioural-constants-hoisted-upper-snake, boolean-names-without-is-prefix, collaborators-replaced-with-mocks, colocated-types-module, comments-cite-sources-and-explain-why, component-declaration-shape, component-directory-and-file-naming, component-ref-handling-by-need, context-provider-accessor-pairs, cross-boundary-contracts-in-shared, domain-error-subclasses, effects-are-rare, engine-holds-domain-logic-only, exhaustive-record-maps-over-branching, floating-promises-marked-void, formatting-through-intl-namespace, helpers-as-namespace-objects, helpers-group-by-topic, hook-directory-placement, hook-results-bound-whole, hooks-return-the-fitting-shape, index-modules-are-not-barrels, library-type-narrowing, mirrored-spec-layout, names-spell-out-their-meaning, native-date-and-duration-constants, navigation-through-router-hooks, one-hook-per-file, one-server-call-per-hook-module, render-through-provider-helpers, signature-parameter-shape, single-zustand-store-of-slices, snackbar-feedback-via-feature-maps, spec-describe-and-case-titles, styled-api-over-sx, test-data-from-mock-factories, ui-primitives-from-react-ui, unit-length-discipline, user-facing-strings-in-copy-modules, variant-unions-with-default-resolvers, visible-copy-arrives-as-props, zod-schema-naming-and-inference]
generated: 2026-10-23
---

# Enforcement tooling

Each convention below is already established in the code — the plans in
`depends_on` did that. This plan makes the toolchain fail on a future
violation. It carries no rule of its own and has no TDR reference; it arms the
records named in each item. Items 1–8 and 10 are lint gates in the root
`vite.config.ts`; item 9 clears the last spec casts so gate 10 switches on
clean; items 11–12 are two repo checks that `vp run check` runs after the
per-package checks (owner, Q13: engine purity and theme tokens get gates,
effects R2/R3 stay manual).

Run this last. A gate switched on before the code conforms fails on code that
was already there.

## Depends on

- [`accessible-queries-in-component-tests`](accessible-queries-in-component-tests.md)
- [`assertion-vocabulary`](assertion-vocabulary.md)
- [`authenticated-fetch-and-response-parsing`](authenticated-fetch-and-response-parsing.md)
- [`behavioural-constants-hoisted-upper-snake`](behavioural-constants-hoisted-upper-snake.md)
- [`boolean-names-without-is-prefix`](boolean-names-without-is-prefix.md)
- [`collaborators-replaced-with-mocks`](collaborators-replaced-with-mocks.md)
- [`colocated-types-module`](colocated-types-module.md)
- [`comments-cite-sources-and-explain-why`](comments-cite-sources-and-explain-why.md)
- [`component-declaration-shape`](component-declaration-shape.md)
- [`component-directory-and-file-naming`](component-directory-and-file-naming.md)
- [`component-ref-handling-by-need`](component-ref-handling-by-need.md)
- [`context-provider-accessor-pairs`](context-provider-accessor-pairs.md)
- [`cross-boundary-contracts-in-shared`](cross-boundary-contracts-in-shared.md)
- [`domain-error-subclasses`](domain-error-subclasses.md)
- [`effects-are-rare`](effects-are-rare.md)
- [`engine-holds-domain-logic-only`](engine-holds-domain-logic-only.md)
- [`exhaustive-record-maps-over-branching`](exhaustive-record-maps-over-branching.md)
- [`floating-promises-marked-void`](floating-promises-marked-void.md)
- [`formatting-through-intl-namespace`](formatting-through-intl-namespace.md)
- [`helpers-as-namespace-objects`](helpers-as-namespace-objects.md)
- [`helpers-group-by-topic`](helpers-group-by-topic.md)
- [`hook-directory-placement`](hook-directory-placement.md)
- [`hook-results-bound-whole`](hook-results-bound-whole.md)
- [`hooks-return-the-fitting-shape`](hooks-return-the-fitting-shape.md)
- [`index-modules-are-not-barrels`](index-modules-are-not-barrels.md)
- [`library-type-narrowing`](library-type-narrowing.md)
- [`mirrored-spec-layout`](mirrored-spec-layout.md)
- [`names-spell-out-their-meaning`](names-spell-out-their-meaning.md)
- [`native-date-and-duration-constants`](native-date-and-duration-constants.md)
- [`navigation-through-router-hooks`](navigation-through-router-hooks.md)
- [`one-hook-per-file`](one-hook-per-file.md)
- [`one-server-call-per-hook-module`](one-server-call-per-hook-module.md)
- [`render-through-provider-helpers`](render-through-provider-helpers.md)
- [`signature-parameter-shape`](signature-parameter-shape.md)
- [`single-zustand-store-of-slices`](single-zustand-store-of-slices.md)
- [`snackbar-feedback-via-feature-maps`](snackbar-feedback-via-feature-maps.md)
- [`spec-describe-and-case-titles`](spec-describe-and-case-titles.md)
- [`styled-api-over-sx`](styled-api-over-sx.md)
- [`test-data-from-mock-factories`](test-data-from-mock-factories.md)
- [`ui-primitives-from-react-ui`](ui-primitives-from-react-ui.md)
- [`unit-length-discipline`](unit-length-discipline.md)
- [`user-facing-strings-in-copy-modules`](user-facing-strings-in-copy-modules.md)
- [`variant-unions-with-default-resolvers`](variant-unions-with-default-resolvers.md)
- [`visible-copy-arrives-as-props`](visible-copy-arrives-as-props.md)
- [`zod-schema-naming-and-inference`](zod-schema-naming-and-inference.md)

## Changes

1. Raise exhaustive-deps to an error.
   Backs: [`effects-are-rare`](../tdr/effects-are-rare.md) rule R7
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: `'react-hooks/exhaustive-deps': 'warn'` in the `**/*.{ts,tsx}` override becomes `'react-hooks/exhaustive-deps': 'error'`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

2. Ban `function` declarations.
   Backs: [`component-declaration-shape`](../tdr/component-declaration-shape.md) rule R1
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'func-style': ['error', 'expression']` to `lint.rules`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

3. Ban parent-relative imports.
   Backs: [`index-modules-are-not-barrels`](../tdr/index-modules-are-not-barrels.md) rule R8
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'import'` to `lint.plugins` and `'import/no-relative-parent-imports': 'error'` to `lint.rules`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

4. Ban the router's link components.
   Backs: [`navigation-through-router-hooks`](../tdr/navigation-through-router-hooks.md) rule R8
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'no-restricted-imports': ['error', { paths: [{ name: 'react-router-dom', importNames: ['Link', 'NavLink'] }] }]` to `lint.rules`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

5. Exhaustive switches.
   Backs: [`exhaustive-record-maps-over-branching`](../tdr/exhaustive-record-maps-over-branching.md) rule R3
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'typescript/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: false }]` to `lint.rules` (type-aware linting is already on via `options.typeAware`). If the installed oxlint does not accept the option, use the bare `'error'` form and note that `default` arms are then not reported.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

6. Throw only Error objects.
   Backs: [`domain-error-subclasses`](../tdr/domain-error-subclasses.md) rule R1
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'typescript/only-throw-error': 'error'` to `lint.rules`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

7. Explicit return types on hooks.
   Backs: [`hooks-return-the-fitting-shape`](../tdr/hooks-return-the-fitting-shape.md) rule R2 (also backs one-server-call-per-hook-module R11)
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add an override `{ files: ['apps/web/src/**/use*.ts', 'apps/web/src/**/use*.tsx', 'packages/ui/src/**/use*.ts', 'packages/ui/src/**/use*.tsx'], rules: { 'typescript/explicit-function-return-type': ['error', { allowExpressions: true }] } }` to `lint.overrides`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

8. Floating and misused promises.
   Backs: [`floating-promises-marked-void`](../tdr/floating-promises-marked-void.md) rule R1
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: `'typescript/no-floating-promises': 'off'` becomes `'error'`; add `'typescript/no-misused-promises': 'error'`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

9. Remove the remaining type assertions from the app specs.
   Backs: [`collaborators-replaced-with-mocks`](../tdr/collaborators-replaced-with-mocks.md) rule R6 (prepares item 10; owner, Q17: an item removes them)
   Files: `apps/web/tests/testUtils/defined.ts` (new), `apps/web/tests/lib/zoneColors.spec.ts:4,16,33`, `apps/web/tests/features/map/zoneColoredPath.spec.ts:21,24,59-64,76`, `apps/web/tests/store/layout.spec.ts:9`, `apps/web/tests/lib/indexeddb.integration.test.ts:236,281`, `apps/web/tests/parsers/fitRequiredFields.spec.ts:3`, `apps/web/tests/lib/intervals.spec.ts:95`, `apps/web/tests/lib/archive.spec.ts:21`, `apps/web/tests/features/sessions/createIngestBatcher.integration.test.ts:102`. Paths and lines are today's; mirrored-spec-layout renames several of these specs (`fitRequiredFields.spec.ts` → `fit.requiredFields.spec.ts`, `*.integration.test.ts` → `*.integration.spec.ts`), helpers-group-by-topic folds `lib/indexeddb.ts` into `lib/db.ts` and authenticated-fetch-and-response-parsing item 6 edits `intervals.spec.ts` — find each cast by its text where it now lives.
   Install: none
   Change: first run `vp check` once with item 10's override added locally to list what `typescript/no-unsafe-type-assertion` really reports, then fix every reported site; the list below is the 2026-10-25 scan (`rg -n "\bas [A-Z\[]|as unknown" apps/web/tests`, without `as const`), the 3D casts `terrainCamera.spec.ts:124` and `zoneColoredPath.spec.ts:29,113` excluded (collaborators-replaced-with-mocks item 5 and test-data-from-mock-factories item 18 remove those). Every fix keeps the assertions of its case unchanged.
   - `testUtils/defined.ts` exports `export const definedOrThrow = <T>(value: T | undefined): T => { if (value === undefined) { throw new Error('Expected a value, got undefined'); } return value; };` (a generic utility, so the bare parameter is the signature-parameter-shape exception).
   - `zoneScale(…) as ZoneScale` (`zoneColors.spec.ts:4,16,33`, `zoneColoredPath.spec.ts:21,76`) → `definedOrThrow(zoneScale(…))`; the `type ZoneScale` import goes where it is no longer read.
   - `colorsOf` (`zoneColoredPath.spec.ts:23-24`, `result?.color as [number, number, number, number][]`) → a guard over `DetailPath` (`apps/web/src/features/map/zoneColoredPath.ts:12-17`, `color: Color | Color[]`): the spec declares `type Color = [number, number, number, number];` (its `FALLBACK_COLOR`, `:12`, takes that type), `const isColorList = (color: Color | Color[]): color is Color[] => Array.isArray(color[0]);` and `const colorsOf = (path: DetailPath | null): Color[] => { if (path === null || !isColorList(path.color)) { throw new Error('Expected one colour per segment'); } return path.color; };`. The wind case (`:59-64`, `buildWindColoredPath(…)?.color as [ … ][]`) reads `const colors = colorsOf(buildWindColoredPath(records, [undefined, 180, 0]));`.
   - `layout.spec.ts:9` `options.migrate(persisted, version) as Record<string, unknown>` → bind the result, narrow with a local `const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;` and throw `new Error('migrate returned no object')` otherwise (as the helper already throws for a missing `migrate`, `:6-8`).
   - `indexeddb.integration.test.ts:236,281` `laps: [] as ReturnType<typeof makeLaps>` → `laps: makeLaps(0)` (the factory returns an empty `SessionLap[]` for 0, `packages/testing/src/records.ts:252-256`).
   - `fitRequiredFields.spec.ts:3` `vi.hoisted(() => ({ data: {} as Record<string, unknown> }))` → `vi.hoisted((): { data: Record<string, unknown> } => ({ data: {} }))` (a return annotation, no assertion).
   - `intervals.spec.ts:95` `(init.headers as Record<string, string>).Authorization` → `new Headers(init.headers).get('Authorization')`, compared with the same `toBe(\`Basic ${btoa(\`API_KEY:${KEY}\`)}\`)`.
   - `archive.spec.ts:21` `zipSync(entries).buffer as ArrayBuffer` → `new Uint8Array(zipSync(entries)).buffer` (the copy is typed `Uint8Array<ArrayBuffer>`, its `buffer` an `ArrayBuffer`; same bytes).
   - `createIngestBatcher.integration.test.ts:102` `rawData: { unstorable: () => undefined } as unknown as ArrayBuffer` → a real `ArrayBuffer` that IndexedDB cannot clone: `const detached = new ArrayBuffer(8); structuredClone(detached, { transfer: [detached] });` above the case's `makeParsed` call, then `rawData: detached` (cloning a detached buffer throws `DataCloneError`, so the save still fails inside the transaction). If the fake IndexedDB of the test setup clones a detached buffer without error, the case stops proving the failure: leave this one site as it is and record it in conventions-follow-ups (`research/open-points.md`) instead of weakening the assertion.
   Check: `rg -n "\bas (unknown|[A-Z]\w*|\[)" apps/web/tests` prints nothing (`as const` is not matched); `vp test -- --run` from `apps/web/` passes with the same test count as before the item; clean `vp check`. With item 10's override in place `vp check` reports no `typescript/no-unsafe-type-assertion` error.

10. No unsafe type assertions in specs.
   Backs: [`collaborators-replaced-with-mocks`](../tdr/collaborators-replaced-with-mocks.md) rule R6
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add an override `{ files: ['apps/web/tests/**'], rules: { 'typescript/no-unsafe-type-assertion': 'error' } }` to `lint.overrides`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 10) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

11. Engine purity inside `vp run check`.
   Backs: [`engine-holds-domain-logic-only`](../tdr/engine-holds-domain-logic-only.md) rule R3 (its import half) and the pure-package rule of root `CLAUDE.md` §2; owner, Q13
   Files: `tools/workbench/scripts/boundaries.ts` (new), `tools/workbench/scripts/deps.ts` (or the module the workbench topic splits moved the cruise helpers to), `tools/workbench/package.json` (`scripts`), `package.json` (root, `scripts.check`), `CLAUDE.md:76` (root), `tools/workbench/CLAUDE.md:15`, the `scripts/` row of `tools/workbench/README.md` (`:13` today)
   Install: none (`dependency-cruiser` 18.6.0 is already a workbench devDependency; one cruise over `apps/web/src` and `packages` takes about 1 s)
   Change: today the rule `engine-is-pure` (`tools/workbench/.dependency-cruiser.cjs:9-17`, no React, React DOM, zustand or `apps/web/src/store/` import from `packages/engine/`) runs only inside `vp run workbench:deps -- <item>`, which needs an item and never fails the check. Wire it into the root check with the code that already runs it:
   - export `cruiseRepo` from `deps.ts` (`:477`, today module-local; `boundaryOf` `:435` and `boundaryLine` `:447` are exported already). Names are today's; where names-spell-out-their-meaning or helpers-group-by-topic renamed or moved them, use the functions that run depcruise with `CRUISE_ARGS` (`:463-470`) and build the boundary line.
   - `boundaries.ts`: `const cruise = cruiseRepo();` — on `undefined` exit 1 (the reason is already on stderr); otherwise `const boundary = boundaryOf(cruise); console.log(boundaryLine(boundary));` and `process.exit(1)` when `boundary.violations.length > 0`. It checks every rule in the config, so `store-no-features` (`.dependency-cruiser.cjs:18-24`) is gated with it; both hold today (`depcruise --config tools/workbench/.dependency-cruiser.cjs --output-type err apps/web/src packages` → "no dependency violations found (809 modules, 2408 dependencies cruised)", 2026-10-25).
   - `tools/workbench/package.json` gains `"boundaries": "node scripts/boundaries.ts"`.
   - root `package.json` `check` becomes `vp run @pacevault/i18n#compile && vp run -F '@pacevault/*' check && vp run -F @pacevault/workbench boundaries && vp run -F @pacevault/workbench tokens` (`tokens` is item 12; one root step per repo check, after the per-package checks, so a failure names its gate). `vp run workbench:check` stays as it is.
   - root `CLAUDE.md:76` comment becomes `# per package: vp check (fmt + lint + types); workbench: astro check; then the module boundaries and the theme tokens`; `tools/workbench/CLAUDE.md:15` adds "`scripts/boundaries.ts` runs the same rules in the root `vp run check` and fails on a violation"; the README `scripts/` row lists `boundaries.ts` (module boundaries in `vp run check`) and `themeTokens.ts` (item 12).
   Check: add `import { useState } from 'react';` (plus a use of it) to a real module under `packages/engine/src` and confirm `vp run check` fails with the boundary line naming `engine-is-pure` and that module; remove it and confirm `vp run check` passes and prints `Boundary check · engine-is-pure, store-no-features: no violations (…)`. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: in the backed TDR reference's Section 3 add to R3 `enforcedBy: "engine-is-pure (tools/workbench/.dependency-cruiser.cjs) via tools/workbench/scripts/boundaries.ts in vp run check"`; its Section 2 Enforcement stays `proposed`, because the `package.json` half of R3 (no runtime `dependencies`) is still the grep.

12. Theme tokens inside `vp run check`.
   Backs: [`styled-api-over-sx`](../tdr/styled-api-over-sx.md) rules R3 (hex colours, px arbitrary values) and R5 (colour attributes); owner, Q13
   Files: `tools/workbench/scripts/themeTokens.ts` (new), `tools/workbench/tests/scripts/themeTokens.spec.ts` (new), `tools/workbench/package.json` (`scripts`); for the white-alpha step `packages/ui/src/theme.css`, `packages/ui/src/lib/tokens.ts`, `apps/web/src/features/sessions/session/LapStrip.tsx`, `apps/web/src/components/charts/LapBands.tsx`; the root wiring is item 11's
   Install: none (Node built-ins only)
   Change: the repo's Node scripts live in `tools/workbench/scripts/` and run as `node scripts/<name>.ts` (there is no root scripts directory; `deps.ts` is the other repo-wide check there), so the check goes there as `themeTokens.ts`, with `"tokens": "node scripts/themeTokens.ts"` in `tools/workbench/package.json`. It resolves the repo root as `'../../..'` from `scripts/` (`tools/workbench/CLAUDE.md:8`), walks `apps/web/src` and `packages/ui/src` (recursive `readdirSync`), reads every `.ts`, `.tsx` and `.css` file and reports each hit as `<repo-relative path>:<line>: <match> (<check>)`, then exits 1 when it found any and prints `Theme tokens: no literals (<n> files)` and exits 0 otherwise. Export the pure part (`findThemeLiterals(source: string): ThemeLiteral[]`, `ThemeLiteral = { line: number; match: string; check: 'hex' | 'rgb' | 'px' }`) and keep the file walk in the guarded `main` (`if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();`, as `deps.ts` does). The three checks, line by line:
   - `hex`: `` /(?<=['"`\s:(,=])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/ `` — a hex colour in a string, attribute, template or declaration (`fill="#fff"`, `'#34d399'`, `color:#fff`); an id fragment like `href="#main"` does not match, a word like `#add` would, and is then renamed or allowlisted.
   - `rgb`: `/(?<![A-Za-z])rgba?\(\s*\d/` — an `rgb(…)`/`rgba(…)` whose first channel is a literal number (`'rgba(255,255,255,.3)'`, `rgb(0 0 0 / 0.6)`, `shadow-[0_8px_24px_rgb(0_0_0/0.4)]`; a `\b` would miss the last one after its `_`). A colour built from data starts with an interpolation and does not match: the converter `toCss` in `apps/web/src/features/map/terrainLine.ts:44-45` (`` `rgba(${color[0]},…` ``) and the gradient stops in `apps/web/src/features/map/TrackIntensityControl.tsx:40` (`` `rgb(${channels.join(', ')})` ``) pass without an allowlist entry, and so does d3's `rgb(css)` call (`zoneColoredPath.ts:22`).
   - `px`: `/-\[-?\d+(?:\.\d+)?px\]/` — a Tailwind arbitrary px value (`w-[440px]`, `rounded-[2px]`, `text-[11px]`, `lg:max-h-[300px]`). `calc()`/`max()` arbitraries, `transition-[width]`, `data-[…]` variants and `min-w-[5rem]` do not match (styled-api-over-sx Open items keeps those). Map line widths are not checked: they are plain numbers in TypeScript (`apps/web/src/features/map/SessionTerrain.tsx:18-24`, owner Q19), not classes.
   Allowlist (a `Set` of repo-relative paths at the top of the module, each with its reason in the plan, none in code): the theme files `packages/ui/src/theme.css` and `packages/ui/src/lib/tokens.ts` (the token definitions and their JS mirror); `apps/web/src/features/map/map-attribution.css` (overrides MapLibre's attribution control with `rgb(0 0 0 / 0.6)`, `rgb(255 255 255 / 0.5|0.6|0.8)`, `:2-12`; no plan tokenises it, see Open items). `tools/docs/banner/page/banner.css` holds the banner-only px tokens (styled-api-over-sx item 19) and is a theme file too, but the check does not scan `tools/docs`; if its scope is widened to the banner page, that file joins the allowlist. JSON (the vendored `darkMatter.style.json`) is not read.
   Before the check is wired, clear the one literal family no styled-api-over-sx item replaces (its R3 names hex colours, and its items tokenise only those): the white-at-alpha `rgba(255,255,255,…)` strings of the lap strip and the lap bands — `apps/web/src/features/sessions/session/LapStrip.tsx:17-22,114,162,171,179,231` (alphas .3, .35, .45, .18, .75, .5, .3, .04, .3, .25, .25) and `apps/web/src/components/charts/LapBands.tsx:31-35,52` (.95, .6, .1, .22, .32, .1); the dry run of these three checks on 2026-10-25 finds every other hit inside a styled-api-over-sx item (the `shadow-[…rgb(0_0_0/0.4)]` of `packages/ui/src/components/Card.tsx:9,11` goes with its `--shadow-floating` item). Per styled-api-over-sx R3 they become exact-alpha tokens, pixel-identical: `theme.css` gains one `--color-white<alpha×100>: rgb(255 255 255 / <alpha>);` per distinct alpha (`white4`, `white10`, `white18`, `white22`, `white25`, `white30`, `white32`, `white35`, `white45`, `white50`, `white60`, `white75`, `white95`), mirrored in `tokens.ts` with the identical string, `white4: 'rgb(255 255 255 / 0.04)'` … (the name and value must match character for character: `packages/ui/tests/lib/tokens.spec.ts:30-34` compares `tokens.<key>` with `--color-<kebab(key)>` as strings; a hex alpha would round .3 to `4d`, so both keep the exact `rgb()` form; both files are on the allowlist), and each site reads `tokens.white30` etc. (the strings are SVG `fill`/`stroke` values returned from functions, `LapStrip.tsx:16-23`, `LapBands.tsx:30-36`); the lap strip and a session chart with laps capture identically before and after (workbench capture, desktop and 390 px).
   The spec covers `findThemeLiterals`: one hit each for `fill="#fff"`, `'rgba(255,255,255,.3)'`, `className="w-[440px]"`; no hit for `` `rgba(${color[0]},${color[1]},${color[2]},1)` ``, `href="#main"`, `min-w-[5rem]`, `pt-[calc(env(safe-area-inset-top)+1.5rem)]`; the line number of a hit on the third line of a source.
   Check: `vp run -F @pacevault/workbench tokens` passes on the migrated tree (every literal the styled-api-over-sx items replaced is gone; a hit outside the allowlist is a missed site and is fixed by that plan's rule, an identical-value token). Then introduce a violation in a real file — `className="w-[441px]"` in `apps/web/src/features/onboarding/index.tsx` (the former `OnboardingFlow.tsx`, renamed by component-declaration-shape item 12), and separately `fill="#fff"` in a real `.tsx` under `packages/ui/src` — and confirm `vp run check` fails naming the file, line and check; remove each and confirm `vp run check` passes. `vp test -- --run` from `tools/workbench/` passes with the new spec.
   Then: in the backed TDR reference's Section 3 set `enforcedBy` of R3 and R5 to `"tools/workbench/scripts/themeTokens.ts via vp run check (apps/web/src, packages/ui/src)"`; Section 2 Enforcement stays `manual` for both, because the arbitrary `shadow-[…]`/`z-[…]` forms without a colour, the alpha-suffix pattern and the banner page and board globs of R3's detection are not part of the check.

## Open items

- `exhaustive-record-maps-over-branching` R1 (no TypeScript `enum`): oxlint's `oxc/no-const-enum` covers only `const enum`. Check whether the installed oxlint offers a general enum ban; if not, the rule stays manual.
- Fact-check after the 3D map work (2026-10-24): the new 3D source trips none of gates 1, 2, 4, 5, 6 and 7 today (no `exhaustive-deps` warning in `apps/web/src/features/map/**`, no `function`, `switch`, `throw` or router link in the new modules, every new `use*` hook is annotated `: void` or `: MapRendererHandOver`). Gate 3: the 3D hooks' `'../…'` imports are rewritten by index-modules-are-not-barrels item 3. Gate 8: the promise call sites in the 3D hooks are listed in floating-promises-marked-void. Gate 10: the 3D casts `stub as unknown as MapLibreMap` (`apps/web/tests/features/map/terrainCamera.spec.ts:124`) and `{ sessionId: 's1', timestamp: 0 } as SessionRecord` (`apps/web/tests/features/map/zoneColoredPath.spec.ts:29,113`) go with collaborators-replaced-with-mocks item 5 and test-data-from-mock-factories item 18.
- Effects R2/R3 (`effects-are-rare`: derived state computed during render, I/O through read and write modules) have no gate and stay review-time (owner, Q13); no lint rule tells a derived-state effect from a synchronising one.
- Item 11 gates the rule as it stands: `engine-is-pure` forbids React, React DOM, zustand and `apps/web/src/store/` imports, not every import from outside `packages/engine/` that engine-holds-domain-logic-only R3 ("engine modules import only other engine modules") forbids. Widening its `to` to `{ pathNot: '^packages/engine/' }` would make the gate cover R3's import half fully; that changes the rule the owner named, so it is not done here.
- Item 12 allowlists `apps/web/src/features/map/map-attribution.css` (MapLibre attribution overrides, `rgb(…)` with alpha, `:2-12`): no styled-api-over-sx item tokenises it and its selectors style a third-party control outside Tailwind. Tokenising it (four exact-alpha black/white tokens read as `var(--color-…)`) would let the allowlist shrink to the two theme files.
- `mirrored-spec-layout` R7 (one setup file per tree): no lint rule applies. Once that plan lands, each vitest project in `apps/web/vitest.config.ts` has exactly one `setupFiles` entry; set the TDR's `enforcedBy` to that config.

## Done

Once every item checks out and you've confirmed the result, delete this file.
The TDR references you updated stay — they now record a gate that really
exists.
