import { ZoomResetChip } from '@/components/ui/ZoomResetChip.tsx';
import { useFiltersStore } from '@/store/filters.ts';

export const DashboardZoomReset = () => {
  const isZoomed = useFiltersStore((s) => s.customRange !== null);
  if (!isZoomed) return null;
  return <ZoomResetChip onReset={() => useFiltersStore.getState().clearDashboardChartRange()} />;
};
