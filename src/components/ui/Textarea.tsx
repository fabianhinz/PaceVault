import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  helperText?: ReactNode;
  error?: boolean;
}

export const Textarea = (props: TextareaProps) => {
  const { className, helperText, error, ...rest } = props;
  return (
    <div className="w-full">
      <textarea
        className={cn(
          'flex min-h-20 w-full resize-y rounded-lg border bg-white/5 px-3 py-2 text-base lg:text-sm text-text-primary placeholder:text-text-quaternary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-sunken disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-status-danger-strong' : 'border-white/10',
          className,
        )}
        {...rest}
      />
      {helperText && (
        <p className={cn('mt-1 text-xs', error ? 'text-status-danger' : 'text-text-quaternary')}>
          {helperText}
        </p>
      )}
    </div>
  );
};
