import type { ReactNode } from 'react';
import { Bug, Sparkles, Wrench, type LucideIcon } from 'lucide-react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { ItemType } from '../../../scripts/frontmatter.ts';
import { TYPE_COLOR, type Bucket } from '../lib/vocabulary.ts';

const Ring = () => (
  <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
);

/** A ring with a pie filled to `dash` of the 15.71 circumference (20 % steps). */
const Fill = (props: { dash: number }) => (
  <>
    <Ring />
    <circle
      cx="7"
      cy="7"
      r="2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeDasharray={`${props.dash} 100`}
      transform="rotate(-90 7 7)"
    />
  </>
);

/** Dashed ring → empty ring → 20/40/60/80 % fill → full. */
const SHAPES: Record<Bucket, () => ReactNode> = {
  'needs-you': () => (
    <circle
      cx="7"
      cy="7"
      r="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="1.4 1.75"
    />
  ),
  idea: () => <Ring />,
  exploring: () => <Fill dash={3.14} />,
  planned: () => <Fill dash={6.28} />,
  ready: () => <Fill dash={9.42} />,
  'in-dev': () => <Fill dash={12.57} />,
  'in-review': () => <Fill dash={15.71} />,
  done: () => <circle cx="7" cy="7" r="6.75" fill="currentColor" />,
};

/** The status as a neutral progress shape (column heads, status chip). */
export const StatusIcon = (props: { bucket: Bucket; className?: string }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true" className={cn('size-3.5 shrink-0', props.className)}>
    {SHAPES[props.bucket]()}
  </svg>
);

const TYPE_ICON: Record<ItemType, LucideIcon> = {
  feature: Sparkles,
  bug: Bug,
  chore: Wrench,
};

/** The item type in its fixed colour: feature sparkles (sky), bug (rose), chore wrench (lime). */
export const TypeIcon = (props: { type: ItemType; className?: string }) => {
  const Icon = TYPE_ICON[props.type];
  return (
    <span
      role="img"
      aria-label={props.type}
      title={props.type}
      className={cn('inline-flex shrink-0', props.className)}
      style={{ color: TYPE_COLOR[props.type] }}
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </span>
  );
};
