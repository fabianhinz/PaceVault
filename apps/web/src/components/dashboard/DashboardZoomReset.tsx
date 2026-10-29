import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvZoomResetPill } from '@pacevault/ui/components/pvChartsCard/PvZoomResetPill.tsx';
import { useFiltersStore } from '@/store/filters.ts';
import { isZoomTime } from '@/lib/filtering/timeRange.ts';

export const DashboardZoomReset: FC = () => {
  const zoomed = useFiltersStore((s) => isZoomTime(s.activeFilter?.time ?? null));
  return (
    <PvZoomResetPill
      label={m.ui_chart_reset_zoom()}
      zoomed={zoomed}
      onReset={() => useFiltersStore.getState().clearActiveFilter()}
    />
  );
};
