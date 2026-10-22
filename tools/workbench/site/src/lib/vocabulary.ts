import type { ItemType, Status } from '../../../scripts/frontmatter.ts';

/**
 * The board's words and fixed colours, shared by the server (`board.ts`) and the React island:
 * no node imports here.
 */

export type Bucket = Status | 'needs-you';

export const LABELS: Record<Bucket, string> = {
  'needs-you': 'Needs you',
  idea: 'Idea',
  exploring: 'Exploring',
  planned: 'Planned',
  ready: 'Ready',
  'in-dev': 'In dev',
  'in-review': 'In review',
  done: 'Done',
};

/** Fixed colours of the item types (card and panel icon): feature sky, bug rose, chore lime. */
export const TYPE_COLOR: Record<ItemType, string> = {
  feature: '#38bdf8',
  bug: '#fb7185',
  chore: '#a3e635',
};

export const SLOTS = ['mockup', 'plan', 'tech', 'review'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_LABEL: Record<Slot, string> = {
  mockup: 'Mockup',
  plan: 'Plan',
  tech: 'Tech',
  review: 'Review',
};

/** Why a card waits on the owner (Q2), in the order of the Needs you groups; in-review cards have their own column (R1). */
export const REASONS = ['questions', 'decisions', 'findings'] as const;
export type Reason = (typeof REASONS)[number];

export const REASON_LABEL: Record<Reason, string> = {
  questions: 'Open questions',
  decisions: 'Agent decisions',
  findings: 'Open findings',
};

/** The panel tab an entry opens on (Q8): questions live in the Plan, the rest in the Review. */
export const REASON_TAB: Record<Reason, Slot> = {
  questions: 'plan',
  decisions: 'review',
  findings: 'review',
};
