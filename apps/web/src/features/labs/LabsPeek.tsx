import { FlaskConical } from 'lucide-react';
import { IconTile } from '@pacevault/ui/components/IconTile.tsx';
import { SheetPeek } from '@pacevault/ui/components/SheetPeek.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { m } from '@pacevault/i18n/messages.js';

export const LabsPeek = () => (
  <SheetPeek
    icon={<IconTile icon={FlaskConical} />}
    primary={m.ui_nav_labs()}
    secondary={[
      m.ui_labs_tab_studio(),
      m.ui_labs_tab_tools(),
      METRIC_EXPLANATIONS.trainingZones.friendlyName,
    ].join(' · ')}
  />
);
