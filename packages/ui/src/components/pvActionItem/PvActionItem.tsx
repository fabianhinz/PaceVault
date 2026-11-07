import type { ComponentProps, FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { GLASS_CLASS } from '../../lib/surfaces.ts';
import { PvActionItemContent } from './PvActionItemContent.tsx';
import type { ActionItemSize } from './types.ts';

type ActionItemRadius = 'lg' | 'xl' | '2xl';

const RADIUS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, ActionItemRadius> = {
  md: '2xl',
  sm: 'xl',
};

const ROOT_CLASS_BY_ACTION_ITEM_RADIUS: Record<ActionItemRadius, string> = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

const BUTTON_CLASS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, string> = {
  md: 'gap-2 p-4',
  sm: 'gap-2 px-2 py-1.5',
};

interface PvActionItemProps extends ComponentProps<typeof PvActionItemContent> {
  decoration?: ReactNode;
  label: string;
  onClick?: () => void;
  size?: ActionItemSize;
  radius?: ActionItemRadius;
  className?: string;
  testId?: string;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export const PvActionItem: FC<PvActionItemProps> = (props) => {
  const size = props.size ?? 'md';
  const innerClass = cn(
    'flex min-w-0 flex-1 items-center text-left',
    BUTTON_CLASS_BY_ACTION_ITEM_SIZE[size],
  );
  const content = (
    <PvActionItemContent
      avatar={props.avatar}
      primary={props.primary}
      secondary={props.secondary}
      value={props.value}
      valueCaption={props.valueCaption}
    />
  );
  return (
    <div
      data-testid={props.testId}
      onPointerEnter={props.onPointerEnter}
      onPointerLeave={props.onPointerLeave}
      className={cn(
        GLASS_CLASS,
        'relative flex flex-row items-center',
        props.onClick !== undefined && 'hover:bg-white/10',
        ROOT_CLASS_BY_ACTION_ITEM_RADIUS[props.radius ?? RADIUS_BY_ACTION_ITEM_SIZE[size]],
        props.className,
      )}
    >
      {props.decoration}
      {props.onClick === undefined ? (
        <div className={innerClass}>{content}</div>
      ) : (
        <button
          type="button"
          aria-label={props.label}
          onClick={props.onClick}
          className={cn('cursor-pointer', innerClass)}
        >
          {content}
        </button>
      )}
    </div>
  );
};
