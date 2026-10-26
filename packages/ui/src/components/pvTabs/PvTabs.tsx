import type { ComponentProps, FC } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn.ts';

export const PvTabs: FC<ComponentProps<typeof TabsPrimitive.Root>> = (props) => {
  const { className: _className, ...rest } = props;
  return <TabsPrimitive.Root className={cn('flex flex-col', props.className)} {...rest} />;
};
