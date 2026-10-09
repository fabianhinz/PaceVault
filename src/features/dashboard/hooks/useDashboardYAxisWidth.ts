import { volumeYAxisWidth } from '@/lib/dashboardVolume.ts';
import type { DashboardAxis } from './useDashboardAxis.ts';
import { useVolumeSeries } from './useVolumeSeries.ts';

export const useDashboardYAxisWidth = (axis: DashboardAxis): number =>
  volumeYAxisWidth(useVolumeSeries(axis).ticks);
