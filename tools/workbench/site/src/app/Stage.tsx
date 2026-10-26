import { useState, type ReactNode, type Ref, type FC } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { FLOATING_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';

interface StageProps {
  label: string;
  path: string;
  className?: string;
  expandable?: boolean;
  full?: boolean;
  onFullChange?: (full: boolean) => void;
  actions?: ReactNode;
  lead?: ReactNode;
  bodyRef?: Ref<HTMLDivElement>;
  bodyClassName?: string;
  children?: ReactNode;
}

/**
 * The content stays the same DOM node, so an iframe keeps its page. A stage inside the panel
 * relies on the panel dropping its backdrop blur meanwhile (`data-stage-full`, `Panel.tsx`),
 * which would otherwise make the panel the box `fixed` is placed in.
 */
export const Stage: FC<StageProps> = (props) => {
  const [ownFull, setOwnFull] = useState(false);
  const full = props.full ?? ownFull;
  const setFull = (next: boolean) => {
    if (props.onFullChange !== undefined) props.onFullChange(next);
    if (props.full === undefined) setOwnFull(next);
  };
  let toggleLabel = 'Full screen';
  if (full) toggleLabel = 'Collapse';
  return (
    <div
      data-stage-full={full ? '' : undefined}
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-surface-sunken p-2',
        props.className,
        full && [FLOATING_CLASS, 'fixed inset-4 z-50 h-auto rounded-2xl lg:inset-6'],
      )}
    >
      <div className="flex min-h-5 shrink-0 items-center gap-2 px-1">
        {props.lead}
        {props.label !== '' && <PvTypography variant="overline">{props.label}</PvTypography>}
        <PvTypography variant="caption" color="textTertiary" noWrap zeroMinWidth>
          {props.path}
        </PvTypography>
        {props.expandable === true && (
          <div className="-my-2 ml-auto flex shrink-0 items-center gap-1">
            {props.actions}
            <PvButton
              variant="ghost"
              size="icon"
              aria-label={toggleLabel}
              title={toggleLabel}
              onClick={() => setFull(!full)}
            >
              {full && <Minimize2 className="size-4" />}
              {!full && <Maximize2 className="size-4" />}
            </PvButton>
          </div>
        )}
      </div>
      <div
        ref={props.bodyRef}
        className={cn(
          'relative min-h-0 flex-1 overflow-hidden rounded-md border border-white/10',
          props.bodyClassName,
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
