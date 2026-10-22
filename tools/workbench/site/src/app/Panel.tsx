import type { ReactNode } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Card } from '@pacevault/ui/components/Card.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';

type PanelProps = {
  title: string;
  icon?: ReactNode;
  chip?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClose: () => void;
  children: ReactNode;
};

/**
 * The one surface for an item and for the guide: a floating card placed like the app's content
 * column (24 px inset at 1280, over the board's title row). At 1280 it overlays the board at 40 %
 * and expands to the full width; below 1024 px it takes the whole width and Expand is disabled. Expand and Close sit top right at every width.
 */
export const Panel = (props: PanelProps) => {
  const device = useDevice();
  const expanded = props.expanded && device.isDesktop;
  let expandLabel = 'Expand';
  if (expanded) expandLabel = 'Collapse';
  return (
    <Card
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
            <Typography variant="h3" as="h2" noWrap zeroMinWidth title={props.title}>
              {props.title}
            </Typography>
            {props.chip}
          </div>
          {props.meta !== undefined && (
            <Typography variant="caption" as="p">
              {props.meta}
            </Typography>
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={expandLabel}
            title={expandLabel}
            disabled={!device.isDesktop}
            onClick={() => props.onExpandedChange(!expanded)}
          >
            {expanded && <Minimize2 className="size-4" />}
            {!expanded && <Maximize2 className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            title="Close"
            onClick={props.onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col">{props.children}</div>
    </Card>
  );
};
