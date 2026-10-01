import { Settings } from 'lucide-react';
import { IconTile } from '@/components/ui/IconTile.tsx';
import { SheetPeek } from '@/components/ui/SheetPeek.tsx';
import { m } from '@/paraglide/messages.js';

export const SettingsPeek = () => (
  <SheetPeek
    icon={<IconTile icon={Settings} />}
    primary={m.ui_nav_settings()}
    secondary={[m.ui_settings_tab_general(), m.ui_settings_tab_data()].join(' · ')}
  />
);
