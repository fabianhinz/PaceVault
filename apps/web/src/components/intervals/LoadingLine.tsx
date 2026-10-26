import type { FC } from 'react';
import { LoaderCircle } from 'lucide-react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';

interface LoadingLineProps {
  message: string;
}

export const LoadingLine: FC<LoadingLineProps> = (props) => (
  <PvTypography variant="caption" color="textTertiary" className="flex items-center gap-1.5">
    <LoaderCircle size={14} className="shrink-0 animate-spin" />
    {props.message}
  </PvTypography>
);
