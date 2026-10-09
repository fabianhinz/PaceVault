import type { UserProfile } from '@/types/index.ts';

export const createDefaultProfile = (id: string): UserProfile => {
  return {
    id,
    gender: 'male',
    thresholds: {
      ftp: 305,
      maxHr: 203,
      restHr: 44,
    },
    showMetricHelp: true,
    createdAt: Date.now(),
  };
};
