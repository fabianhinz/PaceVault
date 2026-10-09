import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useFileUpload } from '@/features/sessions/hooks/useFileUpload.ts';
import { useFileDropEffect } from '@/features/sessions/hooks/useFileDropEffect.ts';
import { useFilterBuilder } from '@/features/filters/hooks/useFilterBuilder.ts';
import { FilterList } from '@/features/filters/FilterList.tsx';
import { FilterField } from '@/features/filters/FilterField.tsx';
import { cn } from '@/lib/utils.ts';
import { DOCK_ROW_BOTTOM_CSS, DOCK_ROW_HEIGHT, DOCK_STACK_GAP } from '@/lib/dockGeometry.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useDismiss } from '@/lib/hooks/useDismiss.ts';
import { useKeyboardInset } from '@/lib/hooks/useKeyboardInset.ts';
import { useSheetScrollElement } from '@/lib/hooks/useSheetScrollElement.ts';
import { Button } from '@/components/ui/Button.tsx';
import { glassClass } from '@/components/ui/Card.tsx';
import { DockFilterButton, DockLocateButton, DockSegment, DockTabs } from './DockItems.tsx';

const fadeClass = 'transition-[opacity,visibility] duration-150';

const hiddenClass = 'invisible opacity-0 pointer-events-none';

const useDockList = () => {
  const [open, setOpen] = useState(false);
  const builder = useFilterBuilder();
  const setText = builder.setText;
  const text = builder.text;
  const sheetScroller = useSheetScrollElement();

  const close = useCallback(() => {
    setOpen(false);
    setText('');
  }, [setText]);

  const ref = useDismiss(close, { escapeEnabled: false, outsideEnabled: open });

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') {
        return;
      }
      if (text !== '') {
        setText('');
        return;
      }
      close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, text, setText, close]);

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

  return { open, builder, ref, close, toggle, handleTabClick };
};

type DockList = ReturnType<typeof useDockList>;

const DockRail = (props: { list: DockList }) => (
  <div
    ref={props.list.ref}
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
        glassClass,
        'absolute inset-y-0 left-[calc(100%+var(--spacing-3))] w-64 overflow-hidden rounded-3xl',
        fadeClass,
        !props.list.open && hiddenClass,
      )}
    >
      <FilterList builder={props.list.builder} withInput sizing="fill" />
    </div>
  </div>
);

const DockBar = (props: { list: DockList }) => {
  const [fieldFocused, setFieldFocused] = useState(false);
  const keyboard = useKeyboardInset(props.list.open && fieldFocused);
  let bottom = DOCK_ROW_BOTTOM_CSS;
  if (keyboard > 0) {
    bottom = `${keyboard + DOCK_STACK_GAP}px`;
  }
  return (
    <div
      ref={props.list.ref}
      data-layout="dock"
      style={{ bottom, height: DOCK_ROW_HEIGHT }}
      className="fixed right-[max(0.75rem,env(safe-area-inset-right))] left-[max(0.75rem,env(safe-area-inset-left))] z-50 flex gap-2"
    >
      <DockLocateButton kind="circle" />
      <div className="relative min-w-0 flex-1">
        <div
          className={cn('absolute inset-0 flex gap-2', fadeClass, props.list.open && hiddenClass)}
        >
          <DockTabs kind="pill" onTabClick={props.list.handleTabClick} />
          <DockFilterButton kind="circle" open={props.list.open} onClick={props.list.toggle} />
        </div>
        <div
          className={cn(
            glassClass,
            'absolute inset-0 flex items-center gap-1 rounded-full pr-1 pl-4',
            fadeClass,
            !props.list.open && hiddenClass,
          )}
        >
          <FilterField
            builder={props.list.builder}
            className="h-11"
            onFocusChange={setFieldFocused}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-full text-text-tertiary"
            onClick={props.list.close}
            aria-label={m.ui_dock_close_list()}
          >
            <X size={20} strokeWidth={1.5} />
          </Button>
        </div>
      </div>
      <div
        data-dock-card
        style={{ bottom: `calc(100% + ${DOCK_STACK_GAP}px)` }}
        className={cn(
          glassClass,
          'absolute inset-x-0 overflow-hidden rounded-3xl',
          fadeClass,
          !props.list.open && hiddenClass,
        )}
      >
        <FilterList builder={props.list.builder} withInput={false} sizing="content" />
      </div>
    </div>
  );
};

export const Dock = () => {
  const isDesktop = useIsDesktop();
  const upload = useFileUpload();
  useFileDropEffect(upload.handleFiles, !upload.uploading);
  const list = useDockList();

  if (isDesktop) {
    return <DockRail list={list} />;
  }
  return <DockBar list={list} />;
};
