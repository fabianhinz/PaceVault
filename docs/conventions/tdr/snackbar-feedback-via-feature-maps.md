---
kind: pattern-apply-tdr-reference
id: snackbar-feedback-via-feature-maps
title: Transient feedback declared in feature-scoped snackbar maps
summary: Toast feedback is declared once as an entry in a <feature>Snackbars.ts map closed with satisfies SnackbarMap, keyed <MAP>_<entry>, and raised with useSnackbar().enqueueSnackbar(entry); feature code never writes to the toast store.
governs:
  - "apps/web/src/**/*Snackbars.ts"
  - "apps/web/src/**/*.ts"
  - "apps/web/src/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# Transient feedback declared in feature-scoped snackbar maps

## 1. Context

This file carries rules R1–R5.

Transient user feedback — the toast raised after an import, an export, a save or a delete succeeds or fails — is declared once, as an entry in a data module, and referenced by identifier at the call site, never assembled inline where the action happens. Without this the same outcome acquires slightly different wordings, a repeated action stacks duplicate toasts because nothing gives a notification a stable identity, and the variant vocabulary drifts into free-form strings the viewport cannot style.

In this app a toast is state of the per-scope toast store (`apps/web/src/store/toast.ts`), rendered by `apps/web/src/components/ToastHost.tsx` through the kit's toast viewport. An entry's `key` is the toast `id`: `addToast` drops a toast whose `id` is already on screen, so a shown entry is not stacked again, and the `id` is also the toast's `data-testid`. The types live in `apps/web/src/lib/format/snackbar.ts`, the hook in `apps/web/src/lib/hooks/useSnackbar.ts`. Message text stays in Paraglide messages (`m.*`, user-facing-strings-in-copy-modules); singular/plural selection goes through `formatPlural` (formatting-through-intl-namespace).

Scope: feature code under `apps/web/src` that raises feedback. Out of scope: `ToastHost.tsx` and `useSnackbar.ts`, which are the only modules that read or write the toast store; text rendered into the page; error messages thrown for developers and log lines.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare notification content in a module named `<feature>Snackbars.ts`, exporting a single SCREAMING_SNAKE constant object closed with `satisfies SnackbarMap` (`apps/web/src/lib/format/snackbar.ts`). | manual |
| R2 | Place a feature's map in that feature's own directory (`apps/web/src/components/<feature>/<feature>Snackbars.ts`); only content raised by more than one feature belongs in the one app-wide map, `apps/web/src/commonSnackbars.ts`. | manual |
| R3 | Give every entry `message` (an `m.*` reference, not a called message), `variant` and `key`, where `key` is the literal `<MAP_CONSTANT_NAME>_<entryKey>`; `description` (an `m.*` reference) and `persistent` are the only optional fields. | manual |
| R4 | Take `variant` from the kit's toast union (`SnackbarVariant` = `NonNullable<ToastItem['variant']>`); never introduce a new variant string at the declaration site. | proposed |
| R5 | Raise feedback through `useSnackbar().enqueueSnackbar(entry)` — passing a map entry, or a spread of one when the call needs a runtime message (`{ ...ENTRY, message: () => … }`) — and close it with `closeSnackbar(entry.key)`. A non-hook function receives the hook's result as a trailing parameter. Never call `useToastStore` or a store helper from feature code. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^export const [A-Z][A-Z0-9_]*_SNACKBARS = \\{"
  include: ["apps/web/src/**/*Snackbars.ts"]
  exempt: []
  violationWhen: count-differs
  enforcedBy: null
  falsePositives: >
    Expect exactly one hit per *Snackbars.ts module, and a `} satisfies SnackbarMap;` closing it
    (`rg -n "satisfies SnackbarMap" apps/web/src` prints one hit per map).
R2:
  type: manual
  reason: >
    Whether content is shared across features needs the call sites: an entry in commonSnackbars.ts
    raised by only one feature, or a feature map entry raised from another feature, is the violation.
  enforcedBy: null
R3:
  type: grep
  pattern: "key: '(?![A-Z][A-Z0-9_]*_SNACKBARS_\\w+')|message: m\\.\\w+\\("
  include: ["apps/web/src/**/*Snackbars.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Needs `rg -P` for the lookahead. Does not check that the key's map prefix is the enclosing map's
    own name; read each map.
R4:
  type: grep
  pattern: "variant: '(?!default'|success'|error'|warning')"
  include: ["apps/web/src/**/*Snackbars.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Needs `rg -P`. The `satisfies SnackbarMap` clause makes `tsc` (`vp check`) reject an unknown
    variant once the maps exist; the grep is the review-time stand-in until the tooling plan records it.
R5:
  type: grep
  pattern: "from '@/store/toast(\\.ts)?'"
  include: ["apps/web/src/**/*.ts", "apps/web/src/**/*.tsx"]
  exempt: ["apps/web/src/components/ToastHost.tsx", "apps/web/src/lib/hooks/useSnackbar.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

Nothing in the root `vite.config.ts` lint block covers any of this; every entry is review-time with `enforcedBy: null`.

## 4. Trade-offs

- **Good, because** each outcome has one wording, found by its constant, and a test or a reviewer reads the feedback a feature can give in one file.
- **Good, because** the key gives every notification a stable identity, so a repeated failure does not stack copies of the same toast.
- **Bad, because** identical feedback raised twice in quick succession is shown once; a user who repeats an action while its toast is visible gets no second confirmation.
- **Bad, because** a message with runtime values (a count) cannot live in the map whole; the call site spreads the entry and supplies the message, which is more verbose than an inline call.
- **Neutral, because** the hook is a thin layer over the existing toast store; the store's shape and its viewport are unchanged.

## 5. Reference implementation

```ts
export interface SnackbarEntry {
  key: string;
  message: () => string;
  description?: () => string;
  variant: SnackbarVariant;
  persistent?: boolean;
}

export const SESSIONS_SNACKBARS = {
  exportNoGps: { key: 'SESSIONS_SNACKBARS_exportNoGps', message: m.toast_export_no_gps, variant: 'error' },
  dropHint: { key: 'SESSIONS_SNACKBARS_dropHint', message: m.toast_drop_hint, variant: 'default', persistent: true },
} satisfies SnackbarMap;
```

```ts
const snackbar = useSnackbar();

if (gpxString === null) {
  snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.exportNoGps);
  return;
}

snackbar.enqueueSnackbar({
  ...STUDIO_SNACKBARS.gpxImportSucceeded,
  message: () =>
    formatPlural(imported, {
      one: () => m.toast_gpx_import_success_one({ count: String(imported) }),
      other: () => STUDIO_SNACKBARS.gpxImportSucceeded.message({ count: String(imported) }),
    }),
});
```

## 6. Forbidden practices

- ❌ `useToastStore.getState().addToast({ title: m.x(), variant: 'error' })` in feature code — raise a map entry through `useSnackbar()`.
- ❌ A message called in the map (`message: m.toast_export_failed()`) — it freezes the locale at module load; store the reference.
- ❌ A hand-written key (`'export-failed'`) or a key that does not start with its map's constant name — the key is the toast's identity and must be unique and traceable.
- ❌ A variant string outside the kit's toast union.
- ❌ A feature-specific entry in `commonSnackbars.ts`, or one feature importing another feature's map.
- ❌ A second map in the same `*Snackbars.ts` module, or a map without `satisfies SnackbarMap`.
