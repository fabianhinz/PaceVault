import type { FC, ReactNode } from 'react';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

interface PvPlotStripGroupProps {
  label: string;
  children: ReactNode;
}

export const PvPlotStripGroup: FC<PvPlotStripGroupProps> = (props) => (
  <div role="group" aria-label={props.label} className="flex flex-col gap-1">
    <PvTypography
      variant="caption"
      noWrap
      tabularNums
      className="sticky left-0 w-fit font-medium leading-none"
    >
      {props.label}
    </PvTypography>
    <div className="flex gap-1">{props.children}</div>
  </div>
);
