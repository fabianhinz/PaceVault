import type { FC } from 'react';
import { Settings } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import { m } from '@pacevault/i18n/messages.js';

export const SettingsPeek: FC = () => (
  <PvSheetPeek
    icon={<PvIconTile icon={Settings} />}
    primary={m.ui_nav_settings()}
    secondary={[m.ui_settings_tab_general(), m.ui_settings_tab_data()].join(' · ')}
  />
);
