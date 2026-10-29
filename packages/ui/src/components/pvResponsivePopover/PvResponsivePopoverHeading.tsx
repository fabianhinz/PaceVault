import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

interface PvResponsivePopoverHeadingProps {
  icon: LucideIcon;
  title: string;
}

export const PvResponsivePopoverHeading: FC<PvResponsivePopoverHeadingProps> = (props) => (
  <div className="mb-3 flex items-center gap-2 text-text-tertiary max-lg:hidden">
    <props.icon size={14} />
    <PvTypography variant="caption">{props.title}</PvTypography>
  </div>
);
