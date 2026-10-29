import { useState } from 'react';
import type { ThresholdKey } from '@/types.ts';
import { fieldErrorFor } from '@/components/settings/thresholdFieldErrors.ts';
import type { ThresholdsForm } from './types.ts';

interface ThresholdDraft {
  draft: string;
  setDraft: (draft: string) => void;
  visibleError: string;
  saveEnabled: boolean;
}

export const useThresholdDraft = ({
  field,
  thresholds,
}: {
  field: ThresholdKey;
  thresholds: ThresholdsForm;
}): ThresholdDraft => {
  const initial = thresholds.current[field];
  const [draft, setDraft] = useState(initial);
  const error = fieldErrorFor({ field, draft, values: thresholds.current });
  let visibleError = '';
  if (draft !== initial) visibleError = error;
  const saveEnabled = draft.trim() !== '' && error === '';
  return { draft, setDraft, visibleError, saveEnabled };
};
