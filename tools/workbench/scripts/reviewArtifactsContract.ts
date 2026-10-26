import { z } from 'zod';

const fileChangeSchema = z.object({
  path: z.string(),
  status: z.enum(['added', 'modified', 'deleted']),
});

export type FileChange = z.infer<typeof fileChangeSchema>;

const filesComparisonSchema = z.object({
  planned: z.array(fileChangeSchema),
  notPlanned: z.array(fileChangeSchema),
  untouched: z.array(z.string()),
});

export type FilesComparison = z.infer<typeof filesComparisonSchema>;

export const filesJsonSchema = filesComparisonSchema.extend({
  item: z.string().optional(),
  generated: z.string(),
  base: z.string(),
  ref: z.string(),
});

export type FilesJson = z.infer<typeof filesJsonSchema>;

const boundarySchema = z.object({
  rules: z.array(z.string()),
  violations: z.array(z.object({ rule: z.string(), from: z.string(), to: z.string() })),
  modules: z.number(),
  dependencies: z.number(),
});

export type Boundary = z.infer<typeof boundarySchema>;

export const depsJsonSchema = z.object({
  item: z.string().optional(),
  generated: z.string(),
  command: z.string().optional(),
  roots: z.array(z.string()).optional(),
  focus: z.array(z.string()).optional(),
  astro: z.array(z.string()).optional(),
  nodes: z.number(),
  edges: z.number(),
  added: z.array(z.string()),
  missing: z.array(z.string()),
  boundary: boundarySchema,
  components: z.object({ nodes: z.number(), edges: z.number() }).optional(),
});

export type DepsJson = z.infer<typeof depsJsonSchema>;
