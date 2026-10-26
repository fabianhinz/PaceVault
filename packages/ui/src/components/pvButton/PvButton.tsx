import type { ComponentProps, FC } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import type { TypographyVariants } from '../pvTypography/types.ts';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const CLASSES_BY_BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong active:bg-accent-pressed',
  secondary:
    'bg-white/5 text-text-primary hover:bg-white/10 active:bg-white/15 border border-white/10',
  ghost: 'bg-transparent text-text-secondary hover:bg-white/10 hover:text-text-primary',
  danger:
    'bg-status-danger-strong/10 text-status-danger hover:bg-status-danger-strong/20 active:bg-status-danger-strong/30',
};

const CLASSES_BY_BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-6 py-3',
  icon: 'p-1.5',
};

const TEXT_VARIANT_BY_BUTTON_SIZE: Record<ButtonSize, TypographyVariants> = {
  sm: 'subtitle1',
  md: 'subtitle1',
  lg: 'title',
  icon: 'subtitle1',
};

interface PvButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
}

export const PvButton: FC<PvButtonProps> = (props) => {
  const {
    variant: _variant,
    size: _size,
    asChild: _asChild,
    loading: _loading,
    className: _className,
    disabled: _disabled,
    children: _children,
    color: _color,
    ...rest
  } = props;
  const loading = props.loading ?? false;
  const Comp = props.asChild ? Slot : 'button';
  const size = props.size ?? 'md';
  const buttonProps = { ...rest, disabled: props.disabled || loading };
  return (
    <PvTypography
      as={Comp}
      variant={TEXT_VARIANT_BY_BUTTON_SIZE[size]}
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
        CLASSES_BY_BUTTON_VARIANT[props.variant ?? 'primary'],
        CLASSES_BY_BUTTON_SIZE[size],
        props.className,
      )}
      {...buttonProps}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {props.asChild ? <Slottable>{props.children}</Slottable> : props.children}
    </PvTypography>
  );
};
