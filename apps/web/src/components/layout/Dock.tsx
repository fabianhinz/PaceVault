import { useCallback, useState } from 'react';
import { Funnel } from 'lucide-react';
import { useFileUpload } from '@/features/sessions/hooks/useFileUpload.ts';
import { useFileDropEffect } from '@/features/sessions/hooks/useFileDropEffect.ts';
import { FilterList } from '@/features/filters/FilterList.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { DOCK_ROW_BOTTOM_CSS, DOCK_ROW_HEIGHT } from '@pacevault/ui/lib/dockGeometry.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { useDismiss } from '@/lib/hooks/useDismiss.ts';
import { useSheetScrollElement } from '@pacevault/ui/hooks/useSheetScrollElement.ts';
import { floatingClass } from '@pacevault/ui/components/Card.tsx';
import { ResponsivePopover } from '@pacevault/ui/components/ResponsivePopover.tsx';
import { m } from '@pacevault/i18n/messages.js';
import { DockFilterButton, DockLocateButton, DockSegment, DockTabs } from './DockItems.tsx';

const fadeClass = 'origin-left transition-[opacity,scale,visibility] duration-150';

const hiddenClass = 'invisible scale-95 opacity-0 pointer-events-none';

const useDockList = () => {
  const [open, setOpen] = useState(false);
  const sheetScroller = useSheetScrollElement();

  const close = useCallback(() => setOpen(false), []);

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    setOpen(true);
  };

  const handleTabClick = () => {
    close();
    if (sheetScroller) {
      sheetScroller.scrollTo({ top: 0 });
    } else {
      window.scrollTo({ top: 0 });
    }
  };

  return { open, close, toggle, handleTabClick };
};

type DockList = ReturnType<typeof useDockList>;

const DockRail = (props: { list: DockList }) => {
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
          floatingClass,
          'absolute inset-y-0 left-[calc(100%+var(--spacing-3))] w-64 overflow-hidden rounded-3xl',
          fadeClass,
          !props.list.open && hiddenClass,
        )}
      >
        <FilterList open={props.list.open} sizing="fill" onClose={props.list.close} />
      </div>
    </div>
  );
};

const DockBar = (props: { list: DockList }) => (
  <div
    data-layout="dock"
    style={{ bottom: DOCK_ROW_BOTTOM_CSS, height: DOCK_ROW_HEIGHT }}
    className="fixed right-[max(0.75rem,env(safe-area-inset-right))] left-[max(0.75rem,env(safe-area-inset-left))] z-50 flex gap-2"
  >
    <DockLocateButton kind="circle" />
    <DockTabs kind="pill" onTabClick={props.list.handleTabClick} />
    <DockFilterButton kind="circle" open={props.list.open} onClick={props.list.toggle} />
    <ResponsivePopover
      open={props.list.open}
      onOpenChange={(open) => {
        if (!open) props.list.close();
      }}
      title={m.ui_dock_filter()}
      icon={Funnel}
      bleed
    >
      <FilterList open sizing="content" onClose={props.list.close} />
    </ResponsivePopover>
  </div>
);

export const Dock = () => {
  const device = useDevice();
  const upload = useFileUpload();
  useFileDropEffect(upload.handleFiles, !upload.uploading);
  const list = useDockList();

  if (device.isDesktop) {
    return <DockRail list={list} />;
  }
  return <DockBar list={list} />;
};
