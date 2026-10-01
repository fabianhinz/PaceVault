import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { Typography } from './Typography.tsx';

interface ActionTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected?: boolean;
  className?: string;
  onClick: () => void;
}

export const ActionTile = (props: ActionTileProps) => (
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
