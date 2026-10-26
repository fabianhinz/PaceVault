import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

interface PvChipProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const PvChip: FC<PvChipProps> = (props) => (
  <PvTypography
    variant="caption"
    as="span"
    title={props.title}
    className={cn('rounded bg-white/10 px-1.5 py-0.5', props.className)}
  >
    {props.children}
  </PvTypography>
);
