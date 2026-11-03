import { Fragment, useCallback, useState, type ReactNode } from 'react';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { useUnstableSheetScrollContext } from '@pacevault/ui/components/pvBottomSheet/PvBottomSheetProvider.tsx';

interface VirtualItemListProps<T> {
  items: T[];
  estimatedRowSize: number;
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

export const VirtualItemList = <T,>(props: VirtualItemListProps<T>): ReactNode => {
  const sheetScroller = useUnstableSheetScrollContext()?.element ?? null;
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

  const windowVirtualizer = useWindowVirtualizer({
    count: props.items.length,
    estimateSize: () => props.estimatedRowSize,
    overscan: 5,
    scrollMargin,
    enabled: !sheetScroller,
  });
  const sheetVirtualizer = useVirtualizer({
    count: props.items.length,
    getScrollElement: () => sheetScroller,
    estimateSize: () => props.estimatedRowSize,
    overscan: 5,
    scrollMargin,
    enabled: !!sheetScroller,
  });
  const virtualizer = sheetScroller ? sheetVirtualizer : windowVirtualizer;

  return (
    <div ref={listRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const item = props.items[virtualRow.index];
        if (item === undefined) {
          return <Fragment key={virtualRow.index} />;
        }

        return (
          <div
            key={props.itemKey(item)}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${virtualRow.start - scrollMargin}px)`,
            }}
          >
            <div className="pb-2">{props.renderItem(item)}</div>
          </div>
        );
      })}
    </div>
  );
};
