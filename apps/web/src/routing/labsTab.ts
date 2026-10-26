const LABS_TABS = ['studio', 'tools', 'training'] as const;
export type LabsTab = (typeof LABS_TABS)[number];

export const resolveLabsTab = (rawTab: string | null): LabsTab => {
  const tab = LABS_TABS.find((candidate) => candidate === rawTab);
  if (tab === undefined) return 'studio';
  return tab;
};
