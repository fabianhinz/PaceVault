import type { FC } from 'react';
import { Funnel } from 'lucide-react';
import { Filters } from '@/components/filters/index.tsx';
import { DOCK_ROW_BOTTOM_CSS, DOCK_ROW_HEIGHT } from '@pacevault/ui/lib/dockGeometry.ts';
import { PvResponsivePopover } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopover.tsx';
import { m } from '@pacevault/i18n/messages.js';
import { DockFilterButton } from '@/components/layout/DockFilterButton.tsx';
import { DockLocateButton } from '@/components/layout/DockLocateButton.tsx';
import { DockTabs } from '@/components/layout/DockTabs.tsx';
import type { DockList } from '@/components/layout/types.ts';

interface DockBarProps {
  list: DockList;
}

export const DockBar: FC<DockBarProps> = (props) => (
  <div
    data-layout="dock"
    style={{ bottom: DOCK_ROW_BOTTOM_CSS, height: DOCK_ROW_HEIGHT }}
    className="fixed right-[max(0.75rem,env(safe-area-inset-right))] left-[max(0.75rem,env(safe-area-inset-left))] z-50 flex gap-2"
  >
    <DockLocateButton kind="circle" />
    <DockTabs kind="pill" onTabClick={props.list.handleTabClick} />
    <DockFilterButton kind="circle" open={props.list.open} onClick={props.list.toggle} />
    <PvResponsivePopover
      closeLabel={m.ui_sheet_drag_close()}
      open={props.list.open}
      onOpenChange={(open) => {
        if (!open) props.list.close();
      }}
      title={m.ui_dock_filter()}
      icon={Funnel}
      bleed
    >
      <Filters open sizing="content" onClose={props.list.close} />
    </PvResponsivePopover>
  </div>
);
