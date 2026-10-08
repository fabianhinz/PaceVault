import { describe, it, expect } from 'vitest';
import { formatDashboardDate } from '@/features/dashboard/dashboardDate.ts';

describe('formatDashboardDate', () => {
  it('formats days and month buckets in the same numeric style with a four-digit year', () => {
    expect(formatDashboardDate('2024-06-13')).toBe('6/13/2024');
    expect(formatDashboardDate('2024-06')).toBe('6/2024');
  });
});
