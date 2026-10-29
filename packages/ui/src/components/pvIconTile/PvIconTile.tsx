import type { CSSProperties, FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';

interface PvIconTileProps {
  icon: LucideIcon;
  className?: string;
  style?: CSSProperties;
}

export const PvIconTile: FC<PvIconTileProps> = (props) => {
  const Icon = props.icon;
  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-text-secondary',
        props.className,
      )}
      style={props.style}
    >
      <Icon size={18} strokeWidth={2} />
    </div>
  );
};
