---
kind: pattern-apply-tdr-reference
id: hook-directory-placement
title: A hook's directory names what it is about, not who uses it
summary: A hook lives in the hooks/ directory of the module that owns the concept it is about, regardless of how many other parts of the app call it.
governs:
  - "src/**/use*.ts"
  - "src/**/use*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6, R7, R8]
adopted: 2026-09-17
---

# A hook's directory names what it is about, not who uses it

## 1. Context

This file carries R1–R8.

Hooks are not scattered beside the components that call them: each sits in a `hooks/` directory, and which `hooks/` directory it sits in is the only thing that tells a reader where the hook belongs. Without a placement rule, a hook that several screens need gets copied, or lands in whichever directory happened to need it first, and the next reader cannot tell whether calling it from elsewhere is normal or a layering mistake.

The rule that holds here is ownership, not reach. A hook lives with the concept it is *about* — the entity it reads, the surface it drives, the capability it wraps — and that directory owns it regardless of how many other parts of the app call it. Being imported from another feature is the expected outcome of putting a hook in the right place, not a smell. The app-wide `src/hooks/` is therefore not "the shared ones"; it is the residue of hooks that are about nothing in this product — generic React, DOM, viewport and browser primitives.

This record governs *placement only*; one-hook-per-file and module size are separate records.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Place a hook in the `hooks/` directory of the module that owns the concept it is about — the entity it reads, the surface it drives, or the capability it wraps. Never place it under the module that happens to call it. | manual |
| R2 | Reserve the app-wide `src/hooks/` directory for hooks that are about no domain concept: React, DOM, browser, viewport and media-query primitives. A hook named after a domain entity belongs in that entity's directory even when every part of the app calls it. | proposed |
| R3 | Treat importing another module's hook by its full alias path as ordinary use. Cross-feature reach is not a placement error and is never a reason to copy a hook, re-export it, or move it into the app-wide directory. | manual |
| R4 | Keep server reads, server writes and routing in their own dedicated top-level directories. Those directories are hook directories in their own right; a hook of one of those kinds goes there and never into a feature `hooks/` directory, and no `hooks/` subdirectory is created inside them. | proposed |
| R5 | Nest a `hooks/` directory at whatever depth owns the concept. A sub-surface with hooks of its own gets its own `hooks/` beside its components, even when an ancestor already has one — `src/features/sessions/session/hooks/` beside `src/features/sessions/hooks/` is correct. | manual |
| R6 | A hook may sit loose beside a component only while that component, in the same directory, is its sole consumer. The first import from any other directory moves it into a `hooks/` directory. | proposed |
| R7 | A directory holds either a `hooks/` subdirectory or loose `use*` siblings, never both. Introducing `hooks/` means moving the loose siblings into it in the same change. | proposed |
| R8 | A `hooks/` directory may also hold pure non-hook modules that only its hooks use — a types module, a predicate table, a formatter. Name each for what it computes; a `helpers.ts` or `utils.ts` is not a name. | proposed |

## 3. Detection

```yaml
R1:
  type: manual
  reason: >
    "What is this hook about" is a reading of the hook's body and its name, not a path pattern.
  enforcedBy: null
R2:
  type: glob
  pattern: "every module under src/hooks/ is named for a browser, DOM, viewport or React primitive"
  include: ["src/hooks/*.ts", "src/hooks/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Requires a reader to classify each name; a hook wrapping a browser capability that happens to
    carry a product word in its name is correctly placed here.
R3:
  type: manual
  reason: >
    This rule permits something rather than forbidding it; there is nothing to match.
  enforcedBy: null
R4:
  type: glob
  pattern: "no src/features/**/hooks/ module calls useQuery, useMutation, useInfiniteQuery, useNavigate, useParams or useSearchParams"
  include: ["src/features/**/hooks/*.ts", "src/features/**/hooks/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A hook that composes a query hook without issuing a call of its own is governed by the
    server-state record, not by this one.
R5:
  type: manual
  reason: >
    Whether a nested surface owns a concept of its own is the same judgement as R1.
  enforcedBy: null
R6:
  type: glob
  pattern: "a loose use*.ts beside a component is imported only from its own directory"
  include: ["src/features/**/use*.ts", "src/features/**/use*.tsx", "src/components/**/use*.ts"]
  exempt: ["src/features/**/hooks/**"]
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Cannot see importers from the file alone — pair it with a grep for the module's basename
    across src/ and read the importing paths.
R7:
  type: glob
  pattern: "a directory containing a hooks/ subdirectory contains no loose use*.ts sibling"
  include: ["src/features/*", "src/features/*/*", "src/components/*"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
R8:
  type: glob
  pattern: "src/**/hooks/{helpers,utils,misc,common}.ts must not exist"
  include: ["src/**/hooks/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** the path answers "who owns this behaviour" without opening the file, and a hook has exactly one correct home rather than one per caller.
- **Good, because** it removes the pressure to hoist anything shared into a central directory, which is what turns an app-wide `hooks/` into a junk drawer.
- **Bad, because** ownership is a judgement call that the directory then freezes: a hook about a concept two features share has no obviously correct home, and moving it later rewrites every importer.
- **Neutral, because** it produces deep paths — `src/features/sessions/session/hooks/useSessionWeather.ts` — which is precise but long at every import site.

## 5. Reference implementation

```
src/hooks/useMediaQuery.ts                          — about the browser, nothing else
src/features/map/hooks/useMapTracks.ts              — about the map surface
src/features/sessions/session/hooks/useEditInStudio.ts  — about one session, nested one level deeper
```

`useMapTracks` being imported from `src/pages/SessionDetailPage.tsx` is ordinary use, not a reason to move it.

## 6. Forbidden practices

- ❌ Filing a domain hook under the app-wide `src/hooks/` because two features call it — reach is not ownership, and the app-wide directory then stops meaning "about nothing in this product".
- ❌ Copying a hook into a second feature rather than importing it across the boundary.
- ❌ Re-exporting a hook from a nearer directory so callers do not have to name the owning path — that is a barrel with extra steps.
- ❌ A directory with both `hooks/` and loose `use*` siblings; a reader then has to check two places for the same kind of module.
- ❌ `hooks/utils.ts` or `hooks/helpers.ts` — R8 wants the module named for what it computes.
