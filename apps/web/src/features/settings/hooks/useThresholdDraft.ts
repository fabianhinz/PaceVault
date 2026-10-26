import { useState } from 'react';
import type { ThresholdKey } from '@/store/user.ts';
import { fieldErrorFor, type ThresholdsForm } from './useThresholdsForm.ts';

interface ThresholdDraft {
  draft: string;
  setDraft: (draft: string) => void;
  visibleError: string;
  canSave: boolean;
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
  const canSave = draft.trim() !== '' && error === '';
  return { draft, setDraft, visibleError, canSave };
};
