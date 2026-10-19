# <Item title>: tech

<!--
Copied by item-plan next to plan.md; required from status planned on (vp run workbench:check).
Sections in this order; leave out a section that does not apply. Every diagram is Mermaid.
Paths are repo-relative and exist in the code (New: created by this item, at the path it will have).
`### New` and `### Changed` are read by tools/workbench/scripts/frontmatter.ts (readTechPaths): one
backticked path per bullet, a short note after it is fine. A folder path ends with `/`.
vp run workbench:deps -- <item> takes New (or Changed when New is empty) as the focus of the
actual import graph and compares both lists with what the code imports.
-->

## Data flow

```mermaid
flowchart LR
  source[(where the data comes from)] --> step[what transforms it]
  step --> sink[where it ends up]
```

## Modules

```mermaid
flowchart TB
  subgraph UI["UI · components, pages"]
  end
  subgraph FEAT["feature · src/features"]
  end
  subgraph STORE["store"]
  end
  subgraph LIB["lib"]
  end
  subgraph ENG["engine"]
  end
  classDef new stroke:#60a5fa,stroke-width:1.5px
  classDef mod stroke:#8b8f9a,stroke-width:2px
```

### New

- `apps/web/src/features/<feature>/<File>.tsx`: what it does

### Changed

- `apps/web/src/<path>.ts`: what changes

## Interfaces

```ts
// apps/web/src/<path>.ts
export const example: (input: Input) => Output;
```

## Components

```mermaid
flowchart TB
  Page["SomePage"] --> Feature["FeatureComponent"]
  Feature --> Card["Card"]:::ui
  classDef ui stroke:#8b8f9a,stroke-dasharray:4 3
  classDef uimod stroke:#8b8f9a,stroke-width:2px
```
