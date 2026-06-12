import { useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { getLocale, setLocale, locales, type Locale } from '@/paraglide/runtime.js';
import { useUserStore } from '@/store/user.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import { Switch } from '@/components/ui/Switch.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import { ThresholdsSection } from '@/features/settings/ThresholdsSection.tsx';
import { DataManagementSection } from '@/features/settings/DataManagementSection.tsx';
import { AboutSection } from '@/features/settings/AboutSection.tsx';
import { AutoSessionNamesToggle } from '@/features/sessions/AutoSessionNamesToggle.tsx';

const localeLabels: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
};

const validTabs = new Set(['general', 'data']);

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'general';

  const profile = useUserStore((s) => s.profile);
  const [, startTransition] = useTransition();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="general">{m.ui_settings_tab_general()}</TabsTrigger>
        <TabsTrigger value="data">{m.ui_settings_tab_data()}</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <PageGrid>
          <div className="lg:col-span-2">
            <ThresholdsSection />
          </div>

          <Card>
            <CardHeader title={m.ui_settings_display()} />
            <List className="space-y-4">
              <ListItem
                primary={m.ui_settings_language()}
                secondary={m.ui_settings_language_desc()}
              >
                <SelectRoot value={getLocale()} onValueChange={(v) => setLocale(v as Locale)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {localeLabels[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </ListItem>
              <ListItem
                primary={m.ui_settings_metric_help()}
                secondary={m.ui_settings_metric_help_desc()}
              >
                <Switch
                  checked={profile?.showMetricHelp ?? true}
                  onCheckedChange={() =>
                    startTransition(() => useUserStore.getState().toggleMetricHelp())
                  }
                />
              </ListItem>
              <AutoSessionNamesToggle />
            </List>
          </Card>

          <AboutSection />
        </PageGrid>
      </TabsContent>

      <TabsContent value="data">
        <PageGrid>
          <DataManagementSection />
        </PageGrid>
      </TabsContent>
    </Tabs>
  );
};
