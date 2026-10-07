import { ZoomResetButton } from '@/components/ui/ZoomResetButton.tsx';
import { useFiltersStore } from '@/store/filters.ts';

export const DashboardZoomReset = () => {
  const isZoomed = useFiltersStore((s) => s.customRange !== null);
  return (
    <ZoomResetButton
      isZoomed={isZoomed}
      onReset={() => useFiltersStore.getState().clearDashboardChartRange()}
    />
  );
};
