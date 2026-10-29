import type { ElementType, FC, ReactNode } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { TypographyVariants } from '@pacevault/ui/components/pvTypography/types.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { SportBadge } from './SportBadge.tsx';
import { PvIconBadge } from '@pacevault/ui/components/pvIconBadge/PvIconBadge.tsx';
import { useSessionTitle } from './hooks/useSessionTitle.ts';

interface SessionHeaderProps {
  session: TrainingSession;
  titleVariant: TypographyVariants;
  titleAs?: ElementType;
  children?: ReactNode;
  className?: string;
  showNewBadge?: boolean;
}

export const SessionHeader: FC<SessionHeaderProps> = (props) => {
  const sessionTitle = useSessionTitle(props.session);

  return (
    <div className={cn('flex items-center justify-between gap-3', props.className)}>
      <div className="flex items-center gap-2 min-w-0">
        <PvIconBadge show={props.showNewBadge === true} className="shrink-0">
          <SportBadge sport={props.session.sport} />
        </PvIconBadge>
        <div className="min-w-0">
          <PvTypography variant={props.titleVariant} as={props.titleAs} className="truncate">
            {sessionTitle.title}
          </PvTypography>
          <PvTypography variant="caption" as="p" className="truncate">
            {sessionTitle.subtitle}
          </PvTypography>
        </div>
      </div>
      {props.children}
    </div>
  );
};
