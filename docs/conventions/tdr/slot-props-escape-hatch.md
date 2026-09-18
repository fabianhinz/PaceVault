---
kind: pattern-apply-tdr-reference
id: slot-props-escape-hatch
title: One slotProps object is the escape hatch to inner parts
summary: A catalogue component that renders inner parts a caller cannot otherwise reach exposes exactly one optional slotProps object keyed by part, instead of a drip of one-off part props.
governs:
  - "src/components/ui/**/types.ts"
  - "src/components/ui/**/*.tsx"
adopted_rules: [R1, R2, R3, R4, R5, R6]
adopted: 2026-09-17
---

# One slotProps object is the escape hatch to inner parts

## 1. Context

This file carries R1–R6.

A shared component renders elements the caller never named — a row, a wrapper, a label, an icon frame — and sooner or later a caller needs to reach one of them. Without a single agreed door, that pressure escapes as a drip of one-off top-level props (`rowClassName`, `labelVariant`, `contentProps`), each of which permanently enlarges the component's public surface and tells the reader nothing about what the component means. The component's own props say what the component **means**; how its parts are configured lives behind one named door.

The bar for opening that door is higher here than in the published library this convention came from. PaceVault's catalogue is in-repo: a caller can change the component, and usually should. `slotProps` is for the case where several unrelated callers each need a different configuration of the same inner part — not for the first caller who wants one extra class.

Scope: the public prop surface of `src/components/ui/`. Feature components have one or two call sites each and are changed rather than parameterised.

## 2. Rules

| # | Rule (as adapted for this project) | Enforcement |
| :--- | :--- | :--- |
| R1 | A component that renders inner parts several callers must configure differently exposes exactly one optional `slotProps` object keyed by part. Do not add a top-level prop that configures one part (`<part><Attribute>`, `<part>Props`, `<part>ClassName`). | proposed |
| R2 | Slot keys are camelCase and name the part. `root` is reserved for the outermost rendered element. Name an inner key after the component it configures when that is unambiguous within this component, and after the part's role whenever two parts would otherwise collide or the component type does not identify the part. A key is never the exported component's own name and never PascalCase. | proposed |
| R3 | Each entry is typed from the props of the element or component that receives it, with every key the parent itself sets excluded — `children` first, then the wiring the parent owns. Derive the type with the project's `ComponentPropsOmitSafe` helper. | manual |
| R4 | Spread the consumer's entry **last** on its part, after the component's own configuration and after any forwarded rest props. A value the consumer must not override is excluded from the entry's type, not merely written after the spread. Where the parent's handler must run regardless, set it after the spread and call the consumer's handler from inside it. | proposed |
| R5 | `slotProps` is owed only when the component renders structure a caller cannot otherwise reach. It is not owed by a component that is a single element whose props it already extends, nor by a Radix wrapper whose configurable surface is the primitive's own slot API relayed through. When it is declared, every declared key must be spread onto a part — a key with no spread site is a promise the component does not keep. | manual |
| R6 | Keep `slots` and `slotProps` distinct: `slots` supplies or replaces the element rendered at a position (a node or a component type), `slotProps` configures the element the component already renders. A props bag never sits under `slots`. A component may own both; it owes neither by default. | proposed |

## 3. Detection

```yaml
R1:
  type: grep
  pattern: "^\\s+[a-z][A-Za-z0-9]*(ClassName|Props|Variant|Label)\\??:"
  include: ["src/components/ui/**/types.ts", "src/components/ui/**/*.tsx"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Matches a legitimate top-level prop whose name happens to end in one of these words — an
    `ariaLabel` or a `className` on the component's own root. Read whether the prop configures an
    inner part.
R2:
  type: grep
  pattern: "slotProps\\??: \\{[^}]*[A-Z]"
  include: ["src/components/ui/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    A camelCase key containing an inner capital (`listItem`) matches; anchor on the first character
    of each key.
R3:
  type: grep
  pattern: "slotProps\\??: \\{[\\s\\S]{0,300}: \\{ [a-z]"
  include: ["src/components/ui/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: >
    Approximate — intended to catch an entry typed as a hand-written object literal rather than
    derived from the receiving component.
R4:
  type: manual
  reason: >
    Spread order is a property of the JSX expression, and "excluded from the type rather than
    written after the spread" needs both the type and the markup read together.
  enforcedBy: null
R5:
  type: manual
  reason: >
    Whether a component owes a hatch at all, and whether every declared key has a spread site, are
    both readings of the implementation against its type.
  enforcedBy: null
R6:
  type: grep
  pattern: "slots\\??: \\{[^}]*Props"
  include: ["src/components/ui/**/types.ts"]
  exempt: []
  violationWhen: any-match
  enforcedBy: null
  falsePositives: "none known"
```

## 4. Trade-offs

- **Good, because** the component's own props keep saying what the component means, instead of accumulating a configuration surface for parts nobody named.
- **Good, because** there is one place a caller looks when they need to reach inside, and one place a reviewer looks to see what the component has promised.
- **Bad, because** in an in-repo catalogue the honest answer is often "change the component". A hatch opened too early freezes an internal structure as a public contract for no reason, and this record's own scope note is the only thing holding that line.
- **Bad, because** `slotProps` is an unfamiliar shape in a Radix codebase, where the idiomatic escape is `asChild` — a reader has to know why this project has both.
- **Neutral, because** typing each entry from the receiving component is precise and produces type expressions that are hard to read on hover.

## 5. Reference implementation

`src/components/ui/dataTable/types.ts`:

```ts
export interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  slotProps?: {
    row?: ComponentPropsOmitSafe<'tr', 'children'>;
  };
}
```

`DataTable.tsx` spreads the consumer's entry last, and keeps its own handler:

```tsx
<tr
  className={cn('border-b', props.slotProps?.row?.className)}
  {...props.slotProps?.row}
  onClick={(event) => {
    selectRow(row);
    props.slotProps?.row?.onClick?.(event);
  }}
/>
```

## 6. Forbidden practices

- ❌ `rowClassName`, `labelVariant`, `contentProps` — a top-level prop configuring one inner part, which enlarges the public surface without saying anything about the component.
- ❌ A slot key that is the component's own name, or PascalCase; keys name parts.
- ❌ An entry typed as a hand-written object literal rather than derived from the component that receives it.
- ❌ Spreading the consumer's entry before the component's own configuration, so the component silently overrides what the caller asked for.
- ❌ Writing a value after the spread to protect it, instead of excluding that key from the entry's type.
- ❌ A declared key that is never spread onto a part.
- ❌ A props bag under a `slots` key; `slots` replaces elements, `slotProps` configures them.
- ❌ Opening a hatch for the first caller who wants one extra class, in a catalogue where changing the component is available.
