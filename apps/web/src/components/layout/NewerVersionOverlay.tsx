import { createPortal } from 'react-dom';
import { m } from '@pacevault/i18n/messages.js';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';

export const NewerVersionOverlay = () => {
  const newerVersion = useSessionReprocessingStore((s) => s.newerVersionInOtherTab);
  if (!newerVersion) return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal
      className="fixed inset-0 z-50 grid place-items-center bg-surface-base/85 backdrop-blur-sm"
    >
      <div className="grid max-w-sm place-items-center gap-3 px-6 text-center">
        <Typography variant="h3">{m.ui_newer_version_title()}</Typography>
        <Typography variant="body1" color="textSecondary">
          {m.ui_newer_version_desc()}
        </Typography>
        <Button autoFocus className="mt-3" onClick={() => window.location.reload()}>
          {m.ui_newer_version_reload()}
        </Button>
      </div>
    </div>,
    document.body,
  );
};
