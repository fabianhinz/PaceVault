---
id: snackbar-feedback-via-feature-maps
tdr_reference: tdr/snackbar-feedback-via-feature-maps.md
depends_on: [signature-parameter-shape, formatting-through-intl-namespace]
generated: 2026-10-23
---

# Transient feedback declared in feature-scoped snackbar maps

Read `tdr/snackbar-feedback-via-feature-maps.md` first — the binding rule text, detection signals, and reference implementation live there, not here. This file is only the checklist for getting this target from its current state to that rule.

## Depends on

- [`signature-parameter-shape`](signature-parameter-shape.md) — gives `importFiles` its `({ files, profile }, queryClient)` shape, which item 4 extends with the trailing snackbar handle.
- [`formatting-through-intl-namespace`](formatting-through-intl-namespace.md) — turns the GPX import toasts into `formatPlural` calls over the renamed `toast_gpx_import_*_one`/`_other` keys (named so by user-facing-strings-in-copy-modules, which it depends on); item 5 wraps those calls.

## Changes

Behaviour change accepted by the owner: every entry's `key` becomes the toast `id`, and `addToast` (`apps/web/src/store/toast.ts:15-21`) drops a toast whose `id` is already on screen. Toasts that stack today are deduplicated while the first is visible: export failed, no GPS to export, edit-in-studio failed, save failed, GPX import succeeded, all data deleted. The file-drop hint and the GPX import failure were already deduplicated and stay so under their new keys. The toast `data-testid` (`packages/ui/src/components/Toast.tsx:47`, the toast id) changes with the key, so the e2e selector follows (item 5). Every item's Check includes a clean `vp run check` and a green `vp run test`. Call sites are named by their statement text; earlier plans moved line numbers.

1. Add the snackbar types.
   Files: new `apps/web/src/lib/snackbar.ts`
   Change: create the module with exactly this content, importing `ToastItem` from the module `apps/web/src/store/toast.ts` imports it from (today `@pacevault/ui/components/Toast.tsx`):

   ```ts
   import type { ToastItem } from '@pacevault/ui/components/Toast.tsx';

   export type SnackbarVariant = NonNullable<ToastItem['variant']>;

   export interface SnackbarEntry {
     key: string;
     message: () => string;
     description?: () => string;
     variant: SnackbarVariant;
     persistent?: boolean;
   }

   export interface CountedSnackbarEntry extends Omit<SnackbarEntry, 'message'> {
     message: (inputs: { count: string }) => string;
   }

   export type SnackbarMap = Record<string, SnackbarEntry | CountedSnackbarEntry>;
   ```

   Check: `vp check` passes; `rg -n "^export" apps/web/src/lib/snackbar.ts` prints the four exports.

2. Add the `useSnackbar` hook over the toast store.
   Files: new `apps/web/src/lib/hooks/useSnackbar.ts`, new `apps/web/tests/lib/hooks/useSnackbar.spec.ts`
   Change: the hook returns one module-level object, so its identity is stable across renders and it calls the store through `getState()` (`apps/web/CLAUDE.md` § App Rules, store actions):

   ```ts
   import { useToastStore } from '@/store/toast.ts';
   import type { SnackbarEntry } from '@/lib/snackbar.ts';

   export interface Snackbar {
     enqueueSnackbar: (entry: SnackbarEntry) => void;
     closeSnackbar: (key: string) => void;
   }

   const enqueueSnackbar = (entry: SnackbarEntry): void => {
     useToastStore.getState().addToast({
       id: entry.key,
       title: entry.message(),
       description: entry.description?.(),
       variant: entry.variant,
       persistent: entry.persistent,
     });
   };

   const closeSnackbar = (key: string): void => {
     useToastStore.getState().removeToast(key);
   };

   const SNACKBAR: Snackbar = { enqueueSnackbar, closeSnackbar };

   export const useSnackbar = (): Snackbar => SNACKBAR;
   ```

   The spec (`describe('useSnackbar', ...)`, mounted with `renderHookWithProviders` from `@testUtils/render.ts`, `useToastStore.setState({ toasts: [] })` in `beforeEach`, entries built inline as `SnackbarEntry` values) pins the new behaviour: `it('shows an entry under its key', ...)` enqueues `{ key: 'TEST_SNACKBARS_saved', message: () => 'Saved', variant: 'success' }` and expects `useToastStore.getState().toasts` `toEqual([{ id: 'TEST_SNACKBARS_saved', title: 'Saved', description: undefined, variant: 'success', persistent: undefined }])`; `it('drops a second entry with the same key while the first is shown', ...)` enqueues the same entry twice and expects `toHaveLength(1)`; `it('closes an entry by its key', ...)` enqueues, calls `closeSnackbar('TEST_SNACKBARS_saved')` and expects `toHaveLength(0)`.
   Check: `vp test -- --run tests/lib/hooks/useSnackbar.spec.ts` (from `apps/web/`) passes, all three cases.

