import { useNavigate } from 'react-router-dom';
import { SessionHeader } from './SessionHeader.tsx';
import { Card } from '@/components/ui/Card.tsx';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { cn } from '@/lib/utils.ts';
import { useSessionHover } from './hooks/useSessionHover.ts';
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

  const sessionHover = useSessionHover(props.session.id);

  return (
    <Card
      data-testid="session-item"
      role="button"
      className={cn('hover:bg-white/10 cursor-pointer', props.className)}
      onClick={handleNavigate}
      onPointerEnter={sessionHover.onPointerEnter}
      onPointerLeave={sessionHover.onPointerLeave}
    >
      <SessionHeader session={props.session} titleVariant="subtitle1" />
    </Card>
  );
};
