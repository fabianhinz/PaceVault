import { m } from '@pacevault/i18n/messages.js';
import type { VolumeMetric } from '@/lib/filtering/dashboardVolume.ts';

export const LABEL_BY_VOLUME_METRIC: Record<VolumeMetric, () => string> = {
  distance: m.ui_volume_distance,
  duration: m.ui_volume_duration,
  elevation: m.ui_volume_elevation,
};
