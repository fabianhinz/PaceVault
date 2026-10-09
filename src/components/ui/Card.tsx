import { cn } from '@/lib/utils.ts';

export const glassClass = 'bg-surface/55 backdrop-blur-xl border border-white/10';

export const floatingClass =
  'bg-surface/85 backdrop-blur-xl border border-white/10 shadow-[0_8px_24px_rgb(0_0_0/0.4)]';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'compact';
  floating?: boolean;
  footer?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

export const Card = (props: CardProps) => {
  const { className, children, variant = 'default', floating, footer, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn(
        floating ? floatingClass : glassClass,
        'rounded-2xl flex flex-col',
        variant === 'compact' ? 'p-2' : 'p-4',
        className,
      )}
      {...rest}
    >
      {children}
      {footer && <div className="border-t border-white/10 mt-4 pt-3">{footer}</div>}
    </div>
  );
};
