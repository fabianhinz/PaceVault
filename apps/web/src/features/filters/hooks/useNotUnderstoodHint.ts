import { INPUT_DEBOUNCE_MS, useDebouncedValue } from '@/lib/hooks/useDebouncedValue.ts';
import type { FilterCriteria } from '@/lib/savedFilters.ts';

export const useNotUnderstoodHint = ({
  text,
  interpretations,
}: {
  text: string;
  interpretations: FilterCriteria[];
}): boolean => {
  const notUnderstood = text !== '' && interpretations.length === 0;
  let notUnderstoodText = '';
  if (notUnderstood) {
    notUnderstoodText = text;
  }
  const pausedNotUnderstoodText = useDebouncedValue(notUnderstoodText, INPUT_DEBOUNCE_MS);
  return notUnderstood && pausedNotUnderstoodText !== '';
};
