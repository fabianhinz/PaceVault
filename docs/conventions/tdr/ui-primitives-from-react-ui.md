---
kind: pattern-apply-tdr-reference
id: ui-primitives-from-react-ui
title: UI elements come from the @pacevault/ui kit
summary: apps/web and the workbench board render UI with @pacevault/ui components, the kit renders its own text through Typography, nothing outside the kit imports @radix-ui/* directly, and a missing primitive or variant is added to the kit first.
governs:
  - "apps/web/src/**/*.tsx"
  - "packages/ui/src/components/**/*.tsx"
  - "tools/workbench/site/src/**/*.tsx"
  - "tools/workbench/site/src/**/*.ts"
adopted_rules: [R1, R3, R5, R6]
adopted: 2026-10-23
---

> This is this project's own TDR reference, not a knowledge-base record. `kind: pattern-apply-tdr-reference` and the missing `dimension`/`status`/`stack`/`moduleKind`/`appliesTo`/`exemplars`/`extracted`/`requires` fields are deliberate — a kb tool pointed at this file by mistake must fail loudly rather than silently absorb it as a new record. `governs` carries the routing information `appliesTo` would have, under a name no kb tool reads, so the deliberate schema mismatch survives: take its globs from this file's own Section 3 `include` lists, already rewritten to this target's paths. It is what puts this record on the right line of `docs/conventions/CLAUDE.md`; a record with an empty `governs` is invisible there. It carries no reference to whatever shared knowledge base or other project it was originally drawn from — no source project, no source record, no prose naming either. That identity was a live-session working concern during generation, not something this project's own delivered files carry. What follows is this project's own convention, full stop.

> Anywhere the text below still embeds a source project's own raw parameter — a product prefix, a specific module or identifier name — instead of a structural pattern, it has been rewritten to this project's resolved value, the same adaptation the rule text always gets. No source project's parameter is left in this file, even inside a reference example or a forbidden-practice bullet.

# UI elements come from the @pacevault/ui kit

## 1. Context

This file carries rules R1, R3, R5 and R6.

Rendered UI in `apps/web` is assembled from the workspace kit `@pacevault/ui` (`packages/ui/src/components/`: `Button`, `DialogRoot`/`DialogContent`/…, `Tabs`/`TabsList`/`TabsTrigger`, `SelectRoot`/…, `RadioGroup`, `Checkbox`, `Switch`, `Input`, `Slider`, `Chip`, `Card`, …). Radix is the substrate the kit is built on and stays inside it: `apps/web` never imports a `@radix-ui/*` primitive. A primitive the kit does not wrap yet is wrapped in `packages/ui` first, then rendered from there. Reaching past the kit silently forks the visual language, because the kit wrapper is where tokens, sizing, states and accessibility defaults are applied. Icons stay direct `lucide-react` imports.

Scope: rendered modules under `apps/web/src` and the workbench board (`tools/workbench/site/src`, including the DOM its scripts build, which mounts kit components through `createRoot`). Inside `packages/ui`, R1 applies to the kit's own text: an element whose type classes a `Typography` variant and colour express renders through `Typography` (`as` takes the element or the Radix part); form fields, labels and containers whose type size no variant expresses keep their classes. Importing Radix directly is the kit's whole point, so R3 does not reach `packages/ui`. Tests are out of scope.

