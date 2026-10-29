import type { FC } from 'react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import { formatDistance, formatDuration } from '@/lib/format/formatters.ts';
import { ICON_BY_SPORT } from '@/components/sessions/sportIcons.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { useSessionTitle } from './hooks/useSessionTitle.ts';

interface SessionPeekProps {
  session: TrainingSession;
}

export const SessionPeek: FC<SessionPeekProps> = (props) => {
  const sessionTitle = useSessionTitle(props.session);
  return (
    <PvSheetPeek
      icon={<PvIconTile icon={ICON_BY_SPORT[props.session.sport]} />}
      primary={sessionTitle.title}
      secondary={`${formatDistance(props.session.distance)} · ${formatDuration(props.session.duration)}`}
    />
  );
};
