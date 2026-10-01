import { FlaskConical } from 'lucide-react';
import { IconTile } from '@/components/ui/IconTile.tsx';
import { SheetPeek } from '@/components/ui/SheetPeek.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { m } from '@/paraglide/messages.js';

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
