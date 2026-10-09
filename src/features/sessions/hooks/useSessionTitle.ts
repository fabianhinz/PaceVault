import type { TrainingSession } from '@/packages/engine/types.ts';
import { formatDate, formatDistance, formatDuration, formatSubSport } from '@/lib/formatters.ts';
import { formatSessionName, formatSessionZoneLabel } from '@/lib/sessionTitleFormatter.ts';
import { useUserStore } from '@/store/user.ts';

interface SessionTitle {
  title: string;
  subtitle: string;
}

export const useSessionTitle = (session: TrainingSession | undefined): SessionTitle => {
  const thresholds = useUserStore((s) => s.profile?.thresholds);

  if (!session) {
    return { title: '', subtitle: '' };
  }

  const title = formatSessionName(session);
  const zoneLabel = formatSessionZoneLabel(session.avgHr, thresholds?.maxHr, thresholds?.restHr);

  const parts = [formatDate(session.date)];
  if (session.subSport && session.subSport !== 'generic') {
    parts.push(formatSubSport(session.subSport));
  }
  if (zoneLabel) {
    parts.push(zoneLabel);
  }
  parts.push(formatDistance(session.distance), formatDuration(session.duration));

  return { title, subtitle: parts.join(' · ') };
};
