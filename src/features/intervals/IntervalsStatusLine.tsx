import { CircleCheck, CircleDashed, CircleX, LoaderCircle } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Typography } from '@/components/ui/Typography.tsx';
import { useIntervalsStore } from '@/store/intervals.ts';

export type IntervalsKeyCheck =
  | { kind: 'checking' }
  | { kind: 'valid' }
  | { kind: 'rejected' }
  | { kind: 'failed'; message: string };

interface IntervalsStatusLineProps {
  error: string | null;
  check: IntervalsKeyCheck | null;
}

const ErrorLine = (props: { message: string }) => (
  <Typography variant="caption" color="error" className="flex items-center gap-1.5">
    <CircleX size={14} className="shrink-0" />
    {props.message}
  </Typography>
);

export const IntervalsStatusLine = (props: IntervalsStatusLineProps) => {
  const connected = useIntervalsStore((s) => s.apiKey !== null);
  const keyInvalid = useIntervalsStore((s) => s.keyInvalid);

  if (props.error !== null) return <ErrorLine message={props.error} />;

  if (props.check?.kind === 'checking') {
    return (
      <Typography variant="caption" color="textTertiary" className="flex items-center gap-1.5">
        <LoaderCircle size={14} className="shrink-0 animate-spin" />
        {m.ui_integration_status_checking()}
      </Typography>
    );
  }
  if (props.check?.kind === 'valid') {
    return (
      <Typography variant="caption" color="success" className="flex items-center gap-1.5">
        <CircleCheck size={14} className="shrink-0" />
        {m.ui_integration_status_key_valid()}
      </Typography>
    );
  }
  if (props.check?.kind === 'rejected') {
    return <ErrorLine message={m.ui_integration_status_key_rejected()} />;
  }
  if (props.check?.kind === 'failed') return <ErrorLine message={props.check.message} />;

  if (keyInvalid) return <ErrorLine message={m.ui_integration_status_key_invalid()} />;

  if (!connected) {
    return (
      <Typography variant="caption" color="textTertiary" className="flex items-center gap-1.5">
        <CircleDashed size={14} className="shrink-0" />
        {m.ui_integration_status_not_connected()}
      </Typography>
    );
  }

  return (
    <Typography variant="caption" color="success" className="flex items-center gap-1.5">
      <CircleCheck size={14} className="shrink-0" />
      {m.ui_integration_status_connected()}
    </Typography>
  );
};
