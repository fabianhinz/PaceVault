import type { FC } from 'react';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import type { StatTileReading } from './types.ts';

export const PvStatTileReading: FC<StatTileReading> = (props) => (
  <PvTypography variant="h3" as="p" tabularNums noWrap>
    {props.value}
    {props.unit !== undefined && (
      <PvTypography variant="caption" className="ml-0.5 font-normal">
        {props.unit}
      </PvTypography>
    )}
  </PvTypography>
);
