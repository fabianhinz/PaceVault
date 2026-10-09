import { Fragment, useCallback, useMemo, useState } from 'react';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { SessionItem } from './SessionItem.tsx';
import { useSheetScrollElement } from '@/lib/hooks/useSheetScrollElement.ts';
import { matchesFilters } from '@/lib/savedFilters.ts';

const ESTIMATED_ROW_SIZE = 82;

export const SessionList = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const sheetScroller = useSheetScrollElement();
  const [scrollMargin, setScrollMargin] = useState(0);
  const listRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      let top = node.offsetTop;
      if (sheetScroller) {
        top =
          node.getBoundingClientRect().top -
          sheetScroller.getBoundingClientRect().top +
          sheetScroller.scrollTop;
      }
      setScrollMargin((prev) => (prev === top ? prev : top));
    },
    [sheetScroller],
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    return sessions
      .filter((s) => !s.isPlanned && matchesFilters(s, activeFilter, now))
      .sort((a, b) => b.date - a.date);
  }, [sessions, activeFilter]);

  const windowVirtualizer = useWindowVirtualizer({
    count: filtered.length,
    estimateSize: () => ESTIMATED_ROW_SIZE,
    overscan: 5,
    scrollMargin,
    enabled: !sheetScroller,
  });
  const sheetVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => sheetScroller,
    estimateSize: () => ESTIMATED_ROW_SIZE,
    overscan: 5,
    scrollMargin,
    enabled: !!sheetScroller,
  });
  const virtualizer = sheetScroller ? sheetVirtualizer : windowVirtualizer;

  return (
    <div ref={listRef} style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const session = filtered[virtualRow.index];
        if (!session) {
          return <Fragment key={virtualRow.index} />;
        }

        return (
          <div
            key={session.id}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
            }}
          >
            <div className="pb-2">
              <SessionItem session={session} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
