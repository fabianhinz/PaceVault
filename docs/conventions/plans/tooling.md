---
id: tooling
depends_on: [accessible-queries-in-component-tests, assertion-vocabulary, authenticated-fetch-and-response-parsing, behavioural-constants-hoisted-upper-snake, boolean-names-without-is-prefix, collaborators-replaced-with-mocks, colocated-types-module, comments-cite-sources-and-explain-why, component-declaration-shape, component-directory-and-file-naming, component-ref-handling-by-need, context-provider-accessor-pairs, cross-boundary-contracts-in-shared, domain-error-subclasses, effects-are-rare, engine-holds-domain-logic-only, env-access-through-validated-facade, exhaustive-record-maps-over-branching, floating-promises-marked-void, formatting-through-intl-namespace, helpers-as-namespace-objects, helpers-group-by-topic, hook-directory-placement, hook-results-bound-whole, hooks-return-the-fitting-shape, index-modules-are-not-barrels, library-type-narrowing, mirrored-spec-layout, names-spell-out-their-meaning, native-date-and-duration-constants, navigation-through-router-hooks, one-hook-per-file, one-server-call-per-hook-module, outcome-unions-over-exceptions, render-through-provider-helpers, signature-parameter-shape, single-zustand-store-of-slices, snackbar-feedback-via-feature-maps, spec-describe-and-case-titles, styled-api-over-sx, test-data-from-mock-factories, ui-primitives-from-react-ui, unit-length-discipline, user-facing-strings-in-copy-modules, variant-unions-with-default-resolvers, visible-copy-arrives-as-props, zod-schema-naming-and-inference]
generated: 2026-10-23
---

# Enforcement tooling

Each convention below is already established in the code — the plans in
`depends_on` did that. This plan makes the toolchain fail on a future
violation. It carries no rule of its own and has no TDR reference; it arms the
records named in each item.

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
- [`env-access-through-validated-facade`](env-access-through-validated-facade.md)
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
- [`outcome-unions-over-exceptions`](outcome-unions-over-exceptions.md)
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
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

2. Ban `function` declarations.
   Backs: [`component-declaration-shape`](../tdr/component-declaration-shape.md) rule R1
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'func-style': ['error', 'expression']` to `lint.rules`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

3. Ban parent-relative imports.
   Backs: [`index-modules-are-not-barrels`](../tdr/index-modules-are-not-barrels.md) rule R8
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'import'` to `lint.plugins` and `'import/no-relative-parent-imports': 'error'` to `lint.rules`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

4. Ban the router's link components.
   Backs: [`navigation-through-router-hooks`](../tdr/navigation-through-router-hooks.md) rule R8
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'no-restricted-imports': ['error', { paths: [{ name: 'react-router-dom', importNames: ['Link', 'NavLink'] }] }]` to `lint.rules`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

5. Exhaustive switches.
   Backs: [`exhaustive-record-maps-over-branching`](../tdr/exhaustive-record-maps-over-branching.md) rule R3 (also backs outcome-unions-over-exceptions R5)
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'typescript/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: false }]` to `lint.rules` (type-aware linting is already on via `options.typeAware`). If the installed oxlint does not accept the option, use the bare `'error'` form and note that `default` arms are then not reported.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

6. Throw only Error objects.
   Backs: [`domain-error-subclasses`](../tdr/domain-error-subclasses.md) rule R1
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add `'typescript/only-throw-error': 'error'` to `lint.rules`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

7. Explicit return types on hooks.
   Backs: [`hooks-return-the-fitting-shape`](../tdr/hooks-return-the-fitting-shape.md) rule R2 (also backs one-server-call-per-hook-module R11)
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add an override `{ files: ['apps/web/src/**/use*.ts', 'apps/web/src/**/use*.tsx', 'packages/ui/src/**/use*.ts', 'packages/ui/src/**/use*.tsx'], rules: { 'typescript/explicit-function-return-type': ['error', { allowExpressions: true }] } }` to `lint.overrides`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

8. Floating and misused promises.
   Backs: [`floating-promises-marked-void`](../tdr/floating-promises-marked-void.md) rule R1
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: `'typescript/no-floating-promises': 'off'` becomes `'error'`; add `'typescript/no-misused-promises': 'error'`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

9. No unsafe type assertions in specs.
   Backs: [`collaborators-replaced-with-mocks`](../tdr/collaborators-replaced-with-mocks.md) rule R6
   Files: `vite.config.ts` (root, `lint` block)
   Install: none (oxlint ships the rule; type-aware rules use the already enabled `options.typeAware`)
   Change: add an override `{ files: ['apps/web/tests/**'], rules: { 'typescript/no-unsafe-type-assertion': 'error' } }` to `lint.overrides`.
   Check: introduce a violation in a real file under `apps/web/src` (or `apps/web/tests` for item 9) and confirm `vp check` fails naming this rule; remove it and confirm `vp check` passes. Both halves — a gate that matches nothing passes exactly like a gate that holds.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 to this rule id plus `vite.config.ts`, and flip its Section 2 Enforcement to `enforced`.

## Open items

- `exhaustive-record-maps-over-branching` R1 (no TypeScript `enum`): oxlint's `oxc/no-const-enum` covers only `const enum`. Check whether the installed oxlint offers a general enum ban; if not, the rule stays manual.
- Fact-check after the 3D map work (2026-10-24): the new 3D source trips none of gates 1, 2, 4, 5, 6 and 7 today (no `exhaustive-deps` warning in `apps/web/src/features/map/**`, no `function`, `switch`, `throw` or router link in the new modules, every new `use*` hook is annotated `: void` or `: MapRendererHandOver`). Gate 3: the 3D hooks' `'../…'` imports are rewritten by index-modules-are-not-barrels item 3. Gate 8: the promise call sites in the 3D hooks are listed in floating-promises-marked-void. Gate 9: the 3D casts `stub as unknown as MapLibreMap` (`apps/web/tests/features/map/terrainCamera.spec.ts:124`) and `{ sessionId: 's1', timestamp: 0 } as SessionRecord` (`apps/web/tests/features/map/zoneColoredPath.spec.ts:29,113`) go with collaborators-replaced-with-mocks item 5 and test-data-from-mock-factories item 18.
- Gate 9 still has no fixing plan for these assertions in `apps/web/tests/**`, none of them from the 3D work: `zoneColoredPath.spec.ts:21,24,76` and `lib/zoneColors.spec.ts:4,16,33` (`as ZoneScale`, `as [number, number, number, number][]`), `store/layout.spec.ts:9`, `lib/indexeddb.integration.test.ts:236,281`, `parsers/fitRequiredFields.spec.ts:3`, `lib/intervals.spec.ts:95`, `lib/archive.spec.ts:21`, `features/sessions/createIngestBatcher.integration.test.ts:102`. Before switching gate 9 on, run it once and either fix each site that `typescript/no-unsafe-type-assertion` reports (a guard or an exact-type factory) or narrow the gate; this plan does not decide which.
- `mirrored-spec-layout` R7 (one setup file per tree): no lint rule applies. Once that plan lands, each vitest project in `apps/web/vitest.config.ts` has exactly one `setupFiles` entry; set the TDR's `enforcedBy` to that config.

## Done

Once every item checks out and you've confirmed the result, delete this file.
The TDR references you updated stay — they now record a gate that really
exists.
