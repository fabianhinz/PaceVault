import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvListItem } from '@pacevault/ui/components/pvList/PvListItem.tsx';
import { PvSelect } from '@pacevault/ui/components/pvSelect/PvSelect.tsx';
import { PvSelectTrigger } from '@pacevault/ui/components/pvSelect/PvSelectTrigger.tsx';
import { PvSelectValue } from '@pacevault/ui/components/pvSelect/PvSelectValue.tsx';
import { PvSelectContent } from '@pacevault/ui/components/pvSelect/PvSelectContent.tsx';
import { PvSelectItem } from '@pacevault/ui/components/pvSelect/PvSelectItem.tsx';
import { THEME_PREFERENCES, readThemePreference, saveThemePreference } from '@/lib/theme/theme.ts';
import { LABEL_BY_THEME_PREFERENCE } from '@/microcopy/theme.ts';

const handleValueChange = (value: string) => {
  const preference = THEME_PREFERENCES.find((option) => option === value);
  if (preference === undefined) return;
  saveThemePreference(preference);
};

export const ThemeListItem: FC = () => {
  return (
    <PvListItem primary={m.ui_settings_theme()} secondary={m.ui_settings_theme_desc()}>
      <PvSelect value={readThemePreference()} onValueChange={handleValueChange}>
        <PvSelectTrigger className="w-32" aria-label={m.ui_settings_theme()}>
          <PvSelectValue />
        </PvSelectTrigger>
        <PvSelectContent>
          {THEME_PREFERENCES.map((preference) => (
            <PvSelectItem key={preference} value={preference}>
              {LABEL_BY_THEME_PREFERENCE[preference]()}
            </PvSelectItem>
          ))}
        </PvSelectContent>
      </PvSelect>
    </PvListItem>
  );
};
