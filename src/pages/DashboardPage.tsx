import { PerformanceChart } from '@/features/dashboard/PerformanceChart';
import { LoadChart } from '@/features/dashboard/LoadChart';
import { VolumeChart } from '@/features/dashboard/VolumeChart.tsx';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { ChartsCard } from '@/components/ui/ChartsCard.tsx';
import { FormStatusCard } from '@/features/dashboard/FormStatusCard.tsx';
import { DashboardPeek } from '@/features/dashboard/DashboardPeek.tsx';
import { DashboardZoomReset } from '@/features/dashboard/DashboardZoomReset.tsx';

export const DashboardPage = () => {
  return (
    <PageGrid>
      <DashboardPeek />
      <FormStatusCard />
      <ChartsCard zoomReset={<DashboardZoomReset />}>
        <LoadChart />
        <VolumeChart />
        <PerformanceChart />
      </ChartsCard>
    </PageGrid>
  );
};
