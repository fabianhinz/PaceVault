import { IconTile } from '@/components/ui/IconTile.tsx';
import { SheetPeek } from '@/components/ui/SheetPeek.tsx';
import { formatDistance, formatDuration } from '@/lib/formatters.ts';
import { sportIcon } from '@/lib/sportIcons.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { useSessionTitle } from './hooks/useSessionTitle.ts';

export const SessionPeek = (props: { session: TrainingSession }) => {
  const sessionTitle = useSessionTitle(props.session);
  return (
    <SheetPeek
      icon={<IconTile icon={sportIcon[props.session.sport]} />}
      primary={sessionTitle.title}
      secondary={`${formatDistance(props.session.distance)} · ${formatDuration(props.session.duration)}`}
    />
  );
};
