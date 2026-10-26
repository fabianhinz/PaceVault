import type { TrainingSession } from '@pacevault/engine/types.ts';
import { formatDate, formatDistance, formatDuration, formatSubSport } from '@/lib/formatters.ts';
import { formatSessionName, formatSessionZoneLabel } from '@/lib/sessionTitleFormatter.ts';
import { useThresholdsAt } from '@/features/settings/hooks/useThresholdsAt.ts';

interface SessionTitle {
  title: string;
  subtitle: string;
}

export const useSessionTitle = (session: TrainingSession | undefined): SessionTitle => {
  const thresholds = useThresholdsAt(session?.date ?? 0);

  if (!session) {
    return { title: '', subtitle: '' };
  }

  const title = formatSessionName(session);
  const zoneLabel = formatSessionZoneLabel({
    avgHr: session.avgHr,
    maxHr: thresholds?.maxHr,
    restHr: thresholds?.restHr,
  });

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
