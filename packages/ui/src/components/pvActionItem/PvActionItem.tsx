import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { GLASS_CLASS } from '../../lib/surfaces.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

export type ActionItemSize = 'md' | 'sm';

const ROOT_CLASS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, string> = {
  md: 'rounded-2xl',
  sm: 'rounded-xl',
};

const BUTTON_CLASS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, string> = {
  md: 'gap-2 p-4',
  sm: 'gap-2 px-2 py-1.5',
};

const TRAILING_CLASS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, string> = {
  md: 'mr-3',
  sm: 'mr-1',
};

interface PvActionItemProps {
  avatar: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  aside?: ReactNode;
  value?: ReactNode;
  valueCaption?: ReactNode;
  decoration?: ReactNode;
  trailing?: ReactNode;
  label: string;
  onClick: () => void;
  selected?: boolean;
  size?: ActionItemSize;
  className?: string;
  testId?: string;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export const PvActionItem: FC<PvActionItemProps> = (props) => {
  const size = props.size ?? 'md';
  return (
    <div
      data-testid={props.testId}
      onPointerEnter={props.onPointerEnter}
      onPointerLeave={props.onPointerLeave}
      className={cn(
        GLASS_CLASS,
        'relative flex flex-row items-center hover:bg-white/10',
        ROOT_CLASS_BY_ACTION_ITEM_SIZE[size],
        props.selected === true && 'bg-white/10',
        props.className,
      )}
    >
      {props.decoration}
      <button
        type="button"
        aria-label={props.label}
        aria-pressed={props.selected}
        onClick={props.onClick}
        className={cn(
          'flex min-w-0 flex-1 cursor-pointer items-center text-left',
          BUTTON_CLASS_BY_ACTION_ITEM_SIZE[size],
        )}
      >
        {props.avatar}
        <span className="min-w-0 flex-1">
          <PvTypography variant="subtitle1" className="truncate">
            {props.primary}
          </PvTypography>
          {props.secondary !== undefined && (
            <PvTypography variant="caption" as="p" tabularNums className="truncate">
              {props.secondary}
            </PvTypography>
          )}
        </span>
        {props.aside}
        {props.value !== undefined && (
          <span className="shrink-0 text-right">
            <PvTypography variant="subtitle1" as="p" tabularNums noWrap>
              {props.value}
            </PvTypography>
            {props.valueCaption !== undefined && (
              <PvTypography variant="caption" as="p" color="textTertiary" noWrap>
                {props.valueCaption}
              </PvTypography>
            )}
          </span>
        )}
      </button>
      {props.trailing !== undefined && (
        <span className={cn('shrink-0', TRAILING_CLASS_BY_ACTION_ITEM_SIZE[size])}>
          {props.trailing}
        </span>
      )}
    </div>
  );
};
