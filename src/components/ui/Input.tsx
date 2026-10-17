import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { HelperText } from './HelperText.tsx';

type InputVariant = 'field' | 'bare';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
  variant?: InputVariant;
  icon?: LucideIcon;
  helperText?: ReactNode;
  error?: boolean;
  reserveHelper?: boolean;
}

const variantClasses: Record<InputVariant, string> = {
  field: 'h-10 rounded-lg border bg-white/5 px-3 py-2 lg:text-sm focus:ring-2 focus:ring-accent',
  bare: 'h-12 border-0 bg-transparent p-0',
};

export const Input = (props: InputProps) => {
  const {
    className,
    variant = 'field',
    icon: _i,
    helperText,
    error,
    reserveHelper: _r,
    ...rest
  } = props;
  const input = (
    <input
      className={cn(
        'flex w-full min-w-0 text-base text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        error ? 'border-status-danger-strong focus:ring-status-danger-strong' : 'border-white/10',
        className,
      )}
      {...rest}
    />
  );
  return (
    <div className="w-full">
      {props.icon === undefined ? (
        input
      ) : (
        <div className="flex w-full items-center gap-2.5">
          <props.icon size={18} strokeWidth={1.5} className="shrink-0 text-text-tertiary" />
          {input}
        </div>
      )}
      {(helperText || props.reserveHelper) && <HelperText error={error}>{helperText}</HelperText>}
    </div>
  );
};
