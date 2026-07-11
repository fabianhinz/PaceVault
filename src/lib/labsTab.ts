export type LabsTab = 'studio' | 'tools' | 'training';

/**
 * Single source of truth for which labs tab a `?tab=` param selects — the
 * page and the map (which switches to studio routes on the studio tab) must
 * agree, including on the default when the param is missing or invalid.
 */
export const resolveLabsTab = (rawTab: string | null): LabsTab => {
  if (rawTab === 'studio' || rawTab === 'tools' || rawTab === 'training') {
    return rawTab;
  }
  return 'studio';
};
