import { m } from '@pacevault/i18n/messages.js';
import type { StudioMarkerType } from '@/types.ts';

export const ADD_LABEL_BY_STUDIO_MARKER_TYPE: Record<StudioMarkerType, () => string> = {
  track_modifier: m.ui_studio_marker_add_split,
  point_of_interest: m.ui_studio_marker_add_waypoint,
};
