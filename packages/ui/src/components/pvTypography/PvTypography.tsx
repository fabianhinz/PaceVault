import type { ElementType, FC, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import type { TypographyVariants } from './types.ts';

const CONFIG_BY_TYPOGRAPHY_VARIANT = {
  h1: { element: 'h1', classes: 'text-2xl font-bold', defaultColor: 'textPrimary' },
  h2: { element: 'h2', classes: 'text-xl font-bold', defaultColor: 'textPrimary' },
  h3: { element: 'h3', classes: 'text-lg font-bold', defaultColor: 'textPrimary' },
  title: { element: 'h4', classes: 'text-base font-medium', defaultColor: 'textPrimary' },
  body1: { element: 'p', classes: 'text-sm', defaultColor: 'textPrimary' },
  subtitle1: { element: 'p', classes: 'text-sm font-medium', defaultColor: 'textPrimary' },
  subtitle2: { element: 'span', classes: 'text-sm font-medium', defaultColor: 'textSecondary' },
  caption: { element: 'span', classes: 'text-xs', defaultColor: 'textSecondary' },
  overline: {
    element: 'span',
    classes: 'text-xs font-medium uppercase tracking-wider',
    defaultColor: 'textSecondary',
  },
} as const satisfies Record<TypographyVariants, unknown>;

const CLASSES_BY_TYPOGRAPHY_COLOR = {
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textTertiary: 'text-text-tertiary',
  success: 'text-status-success',
  error: 'text-status-danger',
  warning: 'text-status-warning',
} as const;

type Color = keyof typeof CLASSES_BY_TYPOGRAPHY_COLOR;

interface PvTypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: TypographyVariants;
  color?: Color;
  as?: ElementType;
  tabularNums?: boolean;
  noWrap?: boolean;
  zeroMinWidth?: boolean;
  children?: ReactNode;
}

export const PvTypography: FC<PvTypographyProps> = (props) => {
  const {
    variant: _,
    color: _c,
    as: _a,
    tabularNums: _t,
    noWrap: _n,
    zeroMinWidth: _z,
    className: _cls,
    ...rest
  } = props;

  const config = CONFIG_BY_TYPOGRAPHY_VARIANT[props.variant ?? 'body1'];
  const resolvedColor = props.color ?? config.defaultColor;
  const Component: ElementType = props.as ?? config.element;

  return (
    <Component
      className={cn(
        config.classes,
        CLASSES_BY_TYPOGRAPHY_COLOR[resolvedColor],
        props.tabularNums && 'tabular-nums',
        props.noWrap && 'truncate',
        props.zeroMinWidth && 'min-w-0',
        props.className,
      )}
      {...rest}
    >
      {props.children}
    </Component>
  );
};
