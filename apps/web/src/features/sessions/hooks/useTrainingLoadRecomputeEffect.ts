import { useEffect, useRef } from 'react';
import { trainingLoadFtpSignature, trainingLoadHrSignature } from '@/lib/sessionStress.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { recomputeTrainingLoad } from '../recomputeTrainingLoad.ts';

export const useTrainingLoadRecomputeEffect = () => {
  // Two string selectors: an object or tuple selector returns a new value on every call and
  // re-renders forever under zustand 5.
  const hrSignature = useUserStore((s) => trainingLoadHrSignature(s.profile));
  const ftpSignature = useUserStore((s) => trainingLoadFtpSignature(s.profile));
  const phase = useSessionReprocessingStore((s) => s.phase);
  const recomputedFor = useRef<string | null>(null);

  useEffect(() => {
    const signature = JSON.stringify([hrSignature, ftpSignature]);
    if (phase !== 'done' || recomputedFor.current === signature) return;
    recomputedFor.current = signature;
    // The HR part is compared against the applied HR values in the sessions store, which are
    // written only after a successful recompute: a failed run is redone on the next start.
    recomputeTrainingLoad().catch((err: unknown) => {
      recomputedFor.current = null;
      console.error('Recomputing training load failed:', err);
    });
  }, [phase, hrSignature, ftpSignature]);
};
