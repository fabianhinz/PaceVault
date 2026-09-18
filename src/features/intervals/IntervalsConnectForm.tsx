import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { verifyIntervalsKey } from '@/lib/intervals/activities.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { intervalsErrorMessage } from './intervalsErrorMessage.ts';

const SETTINGS_URL = 'https://intervals.icu/settings';

export const IntervalsConnectForm = () => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    const trimmed = apiKey.trim();
    if (trimmed.length === 0) return;

    setConnecting(true);
    setError(null);

    const result = await verifyIntervalsKey(trimmed);
    setConnecting(false);

    if (!result.ok) {
      setError(intervalsErrorMessage(result.code));
      return;
    }

    setApiKey('');
    useIntervalsStore.getState().connectIntervals(trimmed, result.data.firstname ?? null);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <ol className="flex flex-col gap-1 list-decimal list-inside">
        <li>
          <a
            href={SETTINGS_URL}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline inline-flex items-center gap-1"
          >
            {m.ui_intervals_connect_step1()}
            <ExternalLink size={12} />
          </a>
        </li>
        <li>
          <Typography variant="body1" as="span" color="textSecondary">
            {m.ui_intervals_connect_step2()}
          </Typography>
        </li>
        <li>
          <Typography variant="body1" as="span" color="textSecondary">
            {m.ui_intervals_connect_step3()}
          </Typography>
        </li>
      </ol>

      <div className="flex flex-col gap-2">
        <Typography variant="caption" color="textSecondary">
          {m.ui_intervals_connect_label()}
        </Typography>
        <Input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={m.ui_intervals_connect_placeholder()}
          value={apiKey}
          error={error !== null}
          helperText={error ?? undefined}
          disabled={connecting}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <Typography variant="caption" color="textSecondary">
        {m.ui_intervals_connect_storage_note()} {m.ui_intervals_connect_supported_note()}
      </Typography>

      <div className="flex justify-end">
        <Button
          onClick={handleConnect}
          loading={connecting}
          disabled={connecting || apiKey.trim().length === 0}
        >
          {connecting ? m.ui_intervals_connect_connecting() : m.ui_intervals_connect_submit()}
        </Button>
      </div>
    </div>
  );
};
