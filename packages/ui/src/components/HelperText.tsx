import type { ReactNode } from 'react';
import { cn } from '../lib/cn.ts';

/** The line under a field: hint or error. `min-h-4` keeps it reserved while empty. */
export const HelperText = (props: { id?: string; error?: boolean; children?: ReactNode }) => (
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
