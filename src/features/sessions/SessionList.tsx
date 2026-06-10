import { Fragment, useCallback, useMemo, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { SessionItem } from './SessionItem.tsx';
import { useLocalSparklines } from './hooks/useLocalSparklines.ts';
import { type TimeRange, rangeToCutoff, customRangeToCutoffs } from '@/lib/timeRange.ts';
import { isAttributeFilterActive, matchesAttributeFilters } from '@/lib/attributeFilters.ts';

// SessionItem collapsed: p-4 (16px × 2) + ~42px two-line text content + 8px gap
const ESTIMATED_ROW_SIZE = 82;

export const SessionList = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const attributeFilters = useFiltersStore((s) => s.attributeFilters);
  const sparklines = useLocalSparklines();
  const [scrollMargin, setScrollMargin] = useState(0);
  const listRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const top = node.offsetTop;
      setScrollMargin((prev) => (prev === top ? prev : top));
    }
  }, []);

  const filtered = useMemo(() => {
    let list: typeof sessions;

    if (timeRange === 'custom' && customRange) {
      const bounds = customRangeToCutoffs(customRange);
      list = sessions.filter((s) => !s.isPlanned && s.date >= bounds.from && s.date <= bounds.to);
    } else {
      const cutoff = rangeToCutoff(timeRange as Exclude<TimeRange, 'custom'>);
      list = sessions.filter((s) => !s.isPlanned && s.date >= cutoff);
    }

    if (sportFilter !== 'all') {
      list = list.filter((s) => s.sport === sportFilter);
    }
    if (isAttributeFilterActive(attributeFilters)) {
      list = list.filter((s) => matchesAttributeFilters(s, attributeFilters));
    }
    return list.sort((a, b) => b.date - a.date);
  }, [sessions, sportFilter, timeRange, customRange, attributeFilters]);

  const virtualizer = useWindowVirtualizer({
    count: filtered.length,
    estimateSize: () => ESTIMATED_ROW_SIZE,
    overscan: 5,
    scrollMargin,
  });

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
              <SessionItem
                session={session}
                syncId={`${session.id}-source:list`}
                isToggled={sparklines.toggledIds.has(session.id)}
                onToggleSparkline={() => sparklines.toggle(session.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
