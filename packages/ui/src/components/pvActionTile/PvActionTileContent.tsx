import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import type { ActionTileLook } from './types.ts';

const ICON_CLASSES_BY_ACTION_TILE_LOOK: Record<ActionTileLook, string> = {
  solid: 'text-text-primary',
  dashed: 'text-text-secondary',
  accent: 'text-accent-hover',
  hint: 'text-accent-hover',
};

const DESCRIPTION_COLOR_BY_ACTION_TILE_LOOK: Record<
  ActionTileLook,
  'textSecondary' | 'textTertiary'
> = {
  solid: 'textSecondary',
  dashed: 'textSecondary',
  accent: 'textSecondary',
  hint: 'textTertiary',
};

interface PvActionTileContentProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  selected?: boolean;
  look: ActionTileLook;
}

export const PvActionTileContent: FC<PvActionTileContentProps> = (props) => (
  <>
    <props.icon
      size={18}
      strokeWidth={1.5}
      className={cn(
        'shrink-0',
        props.selected ? 'text-tile-selected-text' : ICON_CLASSES_BY_ACTION_TILE_LOOK[props.look],
      )}
    />
    <span className="flex min-w-0 flex-col">
      <PvTypography
        variant="subtitle1"
        as="span"
        className={cn('whitespace-nowrap', props.selected && 'text-tile-selected-text')}
      >
        {props.title}
      </PvTypography>
      {props.description !== undefined && (
        <PvTypography
          variant="caption"
          noWrap
          color={DESCRIPTION_COLOR_BY_ACTION_TILE_LOOK[props.look]}
          className={props.selected ? 'text-tile-selected-muted' : undefined}
        >
          {props.description}
        </PvTypography>
      )}
    </span>
  </>
);
