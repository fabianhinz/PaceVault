import type { FC } from 'react';
import { createPortal } from 'react-dom';
import { m } from '@pacevault/i18n/messages.js';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { OVERLAY_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { useImportProgressStore, type ForegroundImport } from '@/store/importProgress.ts';
import { ProgressRing } from '@/components/ProgressRing.tsx';
import {
  foregroundLabel,
  summaryDescription,
  summaryTitle,
} from '@/components/importProgressCopy.ts';
import { useMinOpenTimeReached } from '@/components/useMinOpenTimeReached.ts';

interface OverlayContentProps {
  foreground: ForegroundImport;
}

export const OverlayContent: FC<OverlayContentProps> = (props) => {
  const openedAt = props.foreground.openedAt;
  const minTimeReached = useMinOpenTimeReached(openedAt);
  const summary = props.foreground.summary;
  const awaitingTrackBuild = useImportProgressStore((s) => s.awaitingTrackBuild);
  const showSummary = summary !== null && minTimeReached && !awaitingTrackBuild;

  return createPortal(
    <div
      role={showSummary ? 'alertdialog' : 'status'}
      aria-modal={showSummary || undefined}
      aria-live={showSummary ? undefined : 'polite'}
      aria-busy={!showSummary}
      className={cn('fixed inset-0 z-50 grid place-items-center', OVERLAY_CLASS)}
    >
      {showSummary && summary !== null ? (
        <div
          data-testid="import-summary"
          className="grid max-w-sm place-items-center gap-3 px-6 text-center"
        >
          <PvTypography variant="h3">{summaryTitle(summary)}</PvTypography>
          <PvTypography variant="body1" color="textSecondary">
            {summaryDescription(summary)}
          </PvTypography>
          <PvButton
            autoFocus
            className="mt-3"
            onClick={() => useImportProgressStore.getState().dismissImport()}
          >
            {m.ui_btn_close()}
          </PvButton>
        </div>
      ) : (
        <div className="grid place-items-center gap-6">
          <PvTypography variant="subtitle1">{foregroundLabel(props.foreground)}</PvTypography>
          <ProgressRing foreground={props.foreground} />
        </div>
      )}
    </div>,
    document.body,
  );
};
