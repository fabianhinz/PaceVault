---
id: tooling
depends_on: [alias-imports-across-directories, assertion-vocabulary, behavioural-constants-hoisted-upper-snake, boolean-names-without-is-prefix, collaborators-replaced-with-mock-proxies, colocated-types-module, component-declaration-shape, component-module-file-set, component-ref-handling-by-need, components-call-server-state-hooks-directly, controlled-with-uncontrolled-fallback, design-values-come-from-tokens, effects-are-rare, env-access-through-validated-facade, exhaustive-record-maps-over-branching, explicit-vitest-global-imports, floating-promises-marked-void, formatting-through-intl-namespace, helpers-as-namespace-objects, helpers-group-by-topic, hook-directory-placement, hook-results-bound-whole, hooks-return-the-fitting-shape, index-modules-are-not-barrels, library-type-narrowing, mirrored-spec-layout, module-length-and-single-export, native-date-and-duration-constants, navigation-through-router-hooks, one-hook-per-file, one-server-call-per-hook-module, props-types-in-colocated-types-module, render-through-provider-helpers, signature-parameter-shape, slot-props-escape-hatch, spec-describe-and-case-titles, test-data-from-mock-factories, toast-feedback-via-feature-maps, unit-length-discipline, variant-style-maps-in-styles-module, variant-unions-with-default-resolvers, zod-schema-naming-and-inference, zustand-store-per-domain]
generated: 2026-09-17
---

# Enforcement tooling

Each convention below is already established in the code — the plans in
`depends_on` did that. This plan makes the toolchain fail on a future
violation. It carries no rule of its own and has no TDR reference; it arms the
records named in each item.

Run this last. A gate switched on before the code conforms fails on code that
was already there.

## Depends on

Every record plan in this run must be executed and deleted before this plan starts.

- [`alias-imports-across-directories`](alias-imports-across-directories.md)
- [`assertion-vocabulary`](assertion-vocabulary.md)
- [`behavioural-constants-hoisted-upper-snake`](behavioural-constants-hoisted-upper-snake.md)
- [`boolean-names-without-is-prefix`](boolean-names-without-is-prefix.md)
- [`collaborators-replaced-with-mock-proxies`](collaborators-replaced-with-mock-proxies.md)
- [`colocated-types-module`](colocated-types-module.md)
- [`component-declaration-shape`](component-declaration-shape.md)
- [`component-module-file-set`](component-module-file-set.md)
- [`component-ref-handling-by-need`](component-ref-handling-by-need.md)
- [`components-call-server-state-hooks-directly`](components-call-server-state-hooks-directly.md)
- [`controlled-with-uncontrolled-fallback`](controlled-with-uncontrolled-fallback.md)
- [`design-values-come-from-tokens`](design-values-come-from-tokens.md)
- [`effects-are-rare`](effects-are-rare.md)
- [`env-access-through-validated-facade`](env-access-through-validated-facade.md)
- [`exhaustive-record-maps-over-branching`](exhaustive-record-maps-over-branching.md)
- [`explicit-vitest-global-imports`](explicit-vitest-global-imports.md)
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
- [`module-length-and-single-export`](module-length-and-single-export.md)
- [`native-date-and-duration-constants`](native-date-and-duration-constants.md)
- [`navigation-through-router-hooks`](navigation-through-router-hooks.md)
- [`one-hook-per-file`](one-hook-per-file.md)
- [`one-server-call-per-hook-module`](one-server-call-per-hook-module.md)
- [`props-types-in-colocated-types-module`](props-types-in-colocated-types-module.md)
- [`render-through-provider-helpers`](render-through-provider-helpers.md)
- [`signature-parameter-shape`](signature-parameter-shape.md)
- [`slot-props-escape-hatch`](slot-props-escape-hatch.md)
- [`spec-describe-and-case-titles`](spec-describe-and-case-titles.md)
- [`test-data-from-mock-factories`](test-data-from-mock-factories.md)
- [`toast-feedback-via-feature-maps`](toast-feedback-via-feature-maps.md)
- [`unit-length-discipline`](unit-length-discipline.md)
- [`variant-style-maps-in-styles-module`](variant-style-maps-in-styles-module.md)
- [`variant-unions-with-default-resolvers`](variant-unions-with-default-resolvers.md)
- [`zod-schema-naming-and-inference`](zod-schema-naming-and-inference.md)
- [`zustand-store-per-domain`](zustand-store-per-domain.md)

