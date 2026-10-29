import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import type { TypographyVariants } from '../pvTypography/types.ts';

type ListItemHeaderVariant = 'primary' | 'secondary';

const GAP_CLASS_BY_LIST_ITEM_HEADER_VARIANT: Record<ListItemHeaderVariant, string> = {
  primary: 'gap-2',
  secondary: 'gap-3',
};

const AVATAR_CLASS_BY_LIST_ITEM_HEADER_VARIANT: Record<ListItemHeaderVariant, string> = {
  primary: '',
  secondary: 'size-30px',
};

const TYPOGRAPHY_BY_LIST_ITEM_HEADER_VARIANT: Record<
  ListItemHeaderVariant,
  { variant: TypographyVariants; as: 'h4' | 'span' }
> = {
  primary: { variant: 'title', as: 'h4' },
  secondary: { variant: 'body1', as: 'span' },
};

interface PvListItemHeaderProps {
  variant: ListItemHeaderVariant;
  avatar?: ReactNode;
  primary: ReactNode;
  info?: ReactNode;
  secondary?: ReactNode;
  disabled?: boolean;
}

export const PvListItemHeader: FC<PvListItemHeaderProps> = (props) => {
  const typography = TYPOGRAPHY_BY_LIST_ITEM_HEADER_VARIANT[props.variant];

  return (
    <span
      className={cn(
        'flex min-w-0 flex-1 items-center',
        GAP_CLASS_BY_LIST_ITEM_HEADER_VARIANT[props.variant],
        props.disabled && 'opacity-45',
      )}
    >
      {props.avatar !== undefined && (
        <span
          className={cn(
            'grid shrink-0 place-items-center',
            AVATAR_CLASS_BY_LIST_ITEM_HEADER_VARIANT[props.variant],
          )}
        >
          {props.avatar}
        </span>
      )}
      <span className="min-w-0">
        <span className="flex items-center gap-1">
          <PvTypography variant={typography.variant} as={typography.as} className="block text-left">
            {props.primary}
          </PvTypography>
          {props.info}
        </span>
        {props.secondary !== undefined && (
          <PvTypography variant="caption" className="block">
            {props.secondary}
          </PvTypography>
        )}
      </span>
    </span>
  );
};
