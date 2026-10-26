import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface PvHelperTextProps {
  id?: string;
  error?: boolean;
  children?: ReactNode;
}

export const PvHelperText: FC<PvHelperTextProps> = (props) => (
  <p
    id={props.id}
    className={cn(
      'mt-1 min-h-4 text-xs',
      props.error ? 'text-status-danger' : 'text-text-quaternary',
    )}
  >
    {props.children}
  </p>
);
