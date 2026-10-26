import type { FC } from 'react';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { SessionHeader } from './SessionHeader.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useMapHover } from '@/components/mapBackground/hooks/useMapHover.ts';
interface SessionItemProps {
  session: TrainingSession;
  className?: string;
  onNavigate?: () => void;
}

export const SessionItem: FC<SessionItemProps> = (props) => {
  const pageRouting = usePageRouting();
  const handleNavigate = () => {
    pageRouting.open({ page: 'sessionDetail', params: { sessionId: props.session.id } });
    props.onNavigate?.();
  };

  const sessionHover = useMapHover({ kind: 'session', id: props.session.id });

  return (
    <PvCard
      data-testid="session-item"
      role="button"
      className={cn('hover:bg-white/10 cursor-pointer', props.className)}
      onClick={handleNavigate}
      onPointerEnter={sessionHover.onPointerEnter}
      onPointerLeave={sessionHover.onPointerLeave}
    >
      <SessionHeader
        session={props.session}
        titleVariant="subtitle1"
        showNewBadge={props.session.isNew === true}
      />
    </PvCard>
  );
};
