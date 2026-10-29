import type { FC, PropsWithChildren } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';

export const EmptyNote: FC<PropsWithChildren> = (props) => (
  <PvTypography variant="caption" color="textTertiary" as="p">
    {props.children}
  </PvTypography>
);
