import { LayoutDashboard } from 'lucide-react';
import { IconTile } from '@/components/ui/IconTile.tsx';
import { SheetPeek } from '@/components/ui/SheetPeek.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { m } from '@/paraglide/messages.js';

export const DashboardPeek = () => (
  <SheetPeek
    icon={<IconTile icon={LayoutDashboard} />}
    primary={m.ui_nav_dashboard()}
    secondary={[
      m.ui_dashboard_current_form(),
      METRIC_EXPLANATIONS.tss.friendlyName,
      m.ui_metrics_chart_title(),
    ].join(' · ')}
  />
);
