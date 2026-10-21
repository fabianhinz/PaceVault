import type { DragEvent } from 'react';
import { Zap } from 'lucide-react';
import { tileClass } from '@pacevault/ui/components/Card.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { BoardItem } from '../lib/board.ts';
import { TypeIcon } from './icons.tsx';

type ItemCardProps = {
  item: BoardItem;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

/**
 * One item on the board: type icon and title, the areas as a muted line; drags to a column.
 * A `size: small` item (fast lane) gets a yellow "Fast" banner with a Zap icon as the card's top
 * strip, edge to edge, and a border in the banner's colour.
 */
export const ItemCard = (props: ItemCardProps) => {
  const small = props.item.data.size === 'small';
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
          tileClass,
          'flex w-full cursor-pointer flex-col gap-1 p-3 text-left transition-colors hover:bg-white/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          small && 'overflow-hidden border-status-warning-muted',
          props.dragging && 'opacity-50',
        )}
      >
        {small && (
          <Typography
            variant="caption"
            color="warning"
            as="span"
            className="-mx-3 -mt-3 mb-1 flex items-center gap-1 bg-status-warning-muted px-3 py-0.5 font-medium"
          >
            <Zap className="size-3" aria-hidden="true" />
            Fast
          </Typography>
        )}
        <Typography as="span" className="block">
          {props.item.type !== undefined && (
            <TypeIcon type={props.item.type} className="mr-1.5 align-[-2px]" />
          )}
          {props.item.data.title}
        </Typography>
        {props.item.areas.length > 0 && (
          <Typography variant="caption">{props.item.areas.join(' · ')}</Typography>
        )}
      </button>
    </li>
  );
};
