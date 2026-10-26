import type { DragEvent, FC } from 'react';
import { Zap } from 'lucide-react';
import { TILE_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { BoardItem } from '@site/lib/board.ts';
import { TypeIcon } from './TypeIcon.tsx';

interface ItemCardProps {
  item: BoardItem;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const ItemCard: FC<ItemCardProps> = (props) => {
  const small = props.item.frontmatter.size === 'small';
  const onDragStart = (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('text/plain', props.item.folder);
    event.dataTransfer.effectAllowed = 'move';
    props.onDragStart();
  };
  return (
    <li>
      <button
        type="button"
        draggable
        data-item={props.item.folder}
        onClick={props.onOpen}
        onDragStart={onDragStart}
        onDragEnd={props.onDragEnd}
        className={cn(
          TILE_CLASS,
          'flex w-full cursor-pointer flex-col gap-1 p-3 text-left transition-colors hover:bg-white/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          small && 'overflow-hidden border-status-warning-muted',
          props.dragging && 'opacity-50',
        )}
      >
        {small && (
          <PvTypography
            variant="caption"
            color="warning"
            as="span"
            className="-mx-3 -mt-3 mb-1 flex items-center gap-1 bg-status-warning-muted px-3 py-0.5 font-medium"
          >
            <Zap className="size-3" aria-hidden="true" />
            Fast
          </PvTypography>
        )}
        <PvTypography as="span" className="block">
          {props.item.type !== undefined && (
            <TypeIcon type={props.item.type} className="mr-1.5 align-[-2px]" />
          )}
          {props.item.frontmatter.title}
        </PvTypography>
        {props.item.areas.length > 0 && (
          <PvTypography variant="caption">{props.item.areas.join(' · ')}</PvTypography>
        )}
      </button>
    </li>
  );
};