3. Declare the snackbar maps.
   Files: new `apps/web/src/commonSnackbars.ts`, new `apps/web/src/features/sessions/sessionsSnackbars.ts`, new `apps/web/src/features/studio/studioSnackbars.ts`, new `apps/web/src/features/settings/settingsSnackbars.ts`
   Change: one SCREAMING_SNAKE map per module, closed with `satisfies SnackbarMap`, every `key` the literal `<MAP_CONSTANT_NAME>_<entryKey>`, every `message`/`description` an `m.*` reference (`import { m } from '@pacevault/i18n/messages.js';`). `export failed` is raised by sessions and studio, so it is common; everything else belongs to one feature.

   ```ts
   export const COMMON_SNACKBARS = {
     exportFailed: { key: 'COMMON_SNACKBARS_exportFailed', message: m.toast_export_failed, variant: 'error' },
   } satisfies SnackbarMap;

   export const SESSIONS_SNACKBARS = {
     dropHint: { key: 'SESSIONS_SNACKBARS_dropHint', message: m.toast_drop_hint, variant: 'default', persistent: true },
     saveFailed: {
       key: 'SESSIONS_SNACKBARS_saveFailed',
       message: m.toast_save_failed_title,
       description: m.toast_save_failed_desc,
       variant: 'error',
     },
     exportNoGps: { key: 'SESSIONS_SNACKBARS_exportNoGps', message: m.toast_export_no_gps, variant: 'error' },
     editInStudioFailed: {
       key: 'SESSIONS_SNACKBARS_editInStudioFailed',
       message: m.toast_edit_in_studio_failed,
       variant: 'error',
     },
   } satisfies SnackbarMap;

   export const STUDIO_SNACKBARS = {
     gpxImportSucceeded: {
       key: 'STUDIO_SNACKBARS_gpxImportSucceeded',
       message: m.toast_gpx_import_success_other,
       variant: 'success',
     },
     gpxImportFailed: {
       key: 'STUDIO_SNACKBARS_gpxImportFailed',
       message: m.toast_gpx_import_failed_other,
       variant: 'error',
     },
   } satisfies SnackbarMap;

   export const SETTINGS_SNACKBARS = {
     allDataDeleted: { key: 'SETTINGS_SNACKBARS_allDataDeleted', message: m.ui_delete_dialog_toast, variant: 'success' },
   } satisfies SnackbarMap;
   ```

   The drop hint was raised without a variant, which the viewport renders as `'default'` (`Toast.tsx:41`), so `variant: 'default'` keeps its look. The two GPX entries carry the plural message; the singular one is supplied at the call site (item 5).
   Check: `vp check` passes; `rg -n "satisfies SnackbarMap" apps/web/src` prints four hits.

4. Raise the sessions feedback through the hook.
   Files: `apps/web/src/features/sessions/hooks/useFileUpload.ts`, `apps/web/src/features/sessions/hooks/useFileDropEffect.ts`, `apps/web/src/features/sessions/session/hooks/useSessionExport.ts`, `apps/web/src/features/sessions/session/hooks/useEditInStudio.ts`
   Change: each hook binds `const snackbar = useSnackbar();` and drops its `@/store/toast.ts` import. `useFileUpload.ts`: `importFiles` gains the snackbar as a trailing handle, `importFiles({ files, profile }, queryClient, snackbar: Snackbar)`, called as `importFiles({ files: fileArray, profile }, queryClient, snackbar)`; `toast(m.toast_save_failed_title(), m.toast_save_failed_desc(), 'error');` → `snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.saveFailed);`. `useFileDropEffect.ts`: delete `DROP_TOAST_ID`; `showHint`'s `useToastStore.getState().addToast({ id: DROP_TOAST_ID, title: m.toast_drop_hint(), persistent: true })` → `snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.dropHint)`; `hideHint`'s `useToastStore.getState().removeToast(DROP_TOAST_ID)` → `snackbar.closeSnackbar(SESSIONS_SNACKBARS.dropHint.key)`; the effect's dependency list gains `snackbar` (stable). `useSessionExport.ts` and `useEditInStudio.ts`: `toast(m.toast_export_no_gps(), undefined, 'error');` → `snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.exportNoGps);`, `toast(m.toast_export_failed(), undefined, 'error');` → `snackbar.enqueueSnackbar(COMMON_SNACKBARS.exportFailed);`, both `toast(m.toast_edit_in_studio_failed(), undefined, 'error');` → `snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.editInStudioFailed);`. Drop `m` imports that become unused.
   Check: `rg -n "store/toast" apps/web/src/features/sessions` prints nothing; `vp run test` passes; `vp run e2e` passes (FIT import, export, drop journeys).

