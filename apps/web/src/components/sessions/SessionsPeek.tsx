import type { FC } from 'react';
import { Zap } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import { m } from '@pacevault/i18n/messages.js';

export const SessionsPeek: FC = () => (
  <PvSheetPeek
    icon={<PvIconTile icon={Zap} />}
    primary={m.ui_nav_sessions()}
    secondary={[
      m.ui_sessions_tab_log(),
      m.ui_sessions_tab_trips(),
      m.ui_sessions_tab_records(),
    ].join(' · ')}
  />
);
