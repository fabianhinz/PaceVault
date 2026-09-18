import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, RotateCcw, Plug, Unplug } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { toast } from '@/components/ui/toastStore.ts';
import { formatDate } from '@/lib/formatters.ts';
import { verifyIntervalsKey } from '@/lib/intervals/activities.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { IntervalsConnectForm } from './IntervalsConnectForm.tsx';
import { IntervalsDisconnectDialog } from './IntervalsDisconnectDialog.tsx';
import { useIntervalsImport } from './hooks/useIntervalsImport.ts';
import { intervalsErrorMessage } from './intervalsErrorMessage.ts';
import { intervalsKeys } from './intervalsKeys.ts';

export const IntervalsConnectionCard = () => {
  const connected = useIntervalsStore((s) => s.apiKey !== null);
  const athleteFirstName = useIntervalsStore((s) => s.athleteFirstName);
  const lastSyncedAt = useIntervalsStore((s) => s.lastSyncedAt);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const importer = useIntervalsImport();
  const queryClient = useQueryClient();

  const handleDisconnect = () => {
    useIntervalsStore.getState().disconnectIntervals();
    queryClient.removeQueries({ queryKey: intervalsKeys.all });
    setDisconnectOpen(false);
  };

  const handleTest = async () => {
    const apiKey = useIntervalsStore.getState().apiKey;
    if (apiKey === null) return;

    const result = await verifyIntervalsKey(apiKey);
    if (result.ok) {
      toast(m.toast_intervals_test_ok(), undefined, 'success');
      return;
    }
    toast(intervalsErrorMessage(result.code), undefined, 'error');
  };

  const handleReimportAll = async () => {
    useIntervalsStore.getState().resetIntervalsHistory();
    await importer.run('all');
  };

  if (!connected) {
    return (
      <Card>
        <CardHeader title={m.ui_intervals_card_title()} subtitle={m.ui_intervals_card_note()} />
        <IntervalsConnectForm />
      </Card>
    );
  }

  let lastSyncedLabel: string = m.ui_intervals_card_never_synced();
  if (lastSyncedAt !== null) {
    lastSyncedLabel = formatDate(lastSyncedAt, { includeTime: true });
  }

  return (
    <>
      <Card>
        <CardHeader title={m.ui_intervals_card_title()} subtitle={m.ui_intervals_card_note()} />
        <List>
          <ListItem primary={m.ui_intervals_card_account()}>
            <Typography variant="body1">
              {athleteFirstName ?? m.ui_intervals_connected()}
            </Typography>
          </ListItem>
          <ListItem primary={m.ui_intervals_card_last_synced()}>
            <Typography variant="body1">{lastSyncedLabel}</Typography>
          </ListItem>
          <ListItem
            primary={m.ui_intervals_card_sync()}
            secondary={m.ui_intervals_card_sync_desc()}
            icon={<RefreshCw size={16} />}
            onClick={() => void importer.run('sync')}
          />
          <ListItem
            primary={m.ui_intervals_card_test()}
            secondary={m.ui_intervals_card_test_desc()}
            icon={<Plug size={16} />}
            onClick={() => void handleTest()}
          />
          <ListItem
            primary={m.ui_intervals_card_reimport()}
            secondary={m.ui_intervals_card_reimport_desc()}
            icon={<RotateCcw size={16} />}
            onClick={() => void handleReimportAll()}
          />
          <ListItem
            primary={m.ui_intervals_card_disconnect()}
            secondary={m.ui_intervals_card_disconnect_desc()}
            icon={<Unplug size={16} />}
            onClick={() => setDisconnectOpen(true)}
          />
        </List>
      </Card>

      <IntervalsDisconnectDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        onConfirm={handleDisconnect}
      />
    </>
  );
};
