import type { FC, PropsWithChildren } from 'react';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import { LIST_GAP_CLASS_BY_ACTION_ITEM_SIZE, type ActionItemSize } from './types.ts';

interface PvActionItemListProps extends PropsWithChildren {
  size?: ActionItemSize;
  title?: string;
  className?: string;
  testId?: string;
}

export const PvActionItemList: FC<PvActionItemListProps> = (props) => (
  <div data-testid={props.testId} className={cn('flex flex-col gap-1.5', props.className)}>
    {props.title !== undefined && (
      <PvTypography variant="subtitle2" as="p">
        {props.title}
      </PvTypography>
    )}
    <div className={cn('flex flex-col', LIST_GAP_CLASS_BY_ACTION_ITEM_SIZE[props.size ?? 'md'])}>
      {props.children}
    </div>
  </div>
);
