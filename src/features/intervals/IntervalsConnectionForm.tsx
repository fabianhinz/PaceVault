import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { toast } from '@/components/ui/toastStore.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { verifyIntervalsKey, type IntervalsErrorCode } from '@/lib/intervals.ts';
import { runIntervalsSync } from './runIntervalsSync.ts';
import { useIntervalsProgressStore } from './syncProgress.ts';
import { INTERVALS_SYNC_KEY } from './hooks/useIntervalsSync.ts';
import { IntervalsImportOverlay } from './IntervalsImportOverlay.tsx';

const SETTINGS_URL = 'https://intervals.icu/settings';

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
  const keyInvalid = useIntervalsStore((s) => s.keyInvalid);
  const hasProfile = useUserStore((s) => s.profile !== null);
  const processed = useIntervalsProgressStore((s) => s.processed);
  const total = useIntervalsProgressStore((s) => s.total);

  const [keyInput, setKeyInput] = useState(storedKey ?? '');
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const queryClient = useQueryClient();

  const handleImport = async () => {
    const trimmed = keyInput.trim();
    if (trimmed.length === 0) return;

    setManual(true);
    setError(null);

    const verified = await verifyIntervalsKey(trimmed);
    if (!verified.ok) {
      setError(errorMessage(verified.code));
      setManual(false);
      return;
    }

    useIntervalsProgressStore.getState().setIntervalsSyncForeground(true);
    useIntervalsStore.getState().connectIntervals(trimmed, verified.data.firstname ?? null);

    try {
      if (queryClient.getQueryState(INTERVALS_SYNC_KEY)?.fetchStatus === 'fetching') {
        await queryClient
          .fetchQuery({ queryKey: INTERVALS_SYNC_KEY, queryFn: () => runIntervalsSync() })
          .catch(() => undefined);
      }
      const summary = await queryClient.fetchQuery({
        queryKey: INTERVALS_SYNC_KEY,
        queryFn: () => runIntervalsSync({ full: true }),
        staleTime: 0,
      });
      if (summary.available === 0) {
        toast(m.toast_intervals_no_activities(), undefined, 'warning');
      } else if (summary.pending === 0) {
        toast(m.toast_intervals_up_to_date(), undefined, 'default');
      }

      if (useSessionsStore.getState().sessions.length > 0) props.onSynced?.();
    } catch (err) {
      if (err instanceof Error) setError(errorMessage(err.message as IntervalsErrorCode));
    } finally {
      useIntervalsProgressStore.getState().setIntervalsSyncForeground(false);
    }

    setManual(false);
  };

  let shownError = error;
  if (shownError === null && keyInvalid) shownError = m.ui_intervals_error_key();

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <Label htmlFor="intervals-api-key">{m.ui_intervals_connect_label()}</Label>
        <Input
          id="intervals-api-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={keyInput}
          error={shownError !== null}
          disabled={manual}
          onChange={(e) => setKeyInput(e.target.value)}
          helperText={
            shownError ?? (
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
            )
          }
        />
      </div>

      {props.children}

      <div className="flex justify-end">
        <Button
          onClick={handleImport}
          loading={manual}
          disabled={manual || keyInput.trim() === '' || !hasProfile}
        >
          {manual ? m.ui_intervals_importing_short() : m.ui_intervals_import_activities()}
        </Button>
      </div>

      {manual && total > 0 && <IntervalsImportOverlay processed={processed} total={total} />}
    </div>
  );
};
