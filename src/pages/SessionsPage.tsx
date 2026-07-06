import { useSearchParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { SessionList } from '@/features/sessions/SessionList.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import { SportsRecords } from '@/features/records/SportsRecords';
import { TripsTab } from '@/features/trips/TripsTab.tsx';

const validTabs = new Set(['log', 'trips', 'records']);

export const SessionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'log';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="log">{m.ui_sessions_tab_log()}</TabsTrigger>
        <TabsTrigger value="trips">{m.ui_sessions_tab_trips()}</TabsTrigger>
        <TabsTrigger value="records">{m.ui_sessions_tab_records()}</TabsTrigger>
      </TabsList>

      <TabsContent value="log">
        <SessionList />
      </TabsContent>

      <TabsContent value="trips">
        <TripsTab />
      </TabsContent>

      <TabsContent value="records">
        <SportsRecords />
      </TabsContent>
    </Tabs>
  );
};
