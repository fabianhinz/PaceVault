---
id: context-provider-accessor-pairs
tdr_reference: tdr/context-provider-accessor-pairs.md
generated: 2026-10-23
---

# Every context ships with its accessor hook in one provider module

Read `tdr/context-provider-accessor-pairs.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

None.

## Changes

`apps/web` declares no React context (`rg -n "createContext|useContext" apps/web/src` returns nothing); every item below is in `packages/ui` and its `apps/web` consumers. The bottom sheet's three contexts are spread over `packages/ui/src/components/sheetAboveContext.ts`, `packages/ui/src/components/sheetPeekContext.ts`, `packages/ui/src/hooks/useSheetScrollElement.ts`, with their provider in `packages/ui/src/components/BottomSheet.tsx:21-42`. On desktop, `Dock`, `SessionList`, the map controls (`SheetAbove`) and every peek (`SheetPeek`) render outside `BottomSheetProvider` (`apps/web/src/components/layout/AppLayout.tsx:83-95`), so they read through the `useUnstable*Context` accessors and handle `undefined`; only `BottomSheet`, which is always inside the provider, uses the throwing accessors. Run every item from the repo root; "green" means `vp run check` and `vp run test` both pass. The provider values and nesting order stay as they are; behaviour changes (owner-accepted): a sheet-only consumer rendered outside the provider now throws, and item 4 adds console warnings on desktop renders.

1. Let the provider module export its accessors past the fast-refresh lint rule.
   Files: `vite.config.ts`
   Change: in `lint.overrides`, add a block `{ files: ['**/*Provider.tsx'], rules: { 'react/only-export-components': ['error', { allowConstantExport: true, allowExportNames: ['useSheetScrollContext', 'useSheetAboveContext', 'useSheetPeekContext', 'useUnstableSheetScrollContext', 'useUnstableSheetAboveContext', 'useUnstableSheetPeekContext'] }] } }` after the existing `**/*.{ts,tsx}` block, so a provider module may export its accessor hooks beside the provider component.
   Check: `vp check` passes (no change to any source file yet).

2. Move the three contexts into `components/BottomSheetProvider.tsx` with `undefined` defaults, throwing accessors and unstable accessors.
   Files: new `packages/ui/src/components/BottomSheetProvider.tsx`; delete `packages/ui/src/components/sheetAboveContext.ts`, `packages/ui/src/components/sheetPeekContext.ts`, `packages/ui/src/hooks/useSheetScrollElement.ts`; `packages/ui/src/components/BottomSheet.tsx`, `packages/ui/src/lib/sheetPosition.ts`, `apps/web/src/features/map/mapPadding.ts`; new `packages/ui/tests/components/BottomSheetProvider.spec.ts`
   Change:
   - The new module holds, module-private, `SheetScrollContext` (interface from `useSheetScrollElement.ts:3-6`), `SheetAboveContext` with the exported `SheetAboveMotion` interface (from `sheetAboveContext.ts:4-12`) and `SheetPeekContext` (interface from `sheetPeekContext.ts:3-8`). Each is now `createContext<XContextValue | undefined>(undefined)`; the inert no-op defaults (`sheetAboveContext.ts:14-17`, `sheetPeekContext.ts:10-15`, `useSheetScrollElement.ts:8-11`) are deleted.
   - Per context it exports a throwing accessor and an unstable accessor, both with explicit return types:

   ```tsx
   export const useSheetScrollContext = (): SheetScrollContextValue => {
     const value = useContext(SheetScrollContext);
     if (value === undefined) {
       throw new Error('useSheetScrollContext must be used inside BottomSheetProvider');
     }
     return value;
   };

   export const useUnstableSheetScrollContext = (): SheetScrollContextValue | undefined =>
     useContext(SheetScrollContext);
   ```

   and the same pair for `useSheetAboveContext` / `useUnstableSheetAboveContext` and `useSheetPeekContext` / `useUnstableSheetPeekContext`.
   - It exports `BottomSheetProvider`, cut from `BottomSheet.tsx:21-42` with its body unchanged and typed `export const BottomSheetProvider: FC<PropsWithChildren> = (props) => …`.
   - `SHEET_ABOVE_GAP` (`sheetAboveContext.ts:19`) moves to `lib/sheetPosition.ts` as `export const SHEET_ABOVE_GAP = 12;`; `apps/web/src/features/map/mapPadding.ts:10` imports it from `@pacevault/ui/lib/sheetPosition.ts`.
   - `BottomSheetProvider.spec.ts` (`// @vitest-environment node`, `renderToString(createElement(…))` like `packages/ui/tests/hooks/useMediaQuery.spec.ts`) pins the new behaviour: a probe calling `useSheetPeekContext()` throws `'useSheetPeekContext must be used inside BottomSheetProvider'` when rendered bare; a probe rendering `String(useUnstableSheetPeekContext() === undefined)` renders `'true'` bare and `'false'` inside `BottomSheetProvider`.
   Check: `test ! -e packages/ui/src/components/sheetAboveContext.ts && test ! -e packages/ui/src/components/sheetPeekContext.ts && test ! -e packages/ui/src/hooks/useSheetScrollElement.ts`; `rg -n "createContext" packages/ui/src` prints only the three lines in `BottomSheetProvider.tsx`, each with `(undefined)`; `rg -n "export const \w+Context = createContext" packages/ui/src` prints nothing; `vp test -- --run tests/components/BottomSheetProvider.spec.ts` (from `packages/ui/`) passes.

3. Read the contexts only through the accessors.
   Files: `packages/ui/src/components/BottomSheet.tsx`, `packages/ui/src/components/SheetAbove.tsx`, `packages/ui/src/components/SheetPeek.tsx`, `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/components/layout/Dock.tsx`, `apps/web/src/features/sessions/SessionList.tsx`
   Change:
   - `BottomSheet.tsx:53-55` `useContext(SheetScrollContext).register`, `useContext(SheetPeekContext)`, `useContext(SheetAboveContext).registerMotion` → `useSheetScrollContext().register`, `useSheetPeekContext()`, `useSheetAboveContext().registerMotion` (throwing: `BottomSheet` only renders inside the provider).
   - `SheetAbove.tsx:7` `const sheet = useContext(SheetAboveContext).motion;` → `const sheet = useUnstableSheetAboveContext()?.motion ?? null;`; import `SHEET_ABOVE_GAP` from `../lib/sheetPosition.ts`.
   - `SheetPeek.tsx:13-19` → `const peek = useUnstableSheetPeekContext();`, `const setActive = peek?.setActive;` and the effect body starts with `if (setActive === undefined) return;` before `setActive(true); return () => setActive(false);`; the guard at `:21` becomes `if (peek === undefined || !peek.target)`.
   - All three import from `./BottomSheetProvider.tsx` and drop `useContext`. `AppLayout.tsx:11` imports `BottomSheetProvider` from `@pacevault/ui/components/BottomSheetProvider.tsx` (and `BottomSheet` still from `BottomSheet.tsx`).
   - `Dock.tsx:10,22` and `SessionList.tsx:6,14` replace `useSheetScrollElement()` with `useUnstableSheetScrollContext()?.element ?? null`, imported from `@pacevault/ui/components/BottomSheetProvider.tsx`.
   Check: `rg -n "useContext\(" packages/ui/src apps/web/src` prints only the six accessor lines in `BottomSheetProvider.tsx`; `rg -n "useSheetScrollElement" apps packages --glob '!node_modules'` prints nothing; `rg -n "useSheet(Scroll|Above|Peek)Context\(" apps/web/src packages/ui/src --glob '!**/BottomSheetProvider.tsx'` prints only the three lines in `BottomSheet.tsx`; green; `vp run e2e` passes (desktop dock and peeks, mobile sheet, peek and map controls above the sheet).

