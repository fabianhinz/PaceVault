import { useMemo } from 'react';
import { thresholdsAt, type ResolvedThresholds } from '@/lib/thresholdsAt.ts';
import { useUserStore } from '@/store/user.ts';

export const useThresholdsAt = (date: number): ResolvedThresholds | undefined => {
  const profile = useUserStore((s) => s.profile);
  return useMemo(() => {
    if (!profile) return undefined;
    return thresholdsAt({ profile, date });
  }, [profile, date]);
};
