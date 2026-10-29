import type { ComponentProps, FC } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

export const PvSelectItem: FC<ComponentProps<typeof SelectPrimitive.Item>> = (props) => {
  const { className: _className, children: _children, color: _color, ...rest } = props;
  return (
    <PvTypography
      as={SelectPrimitive.Item}
      variant="body1"
      className={cn(
        'relative flex w-full cursor-pointer items-center rounded-md px-3 py-2 outline-none hover:bg-white/10 focus:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.className,
      )}
      {...rest}
    >
      <SelectPrimitive.ItemText>{props.children}</SelectPrimitive.ItemText>
    </PvTypography>
  );
};
