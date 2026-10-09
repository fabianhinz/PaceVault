import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils.ts';
import { floatingClass } from './Card.tsx';

export const Tabs = (props: React.ComponentProps<typeof TabsPrimitive.Root>) => {
  const { className, ...rest } = props;
  return <TabsPrimitive.Root className={cn('flex flex-col', className)} {...rest} />;
};

export const TabsList = (props: React.ComponentProps<typeof TabsPrimitive.List>) => {
  const { className, ...rest } = props;
  return (
    <TabsPrimitive.List
      className={cn(
        floatingClass,
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
        'flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium text-text-tertiary transition-colors cursor-pointer hover:bg-white/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
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
