import type { FC } from 'react';
import { Bug, Sparkles, Wrench, type LucideIcon } from 'lucide-react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { ItemType } from '@scripts/frontmatter.ts';
import { COLOR_BY_ITEM_TYPE } from '@site/lib/vocabulary.ts';

const ICON_BY_ITEM_TYPE: Record<ItemType, LucideIcon> = {
  feature: Sparkles,
  bug: Bug,
  chore: Wrench,
};

interface TypeIconProps {
  type: ItemType;
  className?: string;
}

export const TypeIcon: FC<TypeIconProps> = (props) => {
  const Icon = ICON_BY_ITEM_TYPE[props.type];
  return (
    <span
      role="img"
      aria-label={props.type}
      title={props.type}
      className={cn('inline-flex shrink-0', props.className)}
      style={{ color: COLOR_BY_ITEM_TYPE[props.type] }}
    >
      <Icon className="size-3.5" aria-hidden="true" />
    </span>
  );
};
