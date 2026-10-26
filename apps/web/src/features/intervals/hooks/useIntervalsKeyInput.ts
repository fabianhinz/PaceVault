import { useRef, useState } from 'react';
import { intervalsErrorCode } from '@/lib/intervals.ts';
import { MESSAGE_BY_INTERVALS_ERROR } from '@/microcopy/intervals.ts';
import { INPUT_DEBOUNCE_MS, useDebouncedValue } from '@/lib/hooks/useDebouncedValue.ts';
import { useIntervalsKeyCheck } from '@/queries/intervals/useIntervalsKeyCheck.ts';
import type { IntervalsKeyCheck } from '@/features/intervals/types.ts';

interface IntervalsKeyInput {
  value: string;
  trimmed: string;
  check: IntervalsKeyCheck | null;
  markPaste: () => void;
  change: (value: string) => void;
}

const keyCheckFor = ({
  keyCheck,
  candidateKey,
  trimmedInput,
  storedKey,
}: {
  keyCheck: ReturnType<typeof useIntervalsKeyCheck>;
  candidateKey: string;
  trimmedInput: string;
  storedKey: string | null;
}): IntervalsKeyCheck | null => {
  let check: IntervalsKeyCheck | null = null;
  const checkApplies =
    candidateKey === trimmedInput && trimmedInput !== '' && trimmedInput !== storedKey;
  if (checkApplies && keyCheck.isFetching) check = { kind: 'checking' };
  else if (checkApplies && keyCheck.isSuccess) check = { kind: 'valid' };
  else if (checkApplies && keyCheck.isError) {
    const code = intervalsErrorCode(keyCheck.error);
    if (code === 'unauthorized') check = { kind: 'rejected' };
    else check = { kind: 'failed', message: MESSAGE_BY_INTERVALS_ERROR[code]() };
  }
  return check;
};

export const useIntervalsKeyInput = (storedKey: string | null): IntervalsKeyInput => {
  const [keyInput, setKeyInput] = useState(storedKey ?? '');
  const [pastedKey, setPastedKey] = useState<string | null>(null);
  const pastingRef = useRef(false);
  const trimmedInput = keyInput.trim();
  const debouncedKey = useDebouncedValue(trimmedInput, INPUT_DEBOUNCE_MS);
  let candidateKey = debouncedKey;
  if (pastedKey === trimmedInput) candidateKey = pastedKey;
  const keyCheck = useIntervalsKeyCheck({ apiKey: candidateKey, savedKey: storedKey });

  const markPaste = () => {
    pastingRef.current = true;
  };

  const change = (value: string) => {
    setKeyInput(value);
    if (pastingRef.current) setPastedKey(value.trim());
    pastingRef.current = false;
  };

  return {
    value: keyInput,
    trimmed: trimmedInput,
    check: keyCheckFor({ keyCheck, candidateKey, trimmedInput, storedKey }),
    markPaste,
    change,
  };
};
