import { Settings } from 'lucide-react';
import { IconTile } from '@pacevault/ui/components/IconTile.tsx';
import { SheetPeek } from '@pacevault/ui/components/SheetPeek.tsx';
import { m } from '@pacevault/i18n/messages.js';

export const SettingsPeek = () => (
  <SheetPeek
    icon={<IconTile icon={Settings} />}
    primary={m.ui_nav_settings()}
    secondary={[m.ui_settings_tab_general(), m.ui_settings_tab_data()].join(' · ')}
  />
);
