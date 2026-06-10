import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { analyzeLaps, enrichAllLaps } from '@/lib/laps.ts';
import { getSessionRecords, getSessionLaps } from '@/lib/indexeddb.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import { SessionHeader } from '@/features/sessions/SessionHeader.tsx';
import { SessionActionsMenu } from '@/features/sessions/session/SessionActionsMenu.tsx';
import { WeatherChips } from '@/features/sessions/session/WeatherChips.tsx';
import { useSessionWeather } from '@/features/sessions/session/hooks/useSessionWeather.ts';
import { OverviewTab } from '@/features/sessions/session/OverviewTab.tsx';
import { LapsTab } from '@/features/sessions/laps/LapsTab.tsx';
import type { SessionRecord, SessionLap } from '@/packages/engine/types.ts';

const validTabs = new Set(['overview', 'laps']);

export const SessionDetailPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'overview';

  const params = useParams<{ id: string }>();
  const session = useSessionsStore((s) => s.sessions.find((session) => session.id === params.id));
  const weather = useSessionWeather(params.id ?? '', session?.date ?? 0, session?.duration ?? 0);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [laps, setLaps] = useState<SessionLap[]>([]);

  useEffect(() => {
    if (params.id && session?.hasDetailedRecords) {
      getSessionRecords(params.id).then(setRecords);
      getSessionLaps(params.id).then(setLaps);
    }
  }, [params.id, session?.hasDetailedRecords]);

  useEffect(() => {
    if (laps.length > 0 && session) {
      useMapFocusStore.getState().setFocusedLaps(laps, session.sport, records);
      const deviceAnalysis = analyzeLaps(laps);
      const deviceEnrichments = enrichAllLaps(laps, records);
      useMapFocusStore.getState().setActiveLapData(deviceAnalysis, deviceEnrichments, null);
    }
    return () => {
      useMapFocusStore.getState().clearFocusedLaps();
    };
  }, [laps, records, session]);

  if (!session) {
    return (
      <Typography variant="body1" color="textSecondary">
        {m.ui_session_not_found()}
      </Typography>
    );
  }

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // no layout shift
  if (records.length === 0) {
    return;
  }

  return (
    <div className="space-y-4">
      <SessionHeader session={session} titleVariant="h2" titleAs="h1">
        <SessionActionsMenu session={session} />
      </SessionHeader>

      <WeatherChips query={weather} />

      <Tabs defaultValue="overview" value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">{m.ui_session_tab_overview()}</TabsTrigger>
          <TabsTrigger value="laps">{m.ui_session_tab_laps()}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab session={session} records={records} laps={laps} />
        </TabsContent>

        <TabsContent value="laps">
          <LapsTab laps={laps} session={session} records={records} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
