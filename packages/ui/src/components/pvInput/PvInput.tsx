import type { ComponentProps, FC, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { PvHelperText } from '../pvHelperText/PvHelperText.tsx';

type InputVariant = 'field' | 'bare';

const CLASSES_BY_INPUT_VARIANT: Record<InputVariant, string> = {
  field: 'h-10 rounded-lg border bg-white/5 px-3 py-2 lg:text-sm focus:ring-2 focus:ring-accent',
  bare: 'h-12 border-0 bg-transparent p-0',
};

interface PvInputProps extends ComponentProps<'input'> {
  variant?: InputVariant;
  icon?: LucideIcon;
  helperText?: ReactNode;
  error?: boolean;
  reserveHelper?: boolean;
}

export const PvInput: FC<PvInputProps> = (props) => {
  const {
    className: _className,
    variant: _variant,
    icon: _icon,
    helperText: _helperText,
    error: _error,
    reserveHelper: _reserveHelper,
    ...rest
  } = props;
  const input = (
    <input
      className={cn(
        'flex w-full min-w-0 text-base text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        CLASSES_BY_INPUT_VARIANT[props.variant ?? 'field'],
        props.error
          ? 'border-status-danger-strong focus:ring-status-danger-strong'
          : 'border-white/10',
        props.className,
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
      {(props.helperText || props.reserveHelper) && (
        <PvHelperText error={props.error}>{props.helperText}</PvHelperText>
      )}
    </div>
  );
};
