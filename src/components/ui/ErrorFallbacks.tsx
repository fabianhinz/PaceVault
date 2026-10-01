import type { ReactNode } from 'react';
import type { FallbackProps } from 'react-error-boundary';
import { Bug, RefreshCw, RotateCcw } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { buildIssueUrl } from '@/lib/crashReport.ts';
import { ActionPromptCard } from './ActionPromptCard.tsx';
import { Button } from './Button.tsx';

interface ReportBugButtonProps {
  error: unknown;
}

const ReportBugButton = (props: ReportBugButtonProps) => (
  <Button
    variant="secondary"
    onClick={() => {
      window.open(buildIssueUrl(props.error), '_blank', 'noopener,noreferrer');
    }}
  >
    <Bug className="size-4" />
    {m.ui_error_report_bug()}
  </Button>
);

interface FallbackActionsProps {
  children: ReactNode;
}

const FallbackActions = (props: FallbackActionsProps) => (
  <div className="flex w-full flex-col-reverse gap-3 *:w-full sm:w-auto sm:flex-row sm:justify-center sm:*:w-auto">
    {props.children}
  </div>
);

interface RootErrorFallbackProps {
  error: unknown;
}

export const RootErrorFallback = (props: RootErrorFallbackProps) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <ActionPromptCard
      title={m.ui_error_root_title()}
      description={m.ui_error_root_desc()}
      branded
      className="w-full max-w-2xl p-5"
    >
      <FallbackActions>
        <ReportBugButton error={props.error} />
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" />
          {m.ui_error_reload()}
        </Button>
      </FallbackActions>
    </ActionPromptCard>
  </div>
);

export const RouteErrorFallback = (props: FallbackProps) => (
  <ActionPromptCard
    title={m.ui_error_route_title()}
    description={m.ui_error_route_desc()}
    className="p-5"
  >
    <FallbackActions>
      <ReportBugButton error={props.error} />
      <Button onClick={props.resetErrorBoundary}>
        <RotateCcw className="size-4" />
        {m.ui_error_try_again()}
      </Button>
    </FallbackActions>
  </ActionPromptCard>
);
