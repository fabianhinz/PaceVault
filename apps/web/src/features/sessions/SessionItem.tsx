import { useNavigate } from 'react-router-dom';
import { SessionHeader } from './SessionHeader.tsx';
import { Card } from '@pacevault/ui/components/Card.tsx';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useMapHover } from '@/lib/hooks/useMapHover.ts';
interface SessionItemProps {
  session: TrainingSession;
  className?: string;
  onNavigate?: () => void;
}

export const SessionItem = (props: SessionItemProps) => {
  const navigate = useNavigate();
  const handleNavigate = () => {
    navigate(`/sessions/${props.session.id}`);
    props.onNavigate?.();
  };

  const sessionHover = useMapHover('session', props.session.id);

  return (
    <Card
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
    </Card>
  );
};
