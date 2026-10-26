import { useState, type FC } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvResponsivePopover } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopover.tsx';
import { PvRadioGroup } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroup.tsx';
import { PvRadioGroupItem } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroupItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { PvFloatingPill } from '@pacevault/ui/components/pvFloatingPill/PvFloatingPill.tsx';
import { PvResponsivePopoverHeading } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopoverHeading.tsx';
import { MAP_VIEWS, useMapControlsStore } from '@/store/mapControls.ts';
import { DESCRIPTION_BY_MAP_VIEW, LABEL_BY_MAP_VIEW } from '@/microcopy/mapView.ts';

export const MapViewControl: FC = () => {
  const [open, setOpen] = useState(false);
  const view = useMapControlsStore((s) => s.sessionMapView);
  const lapSelected = useMapControlsStore((s) => s.selectedLapIndex !== null);

  return (
    <PvResponsivePopover
      closeLabel={m.ui_sheet_drag_close()}
      open={open}
      onOpenChange={setOpen}
      title={m.ui_map_view()}
      icon={Globe}
      side="top"
      align="center"
      className="lg:w-80"
      trigger={
        lapSelected ? (
          <PvFloatingPill
            data-testid="map-view-pill"
            aria-label={m.ui_map_view_pill_label({ view: LABEL_BY_MAP_VIEW[view]() })}
            className="size-11 justify-center p-0"
          >
            <Globe size={16} />
          </PvFloatingPill>
        ) : (
          <PvFloatingPill
            data-testid="map-view-pill"
            aria-label={m.ui_map_view_pill_label({ view: LABEL_BY_MAP_VIEW[view]() })}
            className="h-11"
          >
            <Globe size={16} />
            <span>{LABEL_BY_MAP_VIEW[view]()}</span>
            <ChevronDown size={14} className="text-text-tertiary" />
          </PvFloatingPill>
        )
      }
    >
      <PvResponsivePopoverHeading icon={Globe} title={m.ui_map_view()} />
      <PvRadioGroup
        value={view}
        onValueChange={(value) => {
          const next = MAP_VIEWS.find((candidate) => candidate === value);
          if (next === undefined) return;
          useMapControlsStore.getState().setSessionMapView(next);
          setOpen(false);
        }}
        className="gap-1"
      >
        {MAP_VIEWS.map((option) => (
          <PvRadioGroupItem
            key={option}
            value={option}
            aria-label={LABEL_BY_MAP_VIEW[option]()}
            className="rounded-lg px-2 py-2 hover:bg-white/5 data-[state=checked]:bg-white/5"
          >
            <span className="min-w-0 flex-1">
              <PvTypography variant="subtitle1" as="span" className="block">
                {LABEL_BY_MAP_VIEW[option]()}
              </PvTypography>
              <PvTypography variant="caption" as="span" color="textTertiary" className="block">
                {DESCRIPTION_BY_MAP_VIEW[option]()}
              </PvTypography>
            </span>
          </PvRadioGroupItem>
        ))}
      </PvRadioGroup>
    </PvResponsivePopover>
  );
};
