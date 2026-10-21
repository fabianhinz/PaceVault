# Interfaces · workbench-flow

Generated 2026-10-21 by `vp run workbench:deps -- workbench-flow` from the TypeScript files changed since the base (as `files.json`): 6 planned, 0 not planned. The checker's types; compare with tech.md `## Interfaces`, the planned record.

```ts
// tools/workbench/scripts/frontmatter.ts
export const STATUSES: readonly ["idea", "exploring", "planned", "ready", "in-dev", "in-review", "done"];
export type Status = (typeof STATUSES)[number];
export const PLAN_CHECKS: "Real-data checks";
export const DECISIONS: "Agent decisions";
export type CheckHeading = typeof PLAN_CHECKS | typeof DECISIONS;
export const ITEM_TYPES: readonly ["feature", "bug", "chore"];
export type ItemType = (typeof ITEM_TYPES)[number];
export const AREAS: readonly ["app", "engine", "gpx", "ui", "i18n", "testing", "workbench", "docs", "repo", "skills"];
export const planFrontmatterSchema: z.ZodObject<{
  title: z.ZodString;
  status: z.ZodEnum<{ idea: "idea"; exploring: "exploring"; planned: "planned"; ready: "ready"; "in-dev": "in-dev"; "in-review": "in-review"; done: "done"; }>;
  created: z.ZodUnion<readonly [z.ZodString, z.ZodPipe<z.ZodDate, z.ZodTransform<string, Date>>]>;
  'depends-on': z.ZodOptional<z.ZodArray<z.ZodString>>;
  type: z.ZodOptional<z.ZodEnum<{ feature: "feature"; bug: "bug"; chore: "chore"; }>>;
  areas: z.ZodOptional<z.ZodArray<z.ZodEnum<{ app: "app"; engine: "engine"; gpx: "gpx"; ui: "ui"; i18n: "i18n"; testing: "testing"; workbench: "workbench"; docs: "docs"; repo: "repo"; skills: "skills"; }>>>;
  next: z.ZodString;
  size: z.ZodOptional<z.ZodEnum<{ small: "small"; }>>;
}, z.core.$strip>;
export type PlanFrontmatter = z.infer<typeof planFrontmatterSchema>;
export const planBody: (text: string) => string;
export const parseFrontmatter: (text: string) => unknown;
export const readStatus: (text: string) => string | undefined;
export const readSize: (text: string) => string | undefined;
export const sectionTokens: (text: string, heading: string) => Token[];
export type CheckItem = { text: string; checked: boolean; superseded: boolean; raw: string };
export const SUPERSEDED_BY: RegExp;
export const readChecks: (text: string, heading: CheckHeading) => CheckItem[];
export const isOpenCheck: (item: CheckItem) => boolean;
export const DECISION_KIND: RegExp;
export const decisionsWithoutKind: (before: string | undefined, after: string) => string[];
export type Question = {
  id: string;
  state: 'open' | 'answered';
  date?: string;
  text: string;
  quote?: string;
  raw: string;
};
export const readQuestions: (text: string) => Question[];
export type TechPaths = { added: string[]; changed: string[] };
export type TechEntry = { path: string; note: string };
export const readTechEntries: (tech: string) => { added: TechEntry[]; changed: TechEntry[]; };
export const readTechPaths: (tech: string) => TechPaths;
export const PAST_READY: readonly ("idea" | "exploring" | "planned" | "ready" | "in-dev" | "in-review" | "done")[];
export const checkPlan: (folder: string, plan: string, hasTech: boolean) => string[];
export const checkMockupDecisions: (folder: string, plan: string, mockupHtml: string) => string[];
```

```ts
// tools/workbench/scripts/statusGuard.ts
export const hookInputSchema: z.ZodObject<{
  tool_name: z.ZodString;
  tool_input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type HookInput = z.infer<typeof hookInputSchema>;
export const decide: (input: HookInput, currentText: string | undefined) => string | undefined;
```

```ts
// tools/workbench/site/src/app/ItemCard.tsx
export const ItemCard: (props: {
  item: BoardItem;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) => JSX.Element;
```

```ts
// tools/workbench/tests/boardRead.spec.ts
// no exports
```

```ts
// tools/workbench/tests/frontmatter.spec.ts
// no exports
```

```ts
// tools/workbench/tests/statusGuard.spec.ts
// no exports
```
