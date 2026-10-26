import type { FC } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { CircleCheck, CircleDashed } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { useIntervalsStore } from '@/store/intervals.ts';
import { intervalsSyncQueryKey } from '@/queries/intervals/useIntervalsSync.ts';
import type { IntervalsKeyCheck } from './types.ts';
import { ErrorLine } from './ErrorLine.tsx';
import { LoadingLine } from './LoadingLine.tsx';

interface IntervalsStatusLineProps {
  error: string | null;
  check: IntervalsKeyCheck | null;
}

export const IntervalsStatusLine: FC<IntervalsStatusLineProps> = (props) => {
  const connected = useIntervalsStore((s) => s.apiKey !== null);
  const keyInvalid = useIntervalsStore((s) => s.keyInvalid);
  const syncing = useIsFetching({ queryKey: intervalsSyncQueryKey() }) > 0;

  if (props.error !== null) return <ErrorLine message={props.error} />;

  if (props.check?.kind === 'checking') {
    return <LoadingLine message={m.ui_integration_status_checking()} />;
  }
  if (props.check?.kind === 'valid') {
    return (
      <PvTypography variant="caption" color="success" className="flex items-center gap-1.5">
        <CircleCheck size={14} className="shrink-0" />
        {m.ui_integration_status_key_valid()}
      </PvTypography>
    );
  }
  if (props.check?.kind === 'rejected') {
    return <ErrorLine message={m.ui_integration_status_key_rejected()} />;
  }
  if (props.check?.kind === 'failed') return <ErrorLine message={props.check.message} />;

  if (syncing) return <LoadingLine message={m.ui_integration_status_syncing()} />;

  if (keyInvalid) return <ErrorLine message={m.ui_integration_status_key_invalid()} />;

  if (!connected) {
    return (
      <PvTypography variant="caption" color="textTertiary" className="flex items-center gap-1.5">
        <CircleDashed size={14} className="shrink-0" />
        {m.ui_integration_status_not_connected()}
      </PvTypography>
    );
  }

  return (
    <PvTypography variant="caption" color="success" className="flex items-center gap-1.5">
      <CircleCheck size={14} className="shrink-0" />
      {m.ui_integration_status_connected()}
    </PvTypography>
  );
};
