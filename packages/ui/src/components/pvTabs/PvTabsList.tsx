import type { ComponentProps, FC } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn.ts';
import { FLOATING_LG_CLASS } from '../../lib/surfaces.ts';

type TabsListVariant = 'floating' | 'inline';

const CLASSES_BY_TABS_LIST_VARIANT: Record<TabsListVariant, string> = {
  floating: cn(
    FLOATING_LG_CLASS,
    'flex flex-row gap-2 rounded-2xl w-full p-3 lg:sticky lg:top-6 z-raised',
  ),
  inline: 'inline-flex gap-1 mb-1',
};

interface PvTabsListProps extends ComponentProps<typeof TabsPrimitive.List> {
  variant?: TabsListVariant;
}

export const PvTabsList: FC<PvTabsListProps> = (props) => {
  const { className: _className, variant: _variant, ...rest } = props;
  return (
    <TabsPrimitive.List
      className={cn(CLASSES_BY_TABS_LIST_VARIANT[props.variant ?? 'floating'], props.className)}
      {...rest}
    />
  );
};
