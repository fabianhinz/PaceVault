import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import {
  useImportProgressStore,
  type ForegroundImport,
  type ImportPhase,
  type ImportSummary,
} from '@/store/importProgress.ts';

const MIN_OPEN_MS = 800;
const SIZE = 180;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const phaseLabel = (phase: ImportPhase): string => {
  if (phase === 'preparing') return m.ui_import_phase_preparing();
  if (phase === 'saving') return m.ui_import_phase_saving();
  return m.ui_import_phase_importing();
};

const foregroundLabel = (foreground: ForegroundImport): string => {
  if (foreground.task === 'reprocess') return m.ui_reprocess_updating();
  return phaseLabel(foreground.phase);
};

const importedTitle = (summary: Extract<ImportSummary, { kind: 'imported' }>): string => {
  if (summary.imported > 0) return m.ui_import_summary_imported_title();
  if (summary.failed > 0) return m.ui_import_summary_nothing_imported_title();
  return m.ui_import_summary_nothing_new_title();
};

const summaryTitle = (summary: ImportSummary): string => {
  if (summary.kind === 'imported') return importedTitle(summary);
  if (summary.kind === 'nothing-new') return m.ui_import_summary_nothing_new_title();
  if (summary.kind === 'no-activities') return m.ui_import_summary_no_activities_title();
  return m.ui_import_summary_failed_title();
};

const importedLine = (summary: Extract<ImportSummary, { kind: 'imported' }>): string => {
  const parts: string[] = [];
  if (summary.imported === 1) parts.push(m.ui_import_summary_new({ count: summary.imported }));
  else parts.push(m.ui_import_summary_new_plural({ count: summary.imported }));
  if (summary.duplicated === 1) {
    parts.push(m.ui_import_summary_duplicates({ count: summary.duplicated }));
  } else if (summary.duplicated > 1) {
    parts.push(m.ui_import_summary_duplicates_plural({ count: summary.duplicated }));
  }
  if (summary.failed > 0) parts.push(m.ui_import_summary_failed({ count: summary.failed }));
  return parts.join(' · ');
};

const summaryDescription = (summary: ImportSummary): string => {
  if (summary.kind === 'imported') return importedLine(summary);
  if (summary.kind === 'nothing-new') return m.ui_import_summary_nothing_new_desc();
  if (summary.kind === 'no-activities') return m.toast_intervals_no_activities_desc();
  return summary.message;
};

const ProgressRing = (props: { foreground: ForegroundImport }) => {
  const preparing = props.foreground.phase === 'preparing';
  let fraction = 0;
  if (props.foreground.total > 0) {
    fraction = Math.min(props.foreground.processed / props.foreground.total, 1);
  }
  let offset = CIRCUMFERENCE * (1 - fraction);
  if (preparing) offset = CIRCUMFERENCE * 0.75;

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className={cn('-rotate-90', preparing && 'animate-spin')}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-white/10"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            'stroke-accent',
            !preparing && 'transition-[stroke-dashoffset] duration-300',
          )}
        />
      </svg>

      {!preparing && (
        <div className="absolute inset-0 grid place-items-center">
          <Typography variant="h3" tabularNums>
            {m.ui_import_progress({
              processed: props.foreground.processed,
              total: props.foreground.total,
            })}
          </Typography>
        </div>
      )}
    </div>
  );
};

const OverlayContent = (props: { foreground: ForegroundImport }) => {
  const [minTimeReached, setMinTimeReached] = useState(false);
  const openedAt = props.foreground.openedAt;
  const summary = props.foreground.summary;
  const showSummary = summary !== null && minTimeReached;

  useEffect(() => {
    const remaining = Math.max(0, openedAt + MIN_OPEN_MS - Date.now());
    const timeout = setTimeout(() => setMinTimeReached(true), remaining);
    return () => clearTimeout(timeout);
  }, [openedAt]);

  return createPortal(
    <div
      role={showSummary ? 'alertdialog' : 'status'}
      aria-modal={showSummary || undefined}
      aria-live={showSummary ? undefined : 'polite'}
      aria-busy={!showSummary}
      className="fixed inset-0 z-50 grid place-items-center bg-surface-base/85 backdrop-blur-sm"
    >
      {showSummary && summary !== null ? (
        <div
          data-testid="import-summary"
          className="grid max-w-sm place-items-center gap-3 px-6 text-center"
        >
          <Typography variant="h3">{summaryTitle(summary)}</Typography>
          <Typography variant="body1" color="textSecondary">
            {summaryDescription(summary)}
          </Typography>
          <Button
            autoFocus
            className="mt-3"
            onClick={() => useImportProgressStore.getState().dismissImport()}
          >
            {m.ui_import_close()}
          </Button>
        </div>
      ) : (
        <div className="grid place-items-center gap-6">
          <Typography variant="subtitle1">{foregroundLabel(props.foreground)}</Typography>
          <ProgressRing foreground={props.foreground} />
        </div>
      )}
    </div>,
    document.body,
  );
};

export const ImportProgressOverlay = () => {
  const foreground = useImportProgressStore((s) => s.foreground);
  if (foreground === null) return null;
  return <OverlayContent key={foreground.openedAt} foreground={foreground} />;
};
