import type { DragEvent } from 'react';
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

/** One item on the board: type icon and title, the areas as a muted line; drags to a column. */
export const ItemCard = (props: ItemCardProps) => {
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
          props.dragging && 'opacity-50',
        )}
      >
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
