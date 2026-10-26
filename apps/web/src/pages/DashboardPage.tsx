import type { FC } from 'react';
import { PerformanceChart } from '@/features/dashboard/PerformanceChart';
import { LoadChart } from '@/features/dashboard/LoadChart';
import { VolumeChart } from '@/features/dashboard/VolumeChart.tsx';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import { FormStatusCard } from '@/features/dashboard/FormStatusCard.tsx';
import { DashboardPeek } from '@/features/dashboard/DashboardPeek.tsx';
import { DashboardZoomReset } from '@/features/dashboard/DashboardZoomReset.tsx';

export const DashboardPage: FC = () => {
  return (
    <PvPageGrid>
      <DashboardPeek />
      <FormStatusCard />
      <PvChartsCard zoomReset={<DashboardZoomReset />}>
        <LoadChart />
        <VolumeChart />
        <PerformanceChart />
      </PvChartsCard>
    </PvPageGrid>
  );
};
