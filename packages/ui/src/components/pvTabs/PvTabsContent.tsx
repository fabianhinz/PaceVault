import type { ComponentProps, FC } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn.ts';

export const PvTabsContent: FC<ComponentProps<typeof TabsPrimitive.Content>> = (props) => {
  const { className: _className, ...rest } = props;
  return (
    <TabsPrimitive.Content
      className={cn('mt-4 focus-visible:outline-none', props.className)}
      {...rest}
    />
  );
};
