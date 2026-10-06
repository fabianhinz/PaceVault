import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { getSessionRecords, getSessionLaps } from '@/lib/indexeddb.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { SessionHeader } from '@/features/sessions/SessionHeader.tsx';
import { SessionActionsMenu } from '@/features/sessions/session/SessionActionsMenu.tsx';
import { WeatherCard } from '@/features/sessions/session/WeatherCard.tsx';
import { NoGpsBanner } from '@/features/sessions/session/NoGpsBanner.tsx';
import { useSessionWeather } from '@/features/sessions/session/hooks/useSessionWeather.ts';
import { useSessionLapsEffect } from '@/features/sessions/session/hooks/useSessionLapsEffect.ts';
import { SessionOverview } from '@/features/sessions/session/SessionOverview.tsx';
import { SessionPeek } from '@/features/sessions/SessionPeek.tsx';
import { SessionMapControls } from '@/features/sessions/session/SessionMapControls.tsx';
import type { SessionRecord, SessionLap } from '@/packages/engine/types.ts';

export const SessionDetailPage = () => {
  const params = useParams<{ id: string }>();
  const session = useSessionsStore((s) => s.sessions.find((session) => session.id === params.id));
  const weather = useSessionWeather(params.id ?? '', session?.date ?? 0, session?.duration ?? 0);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [laps, setLaps] = useState<SessionLap[]>([]);

  useSessionLapsEffect(records, laps);

  useEffect(() => {
    if (params.id) {
      useSessionsStore.getState().markSessionSeen(params.id);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && session?.hasDetailedRecords) {
      getSessionRecords(params.id).then(setRecords);
      getSessionLaps(params.id).then(setLaps);
    }
  }, [params.id, session?.hasDetailedRecords]);

  if (!session) {
    return (
      <Typography variant="body1" color="textSecondary">
        {m.ui_session_not_found()}
      </Typography>
    );
  }

  if (records.length === 0) {
    return;
  }

  return (
    <div className="space-y-4">
      <SessionPeek session={session} />
      <NoGpsBanner records={records} />

      <SessionHeader session={session} titleVariant="h2" titleAs="h1">
        <SessionActionsMenu session={session} />
      </SessionHeader>

      <WeatherCard query={weather} records={records} sessionStartMs={session.date} />
      <SessionMapControls session={session} records={records} laps={laps} />

      <SessionOverview session={session} records={records} laps={laps} />
    </div>
  );
};
