import type { FC } from 'react';
import { Bug } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { buildIssueUrl } from '@/lib/crashReport.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';

interface ReportBugButtonProps {
  error: unknown;
}

export const ReportBugButton: FC<ReportBugButtonProps> = (props) => (
  <PvButton
    variant="secondary"
    onClick={() => {
      window.open(buildIssueUrl(props.error), '_blank', 'noopener,noreferrer');
    }}
  >
    <Bug className="size-4" />
    {m.ui_error_report_bug()}
  </PvButton>
);