## Changes

1. Turn floating-promise checking back on.
   Backs: [`floating-promises-marked-void`](../tdr/floating-promises-marked-void.md) rule R1
   Files: `vite.config.ts`
   Install: none — type-aware linting is already enabled via `lint.options.typeAware` and `typeCheck`, which this rule requires.
   Change: in the `lint.rules` block, replace `'typescript/no-floating-promises': 'off'` with `'typescript/no-floating-promises': 'error'`.
   Check: introduce a violation in a real file and confirm the command fails naming this rule; remove it and confirm the command passes. Both halves — a gate that matches nothing passes exactly like a gate that holds. Concretely: add a bare `getAllSessionGPS();` statement inside an effect in `src/features/map/hooks/useGpsBackfill.ts`, run `pnpm check`, confirm it fails naming `typescript/no-floating-promises`; revert the line and confirm `pnpm check` passes.
   Then: set `enforcedBy` in the backed TDR reference's Section 3 R1 entry to `typescript/no-floating-promises in vite.config.ts` and flip its Section 2 R1 Enforcement to `enforced`.

2. Add misused-promise checking alongside it.
   Backs: [`floating-promises-marked-void`](../tdr/floating-promises-marked-void.md) rule R1
   Files: `vite.config.ts`
   Install: none.
   Change: add `'typescript/no-misused-promises': 'error'` to the same `lint.rules` block. This is the half that catches an `async` handler passed directly to a React event prop, which item 1's rule does not see.
   Check: add `onClick={handleDelete}` with an `async handleDelete` in `src/features/settings/DeleteAllDataDialog.tsx`, run `pnpm check`, confirm it fails naming `typescript/no-misused-promises`; restore the wrapped form and confirm it passes.
   Then: extend the same TDR reference's R1 `enforcedBy` to name both rule ids and this config path.

3. Raise the correctness category from warn to error.
   Backs: several records indirectly — most directly [`effects-are-rare`](../tdr/effects-are-rare.md) rule R7 via `react-hooks/exhaustive-deps`
   Files: `vite.config.ts`
   Install: none.
   Change: in the `lint` block, change `categories: { correctness: 'warn' }` to `categories: { correctness: 'error' }`, and change the `react-hooks/exhaustive-deps` override from `'warn'` to `'error'`. A category set to `warn` enforces nothing — `pnpm check` passes with warnings — so every rule under it is currently advisory.
   Check: run `pnpm check` **before** changing anything and count the warnings it prints; fix them first, then make the change and confirm `pnpm check` passes clean. If the warning count is large, do this item last and in its own commit. Then introduce a missing dependency in one effect, confirm `pnpm check` fails naming `react-hooks/exhaustive-deps`, and revert.
   Then: set `enforcedBy` in the effects TDR reference's Section 3 R7 entry to `react-hooks/exhaustive-deps in vite.config.ts` and flip its Section 2 R7 Enforcement to `enforced`.

## Open items

Most of the records in this run have no linter equivalent. Their rules are structural — where a module sits, what a directory contains, how a hook's result is bound, whether a describe is bound to a symbol — and Oxlint has no rule for any of them. Those rules stay `proposed` with `enforcedBy: null` in their TDR references, and that is the honest state rather than a gap to close. Inventing a custom rule for each is not this plan's job.

Two records are enforced by the type checker rather than by the linter, and their TDR references already record that: the enum ban under `exhaustive-record-maps-over-branching` R1 and `variant-unions-with-default-resolvers` R1, both enforced by `erasableSyntaxOnly` in `tsconfig.app.json`, which fails `pnpm check`. No gate is needed for either.

One gate is available but deliberately not proposed: a `max-lines` or `max-lines-per-function` budget. The `unit-length-discipline` record's R7 explicitly forbids adding one, because line count is the statistic that record says is misleading. Do not add it here.

`vitest.config.ts` could set `clearMocks: true`, and the mock-proxy record discusses it — but that record's R5 requires per-case construction precisely because `clearMocks` clears call history and not stubbed implementations. Adding it would not enforce the rule and might suggest the rule was covered. It is not proposed.

## Done

Once every item checks out and you've confirmed the result, delete this file.
The TDR references you updated stay — they now record a gate that really
exists.
