import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { Typography } from './Typography.tsx';

interface ActionTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected?: boolean;
  layout?: 'stack' | 'row';
  dashed?: boolean;
  menu?: ReactNode;
  className?: string;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  onClick: () => void;
}

const StackTile = (props: ActionTileProps) => (
  <button
    type="button"
    className={cn(
      'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer',
      props.selected ? 'bg-white border-white/20' : 'border-white/10 bg-white/5 hover:bg-white/10',
      props.className,
    )}
    onClick={props.onClick}
  >
    <props.icon size={24} className={props.selected ? 'text-zinc-900' : 'text-text-primary'} />
    <Typography variant="subtitle1" className={props.selected ? 'text-zinc-900' : undefined}>
      {props.title}
    </Typography>
    <Typography
      variant="caption"
      color={props.selected ? undefined : 'textSecondary'}
      className={props.selected ? 'text-zinc-500' : undefined}
    >
      {props.description}
    </Typography>
  </button>
);

const rowLook = (props: ActionTileProps): string => {
  if (props.selected) {
    return 'bg-white border-white/20';
  }
  if (props.dashed) {
    return 'border-dashed border-white/20 bg-transparent hover:bg-white/5';
  }
  return 'border-white/10 bg-white/5 hover:bg-white/10';
};

const RowTile = (props: ActionTileProps) => (
  <div className={cn('group relative shrink-0', props.className)}>
    <button
      type="button"
      {...props.buttonProps}
      className={cn(
        'flex h-[62px] w-full items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer select-none [-webkit-touch-callout:none]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        rowLook(props),
        props.menu !== undefined && 'pr-10',
      )}
      onClick={props.onClick}
    >
      <props.icon
        size={20}
        strokeWidth={1.5}
        className={cn(
          'shrink-0',
          props.selected && 'text-zinc-900',
          !props.selected && props.dashed && 'text-text-secondary',
          !props.selected && !props.dashed && 'text-text-primary',
        )}
      />
      <span className="flex min-w-0 flex-col">
        <Typography
          variant="subtitle1"
          as="span"
          className={cn('whitespace-nowrap', props.selected && 'text-zinc-900')}
        >
          {props.title}
        </Typography>
        <Typography
          variant="caption"
          noWrap
          color={props.selected ? undefined : 'textSecondary'}
          className={props.selected ? 'text-zinc-500' : undefined}
        >
          {props.description}
        </Typography>
      </span>
    </button>
    {props.menu !== undefined && (
      <div className="absolute right-2 top-1/2 -translate-y-1/2">{props.menu}</div>
    )}
  </div>
);

export const ActionTile = (props: ActionTileProps) => {
  if (props.layout === 'row') {
    return <RowTile {...props} />;
  }
  return <StackTile {...props} />;
};
