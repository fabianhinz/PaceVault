import { useTransition, type FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { useRouterQuery } from '@/routing/useRouterQuery.ts';
import { m } from '@pacevault/i18n/messages.js';
import { getLocale, setLocale, locales, type Locale } from '@pacevault/i18n/runtime.js';
import { useUserStore } from '@/store/user.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvList } from '@pacevault/ui/components/pvList/PvList.tsx';
import { PvListItem } from '@pacevault/ui/components/pvList/PvListItem.tsx';
import { PvSwitch } from '@pacevault/ui/components/pvSwitch/PvSwitch.tsx';
import { PvSelect } from '@pacevault/ui/components/pvSelect/PvSelect.tsx';
import { PvSelectTrigger } from '@pacevault/ui/components/pvSelect/PvSelectTrigger.tsx';
import { PvSelectValue } from '@pacevault/ui/components/pvSelect/PvSelectValue.tsx';
import { PvSelectContent } from '@pacevault/ui/components/pvSelect/PvSelectContent.tsx';
import { PvSelectItem } from '@pacevault/ui/components/pvSelect/PvSelectItem.tsx';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { PvTabs } from '@pacevault/ui/components/pvTabs/PvTabs.tsx';
import { PvTabsList } from '@pacevault/ui/components/pvTabs/PvTabsList.tsx';
import { PvTabsTrigger } from '@pacevault/ui/components/pvTabs/PvTabsTrigger.tsx';
import { PvTabsContent } from '@pacevault/ui/components/pvTabs/PvTabsContent.tsx';
import { ThresholdsSection } from '@/features/settings/ThresholdsSection.tsx';
import { DataManagementSection } from '@/features/settings/DataManagementSection.tsx';
import { AboutSection } from '@/features/settings/AboutSection.tsx';
import { IntegrationsCard } from '@/features/settings/IntegrationsCard.tsx';
import { FitFilesCard } from '@/features/settings/FitFilesCard.tsx';
import { SettingsPeek } from '@/features/settings/SettingsPeek.tsx';

const localeLabels: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
};

const validTabs = new Set(['general', 'data']);

export const SettingsPage: FC = () => {
  const rawTab = useRouterParam('tab') ?? null;
  const routerQuery = useRouterQuery();
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'general';

  const profile = useUserStore((s) => s.profile);
  const [, startTransition] = useTransition();

  const handleTabChange = (value: string) => {
    routerQuery.push({ key: 'tab', value });
  };

  return (
    <PvTabs value={tab} onValueChange={handleTabChange}>
      <SettingsPeek />
      <PvTabsList>
        <PvTabsTrigger value="general">{m.ui_settings_tab_general()}</PvTabsTrigger>
        <PvTabsTrigger value="data">{m.ui_settings_tab_data()}</PvTabsTrigger>
      </PvTabsList>

      <PvTabsContent value="general">
        <PvPageGrid>
          <div className="space-y-4 lg:col-span-2">
            <ThresholdsSection />
          </div>

          <PvCard>
            <PvCardHeader title={m.ui_settings_display()} />
            <PvList className="space-y-4">
              <PvListItem
                primary={m.ui_settings_language()}
                secondary={m.ui_settings_language_desc()}
              >
                <PvSelect value={getLocale()} onValueChange={(v) => void setLocale(v as Locale)}>
                  <PvSelectTrigger className="w-32">
                    <PvSelectValue />
                  </PvSelectTrigger>
                  <PvSelectContent>
                    {locales.map((locale) => (
                      <PvSelectItem key={locale} value={locale}>
                        {localeLabels[locale]}
                      </PvSelectItem>
                    ))}
                  </PvSelectContent>
                </PvSelect>
              </PvListItem>
              <PvListItem
                primary={m.ui_settings_metric_help()}
                secondary={m.ui_settings_metric_help_desc()}
              >
                <PvSwitch
                  checked={profile?.showMetricHelp ?? true}
                  onCheckedChange={() =>
                    startTransition(() => useUserStore.getState().toggleMetricHelp())
                  }
                />
              </PvListItem>
            </PvList>
          </PvCard>

          <AboutSection />
        </PvPageGrid>
      </PvTabsContent>

      <PvTabsContent value="data">
        <PvPageGrid>
          <IntegrationsCard />
          <FitFilesCard />
          <DataManagementSection />
        </PvPageGrid>
      </PvTabsContent>
    </PvTabs>
  );
};
