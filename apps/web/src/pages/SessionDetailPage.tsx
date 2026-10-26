import type { FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { m } from '@pacevault/i18n/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { useSessionRecords } from '@/queries/sessions/useSessionRecords.ts';
import { useSessionLaps } from '@/queries/sessions/useSessionLaps.ts';
import { useMarkSessionSeenEffect } from '@/features/sessions/session/hooks/useMarkSessionSeenEffect.ts';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { SessionHeader } from '@/features/sessions/SessionHeader.tsx';
import { SessionActionsMenu } from '@/features/sessions/session/SessionActionsMenu.tsx';
import { SensorWarningBanner } from '@/features/sessions/session/SensorWarningBanner.tsx';
import { NoGpsBanner } from '@/features/sessions/session/NoGpsBanner.tsx';
import { SessionLapSetSync } from '@/features/sessions/session/SessionLapSetSync.tsx';
import { SessionOverview } from '@/features/sessions/session/SessionOverview.tsx';
import { SessionPeek } from '@/features/sessions/SessionPeek.tsx';
import { SessionMapControls } from '@/features/sessions/session/SessionMapControls.tsx';
import type { SessionRecord, SessionLap } from '@pacevault/engine/types.ts';

const NO_RECORDS: SessionRecord[] = [];
const NO_LAPS: SessionLap[] = [];

export const SessionDetailPage: FC = () => {
  const id = useRouterParam('id');
  const session = useSessionsStore((s) => s.sessions.find((session) => session.id === id));
  const enabled = id !== undefined && session?.hasDetailedRecords === true;
  const sessionRecords = useSessionRecords({ sessionId: id ?? '', enabled });
  const sessionLaps = useSessionLaps({ sessionId: id ?? '', enabled });
  const records = sessionRecords.data ?? NO_RECORDS;
  const laps = sessionLaps.data ?? NO_LAPS;

  useMarkSessionSeenEffect(id);

  const lapSetSync = <SessionLapSetSync records={records} laps={laps} />;

  if (!session) {
    return (
      <>
        {lapSetSync}
        <PvTypography variant="body1" color="textSecondary">
          {m.ui_session_not_found()}
        </PvTypography>
      </>
    );
  }

  if (records.length === 0) {
    return lapSetSync;
  }

  return (
    <>
      {lapSetSync}
      <div className="space-y-4">
        <SessionPeek session={session} />

        <SessionHeader session={session} titleVariant="h2" titleAs="h1">
          <SessionActionsMenu session={session} />
        </SessionHeader>

        <SensorWarningBanner records={records} sport={session.sport} />
        <NoGpsBanner records={records} />
        <SessionMapControls session={session} records={records} laps={laps} />

        <SessionOverview session={session} records={records} laps={laps} />
      </div>
    </>
  );
};
