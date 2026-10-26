import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { ItemType, Status } from '@scripts/frontmatter.ts';

/** Shared by the server and the React island: no node imports here. */

export type Bucket = Status | 'needs-you';

export const LABEL_BY_BUCKET: Record<Bucket, string> = {
  'needs-you': 'Needs you',
  idea: 'Idea',
  exploring: 'Exploring',
  planned: 'Planned',
  ready: 'Ready',
  'in-dev': 'In dev',
  'in-review': 'In review',
  done: 'Done',
};

export const COLOR_BY_ITEM_TYPE: Record<ItemType, string> = {
  feature: tokens.typeFeature,
  bug: tokens.typeBug,
  chore: tokens.typeChore,
};

export const SLOTS = ['mockup', 'plan', 'tech', 'review'] as const;
export type Slot = (typeof SLOTS)[number];
export const LABEL_BY_SLOT: Record<Slot, string> = {
  mockup: 'Mockup',
  plan: 'Plan',
  tech: 'Tech',
  review: 'Review',
};

export const REASONS = ['questions', 'decisions', 'findings'] as const;
export type Reason = (typeof REASONS)[number];

export const LABEL_BY_REASON: Record<Reason, string> = {
  questions: 'Open questions',
  decisions: 'Agent decisions',
  findings: 'Open findings',
};

export const SLOT_BY_REASON: Record<Reason, Slot> = {
  questions: 'plan',
  decisions: 'review',
  findings: 'review',
};
