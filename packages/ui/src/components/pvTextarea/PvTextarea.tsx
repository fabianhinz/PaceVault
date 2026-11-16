import type { ComponentProps, FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { PvHelperText } from '../pvHelperText/PvHelperText.tsx';

interface PvTextareaProps extends ComponentProps<'textarea'> {
  helperText?: ReactNode;
  error?: boolean;
}

export const PvTextarea: FC<PvTextareaProps> = (props) => {
  const { className: _className, helperText: _helperText, error: _error, ...rest } = props;
  return (
    <div className="w-full">
      <textarea
        className={cn(
          'flex min-h-20 w-full resize-y rounded-lg border bg-overlay-subtle px-3 py-2 text-base lg:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50',
          props.error ? 'border-status-danger-strong' : 'border-divider',
          props.className,
        )}
        {...rest}
      />
      {props.helperText && <PvHelperText error={props.error}>{props.helperText}</PvHelperText>}
    </div>
  );
};
