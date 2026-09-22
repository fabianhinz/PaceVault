import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useUserStore } from '@/store/user.ts';
import {
  listIntervalsActivities,
  verifyIntervalsKey,
  MAX_ACTIVITIES_PER_IMPORT,
  type IntervalsActivity,
  type IntervalsErrorCode,
} from '@/lib/intervals.ts';
import { runIntervalsImport } from './runIntervalsImport.ts';
import { IntervalsImportOverlay } from './IntervalsImportOverlay.tsx';

const SETTINGS_URL = 'https://intervals.icu/settings';

const ACTIVITIES_QUERY_KEY = ['intervals-activities'];

const STALE_MS = 5 * 60 * 1000;

const errorMessage = (code: IntervalsErrorCode): string => {
  if (code === 'unauthorized') return m.ui_intervals_error_key();
  if (code === 'rate-limited') return m.ui_intervals_error_rate_limited();
  if (code === 'network') return m.ui_intervals_error_network();
  return m.ui_intervals_error_generic();
};

const fetchActivities = async (): Promise<IntervalsActivity[]> => {
  const key = useIntervalsStore.getState().apiKey ?? '';
  const listed = await listIntervalsActivities(key);
  if (!listed.ok) throw new Error(listed.code);
  return listed.data;
};

interface IntervalsConnectionFormProps {
  onImported?: (imported: number) => void;
  children?: ReactNode;
}

export const IntervalsConnectionForm = (props: IntervalsConnectionFormProps) => {
  const storedKey = useIntervalsStore((s) => s.apiKey);
  const importedIds = useIntervalsStore((s) => s.importedActivityIds);
  const hasProfile = useUserStore((s) => s.profile !== null);

  const [keyInput, setKeyInput] = useState(storedKey ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const queryClient = useQueryClient();

  const activities = useQuery({
    queryKey: ACTIVITIES_QUERY_KEY,
    queryFn: fetchActivities,
    enabled: storedKey !== null,
    staleTime: STALE_MS,
    retry: false,
  });

  const known = new Set(importedIds);
  const pending = (activities.data ?? []).filter((a) => !known.has(a.id));
  const overCap = pending.length > MAX_ACTIVITIES_PER_IMPORT;

  const handleImport = async () => {
    const trimmed = keyInput.trim();
    const profile = useUserStore.getState().profile;
    if (trimmed.length === 0 || !profile) return;

    setBusy(true);
    setError(null);

    const verified = await verifyIntervalsKey(trimmed);
    if (!verified.ok) {
      setError(errorMessage(verified.code));
      setBusy(false);
      return;
    }

    useIntervalsStore.getState().connectIntervals(trimmed, verified.data.firstname ?? null);

    try {
      const listed = await queryClient.fetchQuery({
        queryKey: ACTIVITIES_QUERY_KEY,
        queryFn: fetchActivities,
        staleTime: 0,
      });

      const alreadyImported = new Set(useIntervalsStore.getState().importedActivityIds);
      const batch = listed
        .filter((a) => !alreadyImported.has(a.id))
        .slice(0, MAX_ACTIVITIES_PER_IMPORT);

      setTotal(batch.length);
      setProcessed(0);

      const result = await runIntervalsImport(trimmed, profile, batch, setProcessed);
      useIntervalsStore.getState().recordIntervalsImported(result.importedActivityIds);
      if (result.fatal !== undefined) setError(errorMessage(result.fatal));

      await queryClient.invalidateQueries({ queryKey: ACTIVITIES_QUERY_KEY });
      props.onImported?.(result.imported);
    } catch (err) {
      if (err instanceof Error) setError(errorMessage(err.message as IntervalsErrorCode));
    }

    setBusy(false);
  };

  let listError: string | null = null;
  if (activities.error instanceof Error) {
    listError = errorMessage(activities.error.message as IntervalsErrorCode);
  }

  const shownError = error ?? listError;

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
          disabled={busy}
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

      <div className="flex flex-col justify-end gap-2">
        {!busy && overCap && (
          <Typography variant="body1" color="warning">
            {m.ui_intervals_over_cap({
              count: pending.length,
              cap: MAX_ACTIVITIES_PER_IMPORT,
            })}
          </Typography>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleImport}
            loading={busy}
            disabled={busy || keyInput.trim() === '' || !hasProfile}
          >
            {busy ? m.ui_intervals_importing_short() : m.ui_intervals_import_activities()}
          </Button>
        </div>
      </div>

      {busy && <IntervalsImportOverlay processed={processed} total={total} />}
    </div>
  );
};
