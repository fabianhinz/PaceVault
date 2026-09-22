import type { ElementType, ReactNode } from 'react';
import { Typography } from '@/components/ui/Typography.tsx';
import type { TypographyVariants } from '@/components/ui/Typography.tsx';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { cn } from '@/lib/utils.ts';
import { SportBadge } from './SportBadge.tsx';
import { IconBadge } from '@/components/ui/IconBadge.tsx';
import { useSessionTitle } from './hooks/useSessionTitle.ts';

interface SessionHeaderProps {
  session: TrainingSession;
  titleVariant: TypographyVariants;
  titleAs?: ElementType;
  children?: ReactNode;
  className?: string;
  showNewBadge?: boolean;
}

export const SessionHeader = (props: SessionHeaderProps) => {
  const sessionTitle = useSessionTitle(props.session);

  return (
    <div className={cn('flex items-center justify-between gap-3', props.className)}>
      <div className="flex items-center gap-2 min-w-0">
        <IconBadge show={props.showNewBadge === true} className="shrink-0">
          <SportBadge sport={props.session.sport} />
        </IconBadge>
        <div className="min-w-0">
          <Typography variant={props.titleVariant} as={props.titleAs} className="truncate">
            {sessionTitle.title}
          </Typography>
          <Typography variant="caption" as="p" className="truncate">
            {sessionTitle.subtitle}
          </Typography>
        </div>
      </div>
      {props.children}
    </div>
  );
};
