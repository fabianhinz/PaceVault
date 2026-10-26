import type { FC } from 'react';
import { CircleX } from 'lucide-react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';

interface ErrorLineProps {
  message: string;
}

export const ErrorLine: FC<ErrorLineProps> = (props) => (
  <PvTypography variant="caption" color="error" className="flex items-center gap-1.5">
    <CircleX size={14} className="shrink-0" />
    {props.message}
  </PvTypography>
);
