import { m } from '@pacevault/i18n/messages.js';
import type { TrackIntensity } from '@/store/mapPreferences.ts';

export const LABEL_BY_TRACK_INTENSITY: Record<TrackIntensity, () => string> = {
  faint: m.ui_track_intensity_faint,
  warm: m.ui_track_intensity_warm,
  hot: m.ui_track_intensity_hot,
};

export const DESCRIPTION_BY_TRACK_INTENSITY: Record<TrackIntensity, () => string> = {
  faint: m.ui_track_intensity_faint_desc,
  warm: m.ui_track_intensity_warm_desc,
  hot: m.ui_track_intensity_hot_desc,
};
