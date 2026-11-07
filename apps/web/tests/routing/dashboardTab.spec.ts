import { describe, it, expect } from 'vite-plus/test';
import { resolveDashboardTab } from '@/routing/dashboardTab.ts';

describe(resolveDashboardTab.name, () => {
  it('returns each valid tab as-is', () => {
    expect(resolveDashboardTab('dashboard')).toBe('dashboard');
    expect(resolveDashboardTab('segments')).toBe('segments');
  });

  it('falls back to the dashboard tab when the param is missing or unknown', () => {
    expect(resolveDashboardTab(null)).toBe('dashboard');
    expect(resolveDashboardTab('bogus')).toBe('dashboard');
  });
});
