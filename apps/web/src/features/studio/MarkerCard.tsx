import type { FC } from 'react';
import type { StudioMarker, StudioMarkerType } from '@/store/studio.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvList } from '@pacevault/ui/components/pvList/PvList.tsx';
import { MarkerRow } from '@/features/studio/markers/MarkerRow.tsx';
import { AddMarkerButton } from '@/features/studio/markers/AddMarkerButton.tsx';

interface MarkerCardProps {
  routeId: string;
  type: StudioMarkerType;
  title: string;
  subtitle: string;
  markers: StudioMarker[];
}

export const MarkerCard: FC<MarkerCardProps> = (props) => (
  <PvCard>
    <PvCardHeader title={props.title} subtitle={props.subtitle} />
    {props.markers.length > 0 && (
      <PvList>
        {props.markers.map((marker, i) => (
          <MarkerRow
            key={marker.id}
            routeId={props.routeId}
            marker={marker}
            prevSplitM={
              props.type === 'track_modifier' && i > 0
                ? (props.markers[i - 1]?.distanceM ?? null)
                : null
            }
          />
        ))}
      </PvList>
    )}
    <AddMarkerButton routeId={props.routeId} type={props.type} className="mt-2" />
  </PvCard>
);
