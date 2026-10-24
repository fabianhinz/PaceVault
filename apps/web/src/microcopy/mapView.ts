import { m } from '@pacevault/i18n/messages.js';
import type { MapView } from '@/store/mapControls.ts';

export const LABEL_BY_MAP_VIEW: Record<MapView, () => string> = {
  '2d': m.ui_map_view_2d,
  '3d': m.ui_map_view_3d,
};

export const DESCRIPTION_BY_MAP_VIEW: Record<MapView, () => string> = {
  '2d': m.ui_map_view_2d_desc,
  '3d': m.ui_map_view_3d_desc,
};