Accepted exception (owner, 2026-10-26): five controls are built in `apps/web` from kit parts and plain elements because they are specific to one feature, not part of the shared visual language, so R1 and R5 do not move them into the kit: `StepButton` (`components/sessions/session/StepButton.tsx`), `TripFormDialog` (`components/trips/TripFormDialog.tsx`), `PaceEstimateButton` (`components/settings/PaceEstimateButton.tsx`), `StudioColorPicker` (`components/studio/StudioColorPicker.tsx`) and `StudioMarkerPins` (`components/studio/markers/StudioMarkerPins.tsx`). They stay feature components in `components/<feature>/`. A sixth control of the same kind is not covered by this list; it goes through R5.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | Render a UI element with the `@pacevault/ui` component when the kit exports one for that purpose; import it from `@pacevault/ui/components/<Name>.tsx`. | manual |
| R3 | Never import from `@radix-ui/*` in `apps/web`. A primitive the kit does not export yet is added to `@pacevault/ui` first (wrapped in `packages/ui/src/components/`, styled with Tailwind) and imported from there. | manual |
| R5 | Before adding a new locally built primitive in `apps/web`, check `packages/ui/src/components/`; if the primitive belongs to the shared visual language, add it to the kit rather than to the app. | manual |
| R6 | When the kit lacks a needed variant of a component it already owns, extend that component in `packages/ui` (a `variant` prop, a new size) rather than dropping to the Radix original beside it. | manual |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "<(button|input|select|textarea)\\b|innerHTML = '<button"
  include: ["apps/web/src/**/*.tsx", "tools/workbench/site/src/**/*.tsx", "tools/workbench/site/src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Hidden file inputs (`type="file"`), map markers and swatch pickers that no kit component
    covers are legitimate app-bound controls; each hit is a review prompt for R1/R5/R6, not a
    verdict. The kit's own Typography use is not grep-checkable: in packages/ui review raw
    text-(xs|sm|base|lg) classes against the Typography variants by hand.
R3:
  type: grep
  pattern: "from '@radix-ui/"
  include: ["apps/web/src/**/*.tsx", "apps/web/src/**/*.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    None known. A `@radix-ui/*` entry in `apps/web/package.json` is the same finding one step
    earlier; `rg -n "@radix-ui" apps/web/package.json` catches it.
R5:
  type: manual
  reason: "'Belongs to the shared visual language' is a design judgement, not a property of a file. The five controls listed in §1 are accepted exceptions."
  enforcedBy: null
R6:
  type: manual
  reason: >
    Comparing a local requirement against a kit component's prop surface; no single-file pattern
    distinguishes a kit component extended with a variant from a call site that overrides its look
    with local classes. R3's grep catches the Radix bypass, not the class override.
  enforcedBy: null
```

## 4. Trade-offs

- **Good, because** the visual language lives in one package: a token, spacing or state change lands once and propagates, instead of being chased through call sites.
- **Good, because** the `@pacevault/ui` import path makes the boundary readable in the import block — a reviewer sees at a glance which parts of a file are kit surface and which are raw substrate.
- **Good, because** accessibility and interaction defaults are decided once, inside the wrapper, rather than re-derived by whoever reaches for the Radix primitive next.
- **Bad, because** a wrapper layer means permanently chasing upstream: every Radix bump has to be absorbed by the kit, and each wrapper's prop surface is a narrower, hand-maintained subset that lags the original.
- **Bad, because** the lag has no escape hatch: dropping to the Radix primitive for the one case the wrapper does not cover is ruled out by R3, so the kit has to grow (R6) before the app can ship the case, and nothing but review checks that it grew the right way.
- **Neutral, because** the kit is the only Radix consumer: a primitive the app needs for the first time costs a kit change before the app can use it, and any Radix import in `apps/web` is a finding.

## 5. Reference implementation

```tsx
import { Tabs, TabsList, TabsTrigger } from '@pacevault/ui/components/Tabs.tsx';

export const LoadChart: FC = () => (
  <Tabs value={groupBy} onValueChange={onGroupByChange} className="h-full">
    <TabsList variant="inline">
      {groupByTabs.map((tab) => (
        <TabsTrigger key={tab.key} value={tab.key} className="flex-none gap-1 rounded-lg px-2 py-1 text-xs">
          {tab.label()}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);
```

The `variant="inline"` prop is the R6 move: the kit's `TabsList` grew the compact look the chart needed instead of the chart importing `@radix-ui/react-tabs` to bypass it.

## 6. Forbidden practices

- ❌ Importing any Radix primitive in `apps/web`. The wrapper is where the tokens and states live; a primitive without one gets one in `packages/ui` first.
- ❌ Re-implementing a kit component locally — an app-level `Button`, `Dialog` or tab bar built on Radix or raw elements forks the visual language without announcing it.
- ❌ Working around a wrapper's missing prop by rendering the Radix original beside it — extend the kit component instead.
- ❌ A kit element writing `text-sm font-medium text-text-primary` by hand where `Typography` has that variant and colour (R1 inside the kit).
- ❌ A hand-built segmented switch (`role="group"` with `aria-pressed` buttons) on the board where the kit's `SegmentedControl` covers it.
