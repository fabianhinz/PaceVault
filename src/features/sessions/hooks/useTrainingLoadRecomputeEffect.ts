import { useEffect, useRef } from 'react';
import { trainingLoadSignature } from '@/lib/sessionStress.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { recomputeTrainingLoad } from '../recomputeTrainingLoad.ts';

export const useTrainingLoadRecomputeEffect = () => {
  const signature = useUserStore((s) => trainingLoadSignature(s.profile));
  const phase = useSessionReprocessingStore((s) => s.phase);
  const recomputedFor = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== 'done' || recomputedFor.current === signature) return;
    recomputedFor.current = signature;
    recomputeTrainingLoad().catch((err: unknown) =>
      console.error('Recomputing training load failed:', err),
    );
  }, [phase, signature]);
};
