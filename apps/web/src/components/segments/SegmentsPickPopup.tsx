import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { MapPickPopup } from '@/components/mapBackground/MapPickPopup.tsx';
import type { SegmentsPickPopupInfo } from '@/components/mapBackground/hooks/useSegmentsPickPopup.ts';
import { formatShortDate } from '@/lib/format/formatters.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { useSegmentFocusStore } from '@/store/segmentFocus.ts';
import { SegmentItem } from './SegmentItem.tsx';

interface SegmentsPickPopupProps {
  info: SegmentsPickPopupInfo;
  onClose: () => void;
}

export const SegmentsPickPopup: FC<SegmentsPickPopupProps> = (props) => {
  const pointerFine = useDevice().pointerFine;
  return (
    <MapPickPopup
      x={props.info.x}
      y={props.info.y}
      title={m.ui_map_popup_segments_title({ count: String(props.info.segments.length) })}
      subtitle={m.ui_map_popup_segments_subtitle()}
      onClose={props.onClose}
    >
      <div className="flex flex-col gap-2">
        {props.info.segments.map((segment) => (
          <SegmentItem
            key={segment.id}
            segment={segment}
            value={formatShortDate({ value: segment.lastPassDate, now: Date.now() })}
            openTarget={{ page: 'segmentDetail', params: { segmentId: segment.id } }}
            onOpen={props.onClose}
            onHoverChange={(hovered) => {
              if (!pointerFine) return;
              let hoveredId: string | null = null;
              if (hovered) hoveredId = segment.id;
              useSegmentFocusStore.getState().setHoveredSegment(hoveredId);
            }}
          />
        ))}
      </div>
    </MapPickPopup>
  );
};
