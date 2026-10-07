import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils.ts';
import { toolbarButtonClass } from './ToolbarButton.tsx';

export const Tabs = (props: React.ComponentProps<typeof TabsPrimitive.Root>) => {
  const { className, ...rest } = props;
  return <TabsPrimitive.Root className={cn('flex flex-col', className)} {...rest} />;
};

export const TabsList = (props: React.ComponentProps<typeof TabsPrimitive.List>) => {
  const { className, ...rest } = props;
  return (
    <TabsPrimitive.List
      className={cn(
        'bg-white/5 backdrop-blur-2xl border border-white/10',
        'flex flex-row gap-2 rounded-2xl w-full p-3 lg:sticky lg:top-6 z-10',
        className,
      )}
      {...rest}
    />
  );
};

export const TabsTrigger = (props: React.ComponentProps<typeof TabsPrimitive.Trigger>) => {
  const { className, ...rest } = props;
  return (
    <TabsPrimitive.Trigger
      className={cn(
        toolbarButtonClass,
        'data-[state=active]:bg-white/10 data-[state=active]:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        className,
      )}
      {...rest}
    />
  );
};

export const TabsContent = (props: React.ComponentProps<typeof TabsPrimitive.Content>) => {
  const { className, ...rest } = props;
  return (
    <TabsPrimitive.Content className={cn('mt-4 focus-visible:outline-none', className)} {...rest} />
  );
};
