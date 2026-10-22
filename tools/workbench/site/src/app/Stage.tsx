import { useState, type ReactNode, type Ref } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { floatingClass } from '@pacevault/ui/components/Card.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';

type StageProps = {
  label: string;
  path: string;
  className?: string;
  /** Shows the Full screen / Collapse button at the end of the label row. */
  expandable?: boolean;
  /** Controlled full-screen state (the Tech diagram); without it the stage keeps its own. */
  full?: boolean;
  onFullChange?: (full: boolean) => void;
  /** Buttons before Full screen / Collapse in the label row (e.g. the diagram's Reset view). */
  actions?: ReactNode;
  /** A control at the start of the label row, before the label (the Tech tab's Planned | Actual switch, R31). */
  lead?: ReactNode;
  bodyRef?: Ref<HTMLDivElement>;
  bodyClassName?: string;
  children?: ReactNode;
};

/**
 * The frame around foreign content (the mockup page, the review doc, a diagram at full size):
 * sunken, with a border and a small label, so it reads apart from the board's own UI (Q8 a).
 * Full screen is the same stage, fixed over the viewport (16 px inset, 24 px at 1280) as a floating
 * card like the panel (kit `floatingClass`, no scrim, R15);
 * the content stays the same DOM node, so an iframe keeps its page. A stage inside the panel
 * relies on the panel dropping its backdrop blur meanwhile (`data-stage-full`, `Panel.tsx`),
 * which would otherwise make the panel the box `fixed` is placed in.
 */
export const Stage = (props: StageProps) => {
  const [ownFull, setOwnFull] = useState(false);
  const full = props.full ?? ownFull;
  const setFull = (next: boolean) => {
    if (props.onFullChange !== undefined) props.onFullChange(next);
    if (props.full === undefined) setOwnFull(next);
  };
  let toggleLabel = 'Full screen';
  if (full) toggleLabel = 'Collapse';
  return (
    <>
      <div
        data-stage-full={full ? '' : undefined}
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-surface-sunken p-2',
          props.className,
          full && [floatingClass, 'fixed inset-4 z-50 h-auto rounded-2xl lg:inset-6'],
        )}
      >
        <div className="flex min-h-5 shrink-0 items-center gap-2 px-1">
          {props.lead}
          {props.label !== '' && <Typography variant="overline">{props.label}</Typography>}
          <Typography variant="caption" color="textTertiary" noWrap zeroMinWidth>
            {props.path}
          </Typography>
          {props.expandable === true && (
            <div className="-my-2 ml-auto flex shrink-0 items-center gap-1">
              {props.actions}
              <Button
                variant="ghost"
                size="icon"
                aria-label={toggleLabel}
                title={toggleLabel}
                onClick={() => setFull(!full)}
              >
                {full && <Minimize2 className="size-4" />}
                {!full && <Maximize2 className="size-4" />}
              </Button>
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
    </>
  );
};
