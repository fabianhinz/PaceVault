import { useState } from 'react';
import { CloudDownload } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import type { ImportRange } from '@/lib/intervals/intervalsDates.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useIntervalsPreview } from './hooks/useIntervalsPreview.ts';
import { useIntervalsImport } from './hooks/useIntervalsImport.ts';
import { intervalsErrorMessage } from './intervalsErrorMessage.ts';
import { IntervalsImportAllDialog } from './IntervalsImportAllDialog.tsx';
import type { IntervalsImportResult } from './runIntervalsImport.ts';

const RANGES: Array<{ value: ImportRange; label: () => string }> = [
  { value: '30d', label: () => m.ui_intervals_range_30d() },
  { value: '12m', label: () => m.ui_intervals_range_12m() },
  { value: 'all', label: () => m.ui_intervals_range_all() },
];

interface IntervalsImportPanelProps {
  onImported?: (result: IntervalsImportResult) => void;
}

export const IntervalsImportPanel = (props: IntervalsImportPanelProps) => {
  const athleteFirstName = useIntervalsStore((s) => s.athleteFirstName);
  const [range, setRange] = useState<ImportRange>('30d');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const preview = useIntervalsPreview(range);
  const importer = useIntervalsImport();

  const startImport = async () => {
    const result = await importer.run(range);
    if (result && result.fatal === undefined) props.onImported?.(result);
  };

  const handleImportClick = () => {
    if (range === 'all') {
      setConfirmOpen(true);
      return;
    }
    void startImport();
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    await startImport();
  };

  let connectedLabel = m.ui_intervals_connected();
  if (athleteFirstName !== null) {
    connectedLabel = m.ui_intervals_connected_as({ name: athleteFirstName });
  }

  const data = preview.data;
  const importable = data?.importable ?? 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      <Typography variant="subtitle1">{connectedLabel}</Typography>

      {preview.isPending && (
        <Typography variant="body1" color="textSecondary">
          {m.ui_intervals_preview_loading()}
        </Typography>
      )}

      {data?.error !== undefined && (
        <Typography variant="body1" color="error">
          {intervalsErrorMessage(data.error)}
        </Typography>
      )}

      {data !== undefined && data.error === undefined && (
        <div className="flex flex-col gap-2">
          <Typography variant="subtitle2">
            {m.ui_intervals_preview_found({ count: data.totalListed })}
          </Typography>
          <dl className="flex flex-col gap-1">
            <PreviewRow count={data.importable} label={m.ui_intervals_preview_importable()} />
            {data.unsupported > 0 && (
              <PreviewRow count={data.unsupported} label={m.ui_intervals_preview_unsupported()} />
            )}
            {data.unavailable > 0 && (
              <PreviewRow count={data.unavailable} label={m.ui_intervals_preview_unavailable()} />
            )}
            {data.alreadyImported > 0 && (
              <PreviewRow count={data.alreadyImported} label={m.ui_intervals_preview_already()} />
            )}
          </dl>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Typography variant="caption" color="textSecondary">
          {m.ui_intervals_range_label()}
        </Typography>
        <div className="flex rounded-lg border border-white/10 overflow-hidden w-fit">
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={importer.uploading}
              onClick={() => setRange(option.value)}
              className={cn(
                'px-4 py-2 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed',
                range === option.value
                  ? 'bg-white text-zinc-900'
                  : 'bg-white/5 text-text-secondary hover:bg-white/10',
              )}
            >
              {option.label()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleImportClick}
          loading={importer.uploading}
          disabled={importer.uploading || importable === 0}
        >
          <CloudDownload size={16} />
          {importable === 0
            ? m.ui_intervals_import_nothing()
            : m.ui_intervals_import_submit({ count: importable })}
        </Button>
      </div>

      <IntervalsImportAllDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        count={importable}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

interface PreviewRowProps {
  count: number;
  label: string;
}

const PreviewRow = (props: PreviewRowProps) => (
  <div className="flex gap-2 items-baseline">
    <Typography variant="body1" tabularNums className="w-10 text-right">
      {props.count}
    </Typography>
    <Typography variant="body1" color="textSecondary">
      {props.label}
    </Typography>
  </div>
);
