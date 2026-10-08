import { ZoomResetPill } from '@/components/ui/ChartsCard.tsx';
import { useFiltersStore } from '@/store/filters.ts';

export const DashboardZoomReset = () => {
  const isZoomed = useFiltersStore((s) => s.customRange !== null);
  return (
    <ZoomResetPill
      isZoomed={isZoomed}
      onReset={() => useFiltersStore.getState().clearDashboardChartRange()}
    />
  );
};
