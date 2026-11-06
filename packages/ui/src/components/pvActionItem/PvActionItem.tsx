import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { GLASS_CLASS } from '../../lib/surfaces.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

export type ActionItemSize = 'md' | 'sm';

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

interface PvActionItemProps {
  avatar: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  value?: ReactNode;
  valueCaption?: ReactNode;
  decoration?: ReactNode;
  label: string;
  onClick: () => void;
  size?: ActionItemSize;
  radius?: ActionItemRadius;
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
        ROOT_CLASS_BY_ACTION_ITEM_RADIUS[props.radius ?? RADIUS_BY_ACTION_ITEM_SIZE[size]],
        props.className,
      )}
    >
      {props.decoration}
      <button
        type="button"
        aria-label={props.label}
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
    </div>
  );
};
