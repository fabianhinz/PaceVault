import type { FC, ReactNode } from 'react';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

interface PvActionItemContentProps {
  avatar: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  value?: ReactNode;
  valueCaption?: ReactNode;
}

export const PvActionItemContent: FC<PvActionItemContentProps> = (props) => (
  <>
    {props.avatar}
    <span className="min-w-0 flex-1">
      <PvTypography variant="subtitle1" className="truncate">
        {props.primary}
      </PvTypography>
      {props.secondary !== undefined && (
        <PvTypography variant="caption" as="p" tabularNums className="truncate">
          {props.secondary}
        </PvTypography>
      )}
    </span>
    {props.value !== undefined && (
      <span className="shrink-0 text-right">
        <PvTypography variant="subtitle1" as="p" tabularNums noWrap>
          {props.value}
        </PvTypography>
        {props.valueCaption !== undefined && (
          <PvTypography variant="caption" as="p" color="textTertiary" noWrap>
            {props.valueCaption}
          </PvTypography>
        )}
      </span>
    )}
  </>
);
