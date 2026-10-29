import type { ComponentProps, FC } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

type DropdownMenuItemVariant = 'default' | 'danger';

interface PvDropdownMenuItemProps extends ComponentProps<typeof DropdownMenuPrimitive.Item> {
  variant?: DropdownMenuItemVariant;
}

export const PvDropdownMenuItem: FC<PvDropdownMenuItemProps> = (props) => {
  const { className: _className, variant: _variant, children: _children, ...rest } = props;
  return (
    <DropdownMenuPrimitive.Item {...rest} asChild>
      <PvTypography
        as="div"
        variant="body1"
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-none transition-colors hover:bg-white/10 focus:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          props.variant === 'danger' && 'text-status-danger focus:text-status-danger',
          props.className,
        )}
      >
        {props.children}
      </PvTypography>
    </DropdownMenuPrimitive.Item>
  );
};
