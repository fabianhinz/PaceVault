import type { FC } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import { EXPLANATION_BY_METRIC } from '@/components/metricLabel/explanations.ts';
import { m } from '@pacevault/i18n/messages.js';

export const DashboardPeek: FC = () => (
  <PvSheetPeek
    icon={<PvIconTile icon={LayoutDashboard} />}
    primary={m.ui_nav_dashboard()}
    secondary={[
      m.ui_dashboard_current_form(),
      EXPLANATION_BY_METRIC.tss.friendlyName,
      m.ui_volume_title(),
      m.ui_metrics_chart_title(),
    ].join(' · ')}
  />
);
