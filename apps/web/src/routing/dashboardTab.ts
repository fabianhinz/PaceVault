const DASHBOARD_TABS = ['dashboard', 'segments'] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

export const resolveDashboardTab = (rawTab: string | null): DashboardTab => {
  const tab = DASHBOARD_TABS.find((candidate) => candidate === rawTab);
  if (tab === undefined) return 'dashboard';
  return tab;
};
