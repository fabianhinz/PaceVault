import type { ComponentProps, FC } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

export const PvTabsTrigger: FC<ComponentProps<typeof TabsPrimitive.Trigger>> = (props) => {
  const { className: _className, color: _color, ...rest } = props;
  return (
    <PvTypography
      as={TabsPrimitive.Trigger}
      variant="subtitle1"
      color="textTertiary"
      className={cn(
        'flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors cursor-pointer hover:bg-white/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'data-[state=active]:bg-white/10 data-[state=active]:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        props.className,
      )}
      {...rest}
    />
  );
};
