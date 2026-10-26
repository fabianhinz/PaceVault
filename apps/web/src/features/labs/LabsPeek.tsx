import type { FC } from 'react';
import { FlaskConical } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { m } from '@pacevault/i18n/messages.js';

export const LabsPeek: FC = () => (
  <PvSheetPeek
    icon={<PvIconTile icon={FlaskConical} />}
    primary={m.ui_nav_labs()}
    secondary={[
      m.ui_labs_tab_studio(),
      m.ui_labs_tab_tools(),
      METRIC_EXPLANATIONS.trainingZones.friendlyName,
    ].join(' · ')}
  />
);
