import { ZoomResetPill } from '@/components/ui/ChartsCard.tsx';
import { useFiltersStore } from '@/store/filters.ts';
import { isZoomTime } from '@/lib/timeRange.ts';

export const DashboardZoomReset = () => {
  const isZoomed = useFiltersStore((s) => isZoomTime(s.activeFilter?.time ?? null));
  return (
    <ZoomResetPill
      isZoomed={isZoomed}
      onReset={() => useFiltersStore.getState().clearDashboardChartRange()}
    />
  );
};
