import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { TEXT_CLASS_BY_SPORT } from '@/components/dashboard/statusColors.ts';
import { ICON_BY_SPORT } from '@/components/sessions/sportIcons.ts';
import type { Sport } from '@pacevault/engine/types.ts';

interface SportBadgeProps {
  sport: Sport;
  size?: 'sm' | 'md';
}

export const SportBadge: FC<SportBadgeProps> = (props) => {
  const Icon = ICON_BY_SPORT[props.sport];

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-bold h-10 w-10 rounded-lg',
        TEXT_CLASS_BY_SPORT[props.sport],
      )}
    >
      <Icon size={18} strokeWidth={2} />
    </div>
  );
};
