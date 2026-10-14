import { cn } from '@/lib/utils.ts';

export const glassClass = 'bg-surface/55 backdrop-blur-xl border border-white/10';

export const tileClass = 'rounded-xl border border-white/10 bg-white/5';

const floatingSurface = 'bg-surface/85 backdrop-blur-xl border border-white/10';

export const floatingClass = `${floatingSurface} shadow-[0_8px_24px_rgb(0_0_0/0.4)]`;

export const floatingLgClass = `${floatingSurface} lg:shadow-[0_8px_24px_rgb(0_0_0/0.4)]`;

export const scrimClass = 'bg-black/40 backdrop-blur-sm';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'compact';
  floating?: boolean;
  footer?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

export const Card = (props: CardProps) => {
  const { variant: _variant, floating: _floating, footer: _footer, ...domProps } = props;
  const variant = props.variant ?? 'default';
  return (
    <div
      {...domProps}
      className={cn(
        props.floating ? floatingClass : glassClass,
        'rounded-2xl flex flex-col',
        variant === 'compact' ? 'p-2' : 'p-4',
        props.className,
      )}
    >
      {props.children}
      {props.footer && <div className="border-t border-white/10 mt-4 pt-3">{props.footer}</div>}
    </div>
  );
};
