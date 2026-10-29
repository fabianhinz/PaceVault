import type { FC } from 'react';
import { Filters } from '@/components/filters/index.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useDismiss } from '@/lib/hooks/useDismiss.ts';
import { FLOATING_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { DockFilterButton } from '@/components/layout/DockFilterButton.tsx';
import { DockLocateButton } from '@/components/layout/DockLocateButton.tsx';
import { DockSegment } from '@/components/layout/DockSegment.tsx';
import { DockTabs } from '@/components/layout/DockTabs.tsx';
import type { DockList } from '@/components/layout/types.ts';

const fadeClass = 'origin-left transition-[opacity,scale,visibility] duration-150';

const hiddenClass = 'invisible scale-95 opacity-0 pointer-events-none';

interface DockRailProps {
  list: DockList;
}

export const DockRail: FC<DockRailProps> = (props) => {
  const ref = useDismiss(props.list.close, {
    escapeEnabled: false,
    outsideEnabled: props.list.open,
  });
  return (
    <div
      ref={ref}
      data-layout="dock"
      className="fixed top-1/2 left-3 z-50 flex -translate-y-1/2 flex-col gap-2"
    >
      <DockTabs kind="rail" onTabClick={props.list.handleTabClick} />
      <DockSegment className="flex-col gap-1 p-1">
        <DockFilterButton kind="rail" open={props.list.open} onClick={props.list.toggle} />
        <DockLocateButton kind="rail" />
      </DockSegment>
      <div
        data-dock-card
        className={cn(
          FLOATING_CLASS,
          'absolute inset-y-0 left-[calc(100%+var(--spacing-3))] w-64 overflow-hidden rounded-3xl',
          fadeClass,
          !props.list.open && hiddenClass,
        )}
      >
        <Filters open={props.list.open} sizing="fill" onClose={props.list.close} />
      </div>
    </div>
  );
};