4. Warn when a sheet-only component renders nothing because no sheet is mounted.
   Files: `packages/ui/src/components/SheetAbove.tsx`, `packages/ui/src/components/SheetPeek.tsx`; new `packages/ui/tests/components/SheetPeek.spec.ts`, `packages/ui/tests/components/SheetAbove.spec.ts`
   Change: where the unstable accessor returns `undefined` (no `BottomSheetProvider` above, i.e. every desktop render), log before returning `null`: in `SheetAbove.tsx` split the guard into `if (context === undefined) { console.warn('SheetAbove rendered outside BottomSheetProvider; nothing is shown.'); return null; }` followed by the existing `if (!sheet) return null;` (motion not registered yet inside the provider stays silent); in `SheetPeek.tsx` the same `console.warn('SheetPeek rendered outside BottomSheetProvider; nothing is shown.')` in the `peek === undefined` branch, the `!peek.target` branch stays silent. Behaviour change (owner-accepted): one console warning per desktop render of the map controls and of each peek.
   Check: each new spec (`// @vitest-environment node`) spies on `console.warn` with `vi.spyOn(console, 'warn').mockImplementation(() => {})`, renders the component bare with `renderToString`, and asserts `toHaveBeenCalledWith('SheetPeek rendered outside BottomSheetProvider; nothing is shown.')` (resp. `SheetAbove …`) and an empty render; rendered inside `BottomSheetProvider` it asserts `not.toHaveBeenCalled()`; `vp run test` passes.

## Open items

- R4 (return an inert default instead of throwing) is replaced by R3 and R5: the contexts default to `undefined`, `use<Name>Context` throws, and callers that legitimately render outside the provider read `useUnstable<Name>Context` and handle `undefined`.
- Item 4 holds the warn-on-degraded-render rule because its only subjects are the two components that read these contexts through the unstable accessors; no other plan owns them.
- R7's second clause (split state from the actions that change it into separate contexts) is not part of this plan: splitting `SheetPeekContext` (`target`/`active` vs. `registerTarget`/`setActive`) and the other two changes which consumers re-render when the provider's state changes (follow-up: backlog item conventions-follow-ups).
- The accessors are an exception to one-hook-per-file R1 (several hooks in one module, owner decision); that record states it too.
- The provider moves into `components/pvBottomSheet/PvBottomSheetProvider.tsx` (exported as `PvBottomSheetProvider`) when the component-directory-and-file-naming plan runs; the `allowExportNames` entries in item 1 keep working because they match export names, not paths. The new specs under `packages/ui/tests/components/` move with their subjects.
- Once `apps/web` declares its first context, re-run `rg -n "createContext|useContext" apps/web/src` and bring that context in line in the same change.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
