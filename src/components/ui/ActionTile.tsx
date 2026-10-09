import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { Typography } from './Typography.tsx';

interface ActionTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected?: boolean;
  layout?: 'stack' | 'row';
  look?: RowLook;
  className?: string;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  onClick?: () => void;
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

type RowLook = 'solid' | 'dashed' | 'accent' | 'hint';

const rowLookClasses: Record<RowLook, string> = {
  solid: 'border-white/10 bg-white/5 hover:bg-white/10',
  dashed: 'border-dashed border-white/20 bg-transparent hover:bg-white/5',
  accent: 'border-accent/55 bg-accent/16 hover:bg-accent/24',
  hint: 'border-dashed border-accent/45 bg-transparent',
};

const rowIconClasses: Record<RowLook, string> = {
  solid: 'text-text-primary',
  dashed: 'text-text-secondary',
  accent: 'text-accent-hover',
  hint: 'text-accent-hover',
};

const RowContent = (props: ActionTileProps & { look: RowLook }) => (
  <>
    <props.icon
      size={18}
      strokeWidth={1.5}
      className={cn('shrink-0', props.selected ? 'text-zinc-900' : rowIconClasses[props.look])}
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
        color={props.look === 'hint' ? 'textTertiary' : 'textSecondary'}
        className={props.selected ? 'text-zinc-500' : undefined}
      >
        {props.description}
      </Typography>
    </span>
  </>
);

const rowClass =
  'flex h-12 w-full shrink-0 items-center gap-2.5 rounded-[10px] border px-2.5 text-left';

const RowTile = (props: ActionTileProps) => {
  const look = props.look ?? 'solid';
  if (props.onClick === undefined) {
    return (
      <div className={cn(rowClass, 'select-none', rowLookClasses[look], props.className)}>
        <RowContent {...props} look={look} />
      </div>
    );
  }
  return (
    <button
      type="button"
      {...props.buttonProps}
      className={cn(
        rowClass,
        'transition-all cursor-pointer select-none [-webkit-touch-callout:none]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        props.selected ? 'bg-white border-white/20' : rowLookClasses[look],
        props.className,
      )}
      onClick={props.onClick}
    >
      <RowContent {...props} look={look} />
    </button>
  );
};

export const ActionTile = (props: ActionTileProps) => {
  if (props.layout === 'row') {
    return <RowTile {...props} />;
  }
  return <StackTile {...props} />;
};
