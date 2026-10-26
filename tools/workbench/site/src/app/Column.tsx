import type { DragEvent, ReactNode, FC } from 'react';
import { Lock } from 'lucide-react';
import { GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { LABEL_BY_BUCKET, type Bucket } from '@site/lib/vocabulary.ts';
import { StatusIcon } from './StatusIcon.tsx';

const GATE_TITLE = 'Owner gate: only you set this status';

interface ColumnProps {
  bucket: Bucket;
  phase: string | undefined;
  count: number | undefined;
  gate: boolean;
  dimmed: boolean;
  target: boolean;
  sticky?: boolean;
  action?: ReactNode;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
  children: ReactNode;
}

export const Column: FC<ColumnProps> = (props) => (
  <section
    aria-label={LABEL_BY_BUCKET[props.bucket]}
    data-col={props.bucket}
    onDragOver={props.onDragOver}
    onDragLeave={props.onDragLeave}
    onDrop={props.onDrop}
    className={cn(
      'flex min-h-0 min-w-56 flex-1 basis-0 flex-col gap-2 transition-opacity',
      props.phase !== undefined && 'ml-2',
      props.sticky === true && 'sticky left-0 z-10',
      props.dimmed && 'opacity-40',
    )}
  >
    {props.sticky !== true && (
      <PvTypography variant="overline" className="h-4 pl-1">
        {props.phase}
      </PvTypography>
    )}
    <div
      className={cn(
        GLASS_CLASS,
        'flex min-h-0 flex-1 flex-col rounded-2xl p-2',
        props.target && 'ring-2 ring-accent',
      )}
    >
      <h2 className="flex shrink-0 items-center gap-2 px-1 pt-1 pb-2">
        <StatusIcon bucket={props.bucket} className="text-text-quaternary" />
        <PvTypography variant="subtitle2" noWrap zeroMinWidth>
          {LABEL_BY_BUCKET[props.bucket]}
        </PvTypography>
        {props.count !== undefined && <PvChip className="ml-auto">{props.count}</PvChip>}
        {props.gate && (
          <span title={GATE_TITLE} aria-label={GATE_TITLE} role="img">
            <Lock className="size-3 text-text-tertiary" aria-hidden="true" />
          </span>
        )}
        {props.action}
      </h2>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
        {props.children}
      </div>
    </div>
  </section>
);
