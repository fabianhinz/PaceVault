import type { FC, ReactNode } from 'react';
import { TILE_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';

interface ReviewSectionProps {
  title: string;
  chip: string | undefined;
  note: ReactNode;
  children: ReactNode;
}

export const ReviewSection: FC<ReviewSectionProps> = (props) => (
  <section aria-label={props.title} className={cn(TILE_CLASS, 'flex flex-col gap-2 p-4')}>
    <div className="flex items-center gap-2">
      <PvTypography variant="title" as="h3">
        {props.title}
      </PvTypography>
      {props.chip !== undefined && <PvChip>{props.chip}</PvChip>}
    </div>
    <PvTypography variant="caption" color="textTertiary" as="p">
      {props.note}
    </PvTypography>
    {props.children}
  </section>
);
