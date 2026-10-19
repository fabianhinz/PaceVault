import { LayoutDashboard } from 'lucide-react';
import { IconTile } from '@pacevault/ui/components/IconTile.tsx';
import { SheetPeek } from '@pacevault/ui/components/SheetPeek.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { m } from '@pacevault/i18n/messages.js';

export const DashboardPeek = () => (
  <SheetPeek
    icon={<IconTile icon={LayoutDashboard} />}
    primary={m.ui_nav_dashboard()}
    secondary={[
      m.ui_dashboard_current_form(),
      METRIC_EXPLANATIONS.tss.friendlyName,
      m.ui_volume_title(),
      m.ui_metrics_chart_title(),
    ].join(' · ')}
  />
);
