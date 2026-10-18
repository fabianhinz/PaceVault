import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { planFrontmatterSchema } from '../../../scripts/workbenchFrontmatter.ts';

// WB_ROOT: a fixture workbench for tests; the dev server watches these files and reloads the
// board after every change, from the board's own writes or from an agent.
const base = process.env.WB_ROOT ?? '..';
const folderId = (options: { entry: string }) => options.entry.split('/')[0];

const plans = defineCollection({
  loader: glob({ pattern: ['*/plan.md', '!site/**', '!_*/**'], base, generateId: folderId }),
  schema: planFrontmatterSchema,
});

const techs = defineCollection({
  loader: glob({ pattern: ['*/tech.md', '!site/**', '!_*/**'], base, generateId: folderId }),
});

/** ideas.md, flaky.md and every review/findings.md: watched so a write reloads the board. */
const notes = defineCollection({
  loader: glob({ pattern: ['ideas.md', 'flaky.md', '*/review/findings.md'], base }),
});

export const collections = { plans, techs, notes };
