import type { ComponentProps, FC } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';

type BannerVariant = 'info' | 'warning' | 'success' | 'error';

// The tint is a gradient so it can sit on bg-banner-base: see-through on dark, opaque white on
// light, where a banner over the map must not let the map show through its text.
const CLASSES_BY_BANNER_VARIANT: Record<BannerVariant, { container: string; icon: string }> = {
  warning: {
    container:
      'backdrop-blur-xl bg-banner-base bg-linear-to-r from-banner-warning/10 to-banner-warning/10 border-banner-warning/20 text-banner-warning-text',
    icon: 'text-banner-warning-icon',
  },
  info: {
    container:
      'backdrop-blur-xl bg-banner-base bg-linear-to-r from-accent/10 to-accent/10 border-accent/20 text-banner-info-text',
    icon: 'text-status-info',
  },
  success: {
    container:
      'backdrop-blur-xl bg-banner-base bg-linear-to-r from-banner-success/10 to-banner-success/10 border-banner-success/20 text-banner-success-text',
    icon: 'text-banner-success-icon',
  },
  error: {
    container:
      'backdrop-blur-xl bg-banner-base bg-linear-to-r from-status-danger-strong/10 to-status-danger-strong/10 border-status-danger-strong/20 text-banner-error-text',
    icon: 'text-status-danger',
  },
};

interface PvBannerProps extends ComponentProps<'div'> {
  icon: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
  variant: BannerVariant;
}

export const PvBanner: FC<PvBannerProps> = (props) => {
  const {
    icon: _icon,
    children: _children,
    action: _action,
    variant: _variant,
    className: _className,
    ...rest
  } = props;

  const classes = CLASSES_BY_BANNER_VARIANT[props.variant];

  return (
    <div
      {...rest}
      className={cn(
        'flex flex-col justify-between gap-3 rounded-xl border px-4 py-2 text-sm',
        classes.container,
        props.className,
      )}
    >
      <div className="flex items-center gap-2">
        <props.icon size={20} className={cn(classes.icon)} />
        <span>{props.children}</span>
      </div>
      {props.action && <div className="flex justify-end">{props.action}</div>}
    </div>
  );
};
