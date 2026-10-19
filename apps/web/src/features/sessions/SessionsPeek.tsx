import { Zap } from 'lucide-react';
import { IconTile } from '@pacevault/ui/components/IconTile.tsx';
import { SheetPeek } from '@pacevault/ui/components/SheetPeek.tsx';
import { m } from '@pacevault/i18n/messages.js';

export const SessionsPeek = () => (
  <SheetPeek
    icon={<IconTile icon={Zap} />}
    primary={m.ui_nav_sessions()}
    secondary={[
      m.ui_sessions_tab_log(),
      m.ui_sessions_tab_trips(),
      m.ui_sessions_tab_records(),
    ].join(' · ')}
  />
);
