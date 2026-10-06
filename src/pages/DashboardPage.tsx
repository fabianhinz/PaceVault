import { PerformanceChart } from '@/features/dashboard/PerformanceChart';
import { LoadChart } from '@/features/dashboard/LoadChart';
import { TrainingSummaryCard } from '@/features/dashboard/TrainingSummaryCard.tsx';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { FormStatusCard } from '@/features/dashboard/FormStatusCard.tsx';
import { DashboardPeek } from '@/features/dashboard/DashboardPeek.tsx';
import { DashboardZoomReset } from '@/features/dashboard/DashboardZoomReset.tsx';

export const DashboardPage = () => {
  return (
    <PageGrid>
      <DashboardPeek />
      <FormStatusCard />
      <div>
        <DashboardZoomReset />
        <div className="flex flex-col gap-4">
          <LoadChart />
          <PerformanceChart />
        </div>
      </div>
      <TrainingSummaryCard />
    </PageGrid>
  );
};
