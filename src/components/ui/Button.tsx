import { Slot, Slottable } from '@radix-ui/react-slot';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong active:bg-blue-700',
  secondary:
    'bg-white/5 text-text-primary hover:bg-white/10 active:bg-white/15 border border-white/10',
  ghost: 'bg-transparent text-text-secondary hover:bg-white/10 hover:text-text-primary',
  danger:
    'bg-status-danger-strong/10 text-status-danger hover:bg-status-danger-strong/20 active:bg-status-danger-strong/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-1.5',
};

export const Button = (props: ButtonProps) => {
  const {
    variant = 'primary',
    size = 'md',
    asChild = false,
    loading = false,
    className,
    disabled,
    children,
    ...rest
  } = props;
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {asChild ? <Slottable>{children}</Slottable> : children}
    </Comp>
  );
};
