import type { FC, ReactNode } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';

interface PanelProps {
  title: string;
  icon?: ReactNode;
  chip?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClose: () => void;
  children: ReactNode;
}

export const Panel: FC<PanelProps> = (props) => {
  const device = useDevice();
  const expanded = props.expanded && device.desktop;
  let expandLabel = 'Expand';
  if (expanded) expandLabel = 'Collapse';
  return (
    <PvCard
      floating
      role="region"
      aria-label={props.title}
      footer={props.footer}
      className={cn(
        'fixed inset-3 z-40 min-h-0 lg:inset-y-6 lg:right-6 lg:left-auto',
        // a full-screen stage inside (Stage.tsx): blur would make the panel the box `fixed` uses
        'has-[[data-stage-full]]:backdrop-blur-none',
        expanded && 'lg:left-6',
        !expanded && 'lg:w-[calc(40dvw-1.5rem)]',
      )}
    >
      <div className="flex shrink-0 items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {props.icon}
            <PvTypography variant="h3" as="h2" noWrap zeroMinWidth title={props.title}>
              {props.title}
            </PvTypography>
            {props.chip}
          </div>
          {props.meta !== undefined && (
            <PvTypography variant="caption" as="p">
              {props.meta}
            </PvTypography>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <PvButton
            variant="ghost"
            size="icon"
            aria-label={expandLabel}
            title={expandLabel}
            disabled={!device.desktop}
            onClick={() => props.onExpandedChange(!expanded)}
          >
            {expanded && <Minimize2 className="size-4" />}
            {!expanded && <Maximize2 className="size-4" />}
          </PvButton>
          <PvButton
            variant="ghost"
            size="icon"
            aria-label="Close"
            title="Close"
            onClick={props.onClose}
          >
            <X className="size-4" />
          </PvButton>
        </div>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col">{props.children}</div>
    </PvCard>
  );
};
