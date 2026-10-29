import type { ComponentProps, FC } from 'react';
import { cn } from '../../lib/cn.ts';
import { FLOATING_CLASS, GLASS_CLASS } from '../../lib/surfaces.ts';

type CardVariant = 'default' | 'compact';

const PADDING_CLASS_BY_CARD_VARIANT: Record<CardVariant, string> = {
  default: 'p-4',
  compact: 'p-2',
};

interface PvCardProps extends ComponentProps<'div'> {
  children: React.ReactNode;
  variant?: CardVariant;
  floating?: boolean;
  footer?: React.ReactNode;
}

export const PvCard: FC<PvCardProps> = (props) => {
  const { variant: _variant, floating: _floating, footer: _footer, ...domProps } = props;
  const variant = props.variant ?? 'default';
  return (
    <div
      {...domProps}
      className={cn(
        props.floating ? FLOATING_CLASS : GLASS_CLASS,
        'rounded-2xl flex flex-col',
        PADDING_CLASS_BY_CARD_VARIANT[variant],
        props.className,
      )}
    >
      {props.children}
      {props.footer && <div className="border-t border-white/10 mt-4 pt-3">{props.footer}</div>}
    </div>
  );
};
