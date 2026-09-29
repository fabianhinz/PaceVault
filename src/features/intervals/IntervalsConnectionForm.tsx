import { useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { type IntervalsErrorCode } from '@/lib/intervals.ts';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue.ts';
import { runIntervalsSync } from './runIntervalsSync.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { INTERVALS_SYNC_KEY } from './hooks/useIntervalsSync.ts';
import { IntervalsStatusLine, type IntervalsKeyCheck } from './IntervalsStatusLine.tsx';
import {
  intervalsVerifyQueryKey,
  useIntervalsKeyCheck,
  verifyIntervalsKeyOrThrow,
} from './hooks/useIntervalsKeyCheck.ts';
import { Typography } from '@/components/ui/Typography.tsx';

const SETTINGS_URL = 'https://intervals.icu/settings';
const CHECK_DEBOUNCE_MS = 600;

const errorMessage = (code: IntervalsErrorCode): string => {
  if (code === 'unauthorized') return m.ui_intervals_error_key();
  if (code === 'rate-limited') return m.ui_intervals_error_rate_limited();
  if (code === 'network') return m.ui_intervals_error_network();
  return m.ui_intervals_error_generic();
};

interface IntervalsConnectionFormProps {
  onSynced?: () => void;
  children?: ReactNode;
}

export const IntervalsConnectionForm = (props: IntervalsConnectionFormProps) => {
  const storedKey = useIntervalsStore((s) => s.apiKey);
  const hasProfile = useUserStore((s) => s.profile !== null);

  const [keyInput, setKeyInput] = useState(storedKey ?? '');
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [pastedKey, setPastedKey] = useState<string | null>(null);
  const pastingRef = useRef(false);
  const queryClient = useQueryClient();

  const trimmedInput = keyInput.trim();
  const debouncedKey = useDebouncedValue(trimmedInput, CHECK_DEBOUNCE_MS);
  let candidateKey = debouncedKey;
  if (pastedKey === trimmedInput) candidateKey = pastedKey;
  const keyCheck = useIntervalsKeyCheck(candidateKey, storedKey);

  let check: IntervalsKeyCheck | null = null;
  const checkApplies =
    candidateKey === trimmedInput && trimmedInput !== '' && trimmedInput !== storedKey;
  if (checkApplies && keyCheck.isFetching) check = { kind: 'checking' };
  else if (checkApplies && keyCheck.isSuccess) check = { kind: 'valid' };
  else if (checkApplies && keyCheck.isError) {
    const code = keyCheck.error.message as IntervalsErrorCode;
    if (code === 'unauthorized') check = { kind: 'rejected' };
    else check = { kind: 'failed', message: errorMessage(code) };
  }

  const handleImport = async () => {
    const trimmed = keyInput.trim();
    if (trimmed.length === 0) return;

    setManual(true);
    setError(null);

    try {
      await queryClient.fetchQuery({
        queryKey: intervalsVerifyQueryKey(trimmed),
        queryFn: () => verifyIntervalsKeyOrThrow(trimmed),
        staleTime: Infinity,
        retry: false,
      });
    } catch (err) {
      if (err instanceof Error) setError(errorMessage(err.message as IntervalsErrorCode));
      setManual(false);
      return;
    }

    useImportProgressStore.getState().beginImport({ foreground: true });
    useIntervalsStore.getState().connectIntervals(trimmed);

    try {
      if (queryClient.getQueryState(INTERVALS_SYNC_KEY)?.fetchStatus === 'fetching') {
        await queryClient
          .fetchQuery({
            queryKey: INTERVALS_SYNC_KEY,
            queryFn: () => runIntervalsSync({ queryClient }),
          })
          .catch(() => undefined);
      }
      const summary = await queryClient.fetchQuery({
        queryKey: INTERVALS_SYNC_KEY,
        queryFn: () => runIntervalsSync({ queryClient, full: true, foreground: true }),
        staleTime: 0,
      });
      if (summary.available === 0) {
        useImportProgressStore.getState().finishImport({ kind: 'no-activities' });
      } else if (summary.pending === 0) {
        useImportProgressStore.getState().finishImport({ kind: 'nothing-new' });
      } else {
        useImportProgressStore.getState().finishImport({
          kind: 'imported',
          imported: summary.imported,
          duplicated: summary.duplicated,
          failed: summary.failed,
        });
      }

      if (useSessionsStore.getState().sessions.length > 0) props.onSynced?.();
    } catch (err) {
      let message: string = m.ui_intervals_error_generic();
      if (err instanceof Error) message = errorMessage(err.message as IntervalsErrorCode);
      useImportProgressStore.getState().finishImport({ kind: 'failed', message });
    }

    setManual(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-0.5">
        <Typography variant="subtitle1">{m.ui_onboarding_intervals_title()}</Typography>
        <IntervalsStatusLine error={error} check={check} />
      </div>

      <div>
        <Label htmlFor="intervals-api-key">{m.ui_intervals_connect_label()}</Label>
        <Input
          id="intervals-api-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={keyInput}
          disabled={manual}
          onPaste={() => {
            pastingRef.current = true;
          }}
          onChange={(e) => {
            setError(null);
            setKeyInput(e.target.value);
            if (pastingRef.current) setPastedKey(e.target.value.trim());
            pastingRef.current = false;
          }}
          helperText={
            <div className="flex gap-1 align-center text-accent">
              <Info size={16} strokeWidth={1.5} className="shrink-0" />
              <a
                href={SETTINGS_URL}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer hover:underline"
              >
                {m.ui_intervals_connect_help()}
              </a>
            </div>
          }
        />
      </div>

      {props.children}

      <div className="flex justify-end">
        <Button
          onClick={handleImport}
          loading={manual}
          disabled={
            manual ||
            trimmedInput === '' ||
            !hasProfile ||
            check?.kind === 'checking' ||
            check?.kind === 'rejected'
          }
        >
          {manual ? m.ui_intervals_importing_short() : m.ui_intervals_import_activities()}
        </Button>
      </div>
    </div>
  );
};
