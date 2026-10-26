import type { FC } from 'react';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart.tsx';
import { LoadChart } from '@/components/dashboard/LoadChart.tsx';
import { VolumeChart } from '@/components/dashboard/VolumeChart.tsx';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import { FormStatusCard } from '@/components/dashboard/FormStatusCard.tsx';
import { DashboardPeek } from '@/components/dashboard/DashboardPeek.tsx';
import { DashboardZoomReset } from '@/components/dashboard/DashboardZoomReset.tsx';

export const Dashboard: FC = () => {
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
