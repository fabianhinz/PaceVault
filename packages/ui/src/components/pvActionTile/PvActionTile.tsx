import type { ComponentProps, FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { PvActionTileContent } from './PvActionTileContent.tsx';
import type { ActionTileLook } from './types.ts';

const CLASSES_BY_ACTION_TILE_LOOK: Record<ActionTileLook, string> = {
  solid: 'border-white/10 bg-white/5 hover:bg-white/10',
  dashed: 'border-dashed border-white/20 bg-transparent hover:bg-white/5',
  accent: 'border-accent/55 bg-accent/16 hover:bg-accent/24',
  hint: 'border-dashed border-accent/45 bg-transparent',
};

const ROW_CLASS =
  'flex h-12 w-full shrink-0 items-center gap-2.5 rounded-10px border px-2.5 text-left';

interface PvActionTileProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  selected?: boolean;
  look?: ActionTileLook;
  className?: string;
  buttonProps?: ComponentProps<'button'>;
  onClick?: () => void;
}

export const PvActionTile: FC<PvActionTileProps> = (props) => {
  const look = props.look ?? 'solid';
  if (props.onClick === undefined) {
    return (
      <div className={cn(ROW_CLASS, CLASSES_BY_ACTION_TILE_LOOK[look], props.className)}>
        <PvActionTileContent
          icon={props.icon}
          title={props.title}
          description={props.description}
          selected={props.selected}
          look={look}
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      {...props.buttonProps}
      className={cn(
        ROW_CLASS,
        'transition-all cursor-pointer [-webkit-touch-callout:none]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        props.selected ? 'bg-white border-white/20' : CLASSES_BY_ACTION_TILE_LOOK[look],
        props.className,
      )}
      onClick={props.onClick}
    >
      <PvActionTileContent
        icon={props.icon}
        title={props.title}
        description={props.description}
        selected={props.selected}
        look={look}
      />
    </button>
  );
};
