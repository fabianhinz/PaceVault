import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

type BannerVariant = 'info' | 'warning' | 'success' | 'error';

interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
  variant: BannerVariant;
}

const variantClasses: Record<BannerVariant, { container: string; icon: string }> = {
  warning: {
    container: 'backdrop-blur-xl bg-amber-500/10 border-amber-500/20 text-amber-200',
    icon: 'text-amber-400',
  },
  info: {
    container: 'backdrop-blur-xl bg-blue-500/10 border-blue-500/20 text-blue-200',
    icon: 'text-blue-400',
  },
  success: {
    container: 'backdrop-blur-xl bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
    icon: 'text-emerald-400',
  },
  error: {
    container: 'backdrop-blur-xl bg-red-500/10 border-red-500/20 text-red-200',
    icon: 'text-red-400',
  },
};

export const Banner = (props: BannerProps) => {
  const { icon, children, action, variant, className, ...rest } = props;

  const Icon = icon;
  const classes = variantClasses[variant];

  return (
    <div
      {...rest}
      className={cn(
        'flex flex-col justify-between gap-3 rounded-xl border px-4 py-2 text-sm h-[80px]',
        classes.container,
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon size={20} className={cn(classes.icon)} />
        <span>{children}</span>
      </div>
      {action && <div className="flex justify-end">{action}</div>}
    </div>
  );
};
