import type { FC, ReactNode } from 'react';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';

interface PlanSectionProps {
  title: string;
  count: string | undefined;
  children: ReactNode;
}

export const PlanSection: FC<PlanSectionProps> = (props) => (
  <section aria-label={props.title} className="mt-6">
    <div className="mb-2 flex items-center gap-2">
      <PvTypography variant="title" as="h3">
        {props.title}
      </PvTypography>
      {props.count !== undefined && <PvChip>{props.count}</PvChip>}
    </div>
    {props.children}
  </section>
);
