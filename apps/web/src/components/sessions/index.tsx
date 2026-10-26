import type { FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { useRouterQuery } from '@/routing/useRouterQuery.ts';
import { m } from '@pacevault/i18n/messages.js';
import { SessionList } from '@/components/sessions/SessionList.tsx';
import { PvTabs } from '@pacevault/ui/components/pvTabs/PvTabs.tsx';
import { PvTabsList } from '@pacevault/ui/components/pvTabs/PvTabsList.tsx';
import { PvTabsTrigger } from '@pacevault/ui/components/pvTabs/PvTabsTrigger.tsx';
import { PvTabsContent } from '@pacevault/ui/components/pvTabs/PvTabsContent.tsx';
import { Records } from '@/components/records/index.tsx';
import { TripsTab } from '@/components/trips/TripsTab.tsx';
import { SessionsPeek } from '@/components/sessions/SessionsPeek.tsx';

const validTabs = new Set(['log', 'trips', 'records']);

export const Sessions: FC = () => {
  const rawTab = useRouterParam('tab') ?? null;
  const routerQuery = useRouterQuery();
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'log';

  const handleTabChange = (value: string) => {
    routerQuery.push({ key: 'tab', value });
  };

  return (
    <PvTabs value={tab} onValueChange={handleTabChange}>
      <SessionsPeek />
      <PvTabsList>
        <PvTabsTrigger value="log">{m.ui_sessions_tab_log()}</PvTabsTrigger>
        <PvTabsTrigger value="trips">{m.ui_sessions_tab_trips()}</PvTabsTrigger>
        <PvTabsTrigger value="records">{m.ui_sessions_tab_records()}</PvTabsTrigger>
      </PvTabsList>

      <PvTabsContent value="log">
        <SessionList />
      </PvTabsContent>

      <PvTabsContent value="trips">
        <TripsTab />
      </PvTabsContent>

      <PvTabsContent value="records">
        <Records />
      </PvTabsContent>
    </PvTabs>
  );
};
