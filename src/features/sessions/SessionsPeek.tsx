import { Zap } from 'lucide-react';
import { IconTile } from '@/components/ui/IconTile.tsx';
import { SheetPeek } from '@/components/ui/SheetPeek.tsx';
import { m } from '@/paraglide/messages.js';

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
