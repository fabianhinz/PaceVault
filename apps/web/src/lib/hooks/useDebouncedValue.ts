import { useState } from 'react';
import { useDebounce } from 'react-use';

export const INPUT_DEBOUNCE_MS = 600;

export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useDebounce(() => setDebounced(value), delayMs, [value]);

  return debounced;
};
