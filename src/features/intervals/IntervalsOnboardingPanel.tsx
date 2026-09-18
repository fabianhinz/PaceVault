import { m } from '@/paraglide/messages.js';
import { Typography } from '@/components/ui/Typography.tsx';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { IntervalsConnectForm } from './IntervalsConnectForm.tsx';
import { IntervalsImportPanel } from './IntervalsImportPanel.tsx';
import type { IntervalsImportResult } from './runIntervalsImport.ts';

export const IntervalsOnboardingPanel = () => {
  const connected = useIntervalsStore((s) => s.apiKey !== null);

  const handleImported = (result: IntervalsImportResult) => {
    if (result.imported > 0) {
      useLayoutStore.getState().completeOnboarding();
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Typography variant="subtitle1">{m.ui_intervals_connect_title()}</Typography>
        <IntervalsConnectForm />
      </div>
    );
  }

  return <IntervalsImportPanel onImported={handleImported} />;
};
