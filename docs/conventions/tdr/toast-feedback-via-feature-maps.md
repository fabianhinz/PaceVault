---
kind: pattern-apply-tdr-reference
id: toast-feedback-via-feature-maps
title: Transient feedback declared in feature-scoped toast maps
summary: Each feature declares its toast content in one <feature>Toasts.ts map of message, variant and key, and call sites pass a map entry rather than writing content inline.
governs:
  - "src/features/**/*Toasts.ts"
  - "src/features/**/*.ts"
  - "src/features/**/*.tsx"
  - "src/components/ui/toast/**"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-09-17
---

# Transient feedback declared in feature-scoped toast maps

## 1. Context

This file carries R1–R6.

Transient feedback — an upload finished, a route could not be parsed, a trip was deleted — is declared once per feature in a map rather than assembled at the call site. Without it the same outcome is announced with slightly different wording from two places, the variant is chosen by whoever wrote the call, and there is no one place to read what a feature tells the user.

This record is adapted onto this project's own toast store and onto Paraglide. An entry's `message` is a message *function* from the generated Paraglide module, not a string: the wording lives in `messages/*.json`, where `messages/CLAUDE.md` governs its tone and its placeholders, and the map owns only which message goes with which outcome, in which variant, under which key. Inlining English strings into a map would move translated copy out of Paraglide and is a violation, not a simplification.

Scope: feature-level user feedback. Out of scope: developer-facing errors thrown or logged, and the progress toast the upload flow drives through `upsertProgress`, which carries live counters rather than declared content.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Declare a feature's toast content in a module named `<feature>Toasts.ts`, exporting a single SCREAMING_SNAKE constant object closed with `satisfies ToastMap`. | manual |
| R2 | Place a feature's map in that feature's own directory; only content reused across unrelated features belongs in the one app-wide map at the source root. | manual |
| R3 | Give every entry exactly `message`, `variant` and `key`, where `message` is a Paraglide message function, and `key` is the literal `<MAP_CONSTANT_NAME>_<entryKey>`. | manual |
| R4 | Take `variant` from the closed union the toast store exports (`MessageToastItem['variant']`); never introduce a new variant string at the declaration site. | proposed |
| R5 | Enqueue by passing a map entry — or a spread of one, when a call needs to add a per-invocation field such as a specific id or a longer description. Do not write message content inline at the call site. | manual |
| R6 | Enqueue through the toast store's own path — its exported `toast(...)` wrapper or `useToastStore.getState().addToast(...)`. Never push a toast by writing `useToastStore.setState` directly. | proposed |

## 3. Detection

```yaml
R1:
  type: glob
  pattern: "each src/features/*/ with user feedback has a <feature>Toasts.ts exporting one SCREAMING_SNAKE constant"
  include: ["src/features/*/*Toasts.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    A feature with no user feedback owes no map and fails this check trivially; run it against the
    features R5's signal reports.
R2:
  type: glob
  pattern: "no *Toasts.ts sits outside a feature directory or the source root"
  include: ["src/**/*Toasts.ts"]
  exempt: ["src/features/*/*Toasts.ts", "src/appToasts.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R3:
  type: grep
  pattern: "key: '[A-Z_]+_[a-zA-Z]+'"
  include: ["src/**/*Toasts.ts"]
  exempt: []
  violationWhen: no-match
  enforcedBy: null
  falsePositives: >
    Confirms the shape of the key literal, not that it matches its own map constant and entry key;
    compare those by reading.
R4:
  type: grep
  pattern: "variant: '(?!default|success|error|warning)"
  include: ["src/**/*Toasts.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R5:
  type: grep
  pattern: "toast\\('|addToast\\(\\{ title: '"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/**/*Toasts.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R6:
  type: grep
  pattern: "useToastStore\\.setState"
  include: ["src/**/*.ts", "src/**/*.tsx"]
  exempt: ["src/components/ui/toast/toastStore.ts"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** everything a feature tells the user is readable in one file, so a tone or variant inconsistency is visible rather than spread across call sites.
- **Good, because** the same outcome cannot be announced two ways from two places — the entry is the single declaration and the call site references it.
- **Bad, because** it adds a layer between an event and its feedback: a call site now names an entry, and the reader follows one more hop to learn what the user sees.
- **Bad, because** the wording already lives in Paraglide, so a reader chasing a message passes through two indirections — the map entry and the message key — to reach the text.
- **Neutral, because** the `key` literal duplicates the map constant's own name, which is redundant by construction and is what makes a toast dedupable by a stable identifier.

## 5. Reference implementation

`src/features/studio/studioToasts.ts`:

```ts
import { m } from '@/paraglide/messages.js';
import type { ToastMap } from '@/components/ui/toast/types.ts';

export const STUDIO_TOASTS = {
  gpxImported: {
    message: m.studio_gpx_imported,
    variant: 'success',
    key: 'STUDIO_TOASTS_gpxImported',
  },
  gpxParseFailed: {
    message: m.studio_gpx_parse_failed,
    variant: 'error',
    key: 'STUDIO_TOASTS_gpxParseFailed',
  },
} satisfies ToastMap;
```

A call site references an entry, and spreads it where it needs one more field:

```ts
const entry = STUDIO_TOASTS.gpxImported;
toast(entry.message(), undefined, entry.variant, entry.key);
```

## 6. Forbidden practices

- ❌ A literal message written at the call site — the wording then lives outside Paraglide and outside the map.
- ❌ An English string as an entry's `message`; it must be a Paraglide message function, or the copy leaves the translation system.
- ❌ A variant string invented at the declaration site rather than taken from the store's closed union.
- ❌ A feature's map placed in the app-wide module because it was convenient; only cross-feature content belongs there.
- ❌ A `key` that does not spell `<MAP_CONSTANT_NAME>_<entryKey>`; the point is that it is derivable and stable, not that it is unique.
- ❌ Two entries for the same outcome in two features' maps.
- ❌ Pushing a toast by writing the store's state directly.
