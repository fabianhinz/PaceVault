import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { planFrontmatterSchema } from '../../scripts/frontmatter.ts';

// WB_ROOT: a fixture workbench for tests; the dev server watches these files and reloads the
// board after every change, from the board's own writes or from an agent.
const base = process.env.WB_ROOT ?? '../backlog';
const folderId = (options: { entry: string }) => options.entry.split('/')[0];

const plans = defineCollection({
  loader: glob({ pattern: ['*/plan.md', '!_*/**'], base, generateId: folderId }),
  schema: planFrontmatterSchema,
});

const techs = defineCollection({
  loader: glob({ pattern: ['*/tech.md', '!_*/**'], base, generateId: folderId }),
});

/** flaky.md and every review/findings.md and review/decisions.md: watched so a write reloads the board. */
const notes = defineCollection({
  loader: glob({ pattern: ['flaky.md', '*/review/findings.md', '*/review/decisions.md'], base }),
});

/** tools/workbench/GUIDE.md (outside the backlog): watched so an edit reloads the board. */
const guide = defineCollection({
  loader: glob({ pattern: 'GUIDE.md', base: '..' }),
});

export const collections = { plans, techs, notes, guide };