5. Raise the studio feedback through the hook.
   Files: `apps/web/src/features/studio/hooks/useGpxImport.ts`, `apps/web/src/features/studio/hooks/useStudioRouteExport.ts`, `apps/web/e2e/studio.spec.ts`
   Change: both hooks bind `const snackbar = useSnackbar();` and drop the `@/store/toast.ts` import. `useStudioRouteExport.ts`: `toast(m.toast_export_failed(), undefined, 'error');` → `snackbar.enqueueSnackbar(COMMON_SNACKBARS.exportFailed);`. `useGpxImport.ts`: each GPX toast (after the formatting plan, a `toast(formatPlural(count, { one: …, other: … }), undefined, variant[, 'gpx-import-failed'])` call inside a `> 0` guard) becomes a spread of the outcome's entry with the runtime message, e.g. `snackbar.enqueueSnackbar({ ...STUDIO_SNACKBARS.gpxImportSucceeded, message: () => formatPlural(imported, { one: () => m.toast_gpx_import_success_one({ count: String(imported) }), other: () => STUDIO_SNACKBARS.gpxImportSucceeded.message({ count: String(imported) }) }) });` and the same with `failed`, `STUDIO_SNACKBARS.gpxImportFailed` and `m.toast_gpx_import_failed_one`. The literal id `'gpx-import-failed'` goes away; singular and plural failures still share one key. In the e2e spec, `page.getByTestId('gpx-import-failed')` (`studio.spec.ts:161`) → `page.getByTestId('STUDIO_SNACKBARS_gpxImportFailed')`.
   Check: `rg -n "store/toast|gpx-import-failed" apps/web/src/features/studio apps/web/e2e` prints nothing; `vp run e2e` passes (studio GPX import, including the failed-import case).

6. Raise the settings feedback through the hook, delete the free `toast()` helper and record the convention.
   Files: `apps/web/src/features/settings/DeleteAllDataDialog.tsx`, `apps/web/src/store/toast.ts`, `apps/web/tests/store/toast.spec.ts`, `apps/web/CLAUDE.md`
   Change: in the dialog bind `const snackbar = useSnackbar();`, replace `toast(m.ui_delete_dialog_toast(), undefined, 'success');` with `snackbar.enqueueSnackbar(SETTINGS_SNACKBARS.allDataDeleted);` and drop the `toast` import. Delete the exported `toast` helper (`toast.ts:29-36`); `useToastStore`, `addToast` and `removeToast` stay. In `toast.spec.ts` delete the case `'toast helper with id deduplicates'` and the `toast` import (the store's `'addToast deduplicates by id'` case stays). In `apps/web/CLAUDE.md` § 2 App Rules add after the **Hooks** bullet: `- **Snackbars**: transient feedback is declared in a \`<feature>Snackbars.ts\` map (\`satisfies SnackbarMap\`, \`apps/web/src/lib/snackbar.ts\`; cross-feature entries in \`src/commonSnackbars.ts\`) and raised with \`useSnackbar().enqueueSnackbar(entry)\`; an entry's \`key\` is its toast id, so a shown entry is not stacked again. Feature code never writes to the toast store. Rules: \`docs/conventions/tdr/snackbar-feedback-via-feature-maps.md\`.`
   Check: `rg -n "from '@/store/toast" apps/web/src --glob '!**/components/ToastHost.tsx' --glob '!**/lib/hooks/useSnackbar.ts'` prints nothing; `rg -n "export const toast\b" apps/web/src` prints nothing; `rg -n "\*\*Snackbars\*\*" apps/web/CLAUDE.md` prints one hit; `vp run test` passes (`toast.spec.ts`, `useSnackbar.spec.ts`); `vp run e2e` passes (delete-all journey).

## Open items

- R6 of this convention (module-level `enqueueSnackbar`/`closeSnackbar` singletons of a notification library) is moot: the app has no notification library; toasts are state of the per-scope toast store (`apps/web/src/store/toast.ts`) rendered by `apps/web/src/components/ToastHost.tsx`.
- No dependency on a store restructuring: the toast store keeps its module, its actions and its `getState()` call style (owner kept per-scope stores). `ToastHost.tsx` keeps reading the store; it is the viewport, not feature code.
- Toasts raised outside the seven modules above (none today) follow the same rules when added.

## Done

Once every item in Changes checks out and you've confirmed the result is correct, delete this file — that is this plan's own defined completion state; finishing what was asked doesn't require asking permission to finish it. If `tdr_reference` is set, leave that file in place — it's durable, this plan isn't. Nothing else needs updating: `docs/conventions/CLAUDE.md` indexes the TDR references, not the plans, so it is already correct once this file is gone.
