import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';
import { Typography } from './Typography.tsx';

export const Chip = (props: { children: ReactNode; className?: string; title?: string }) => (
  <Typography
    variant="caption"
    as="span"
    title={props.title}
    className={cn('rounded bg-white/10 px-1.5 py-0.5', props.className)}
  >
    {props.children}
  </Typography>
);
