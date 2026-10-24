import { useState, type FC } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { ResponsivePopover } from '@pacevault/ui/components/ResponsivePopover.tsx';
import { RadioGroup, RadioGroupItem } from '@pacevault/ui/components/RadioGroup.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { FloatingPill } from '@pacevault/ui/components/FloatingPill.tsx';
import { MAP_VIEWS, useMapControlsStore } from '@/store/mapControls.ts';
import { DESCRIPTION_BY_MAP_VIEW, LABEL_BY_MAP_VIEW } from '@/microcopy/mapView.ts';

export const MapViewControl: FC = () => {
  const [open, setOpen] = useState(false);
  const view = useMapControlsStore((s) => s.sessionMapView);
  const lapSelected = useMapControlsStore((s) => s.selectedLapIndex !== null);

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title={m.ui_map_view()}
      icon={Globe}
      side="top"
      align="center"
      className="lg:w-80"
      trigger={
        lapSelected ? (
          <FloatingPill
            data-testid="map-view-pill"
            aria-label={m.ui_map_view_pill_label({ view: LABEL_BY_MAP_VIEW[view]() })}
            className="size-11 justify-center p-0"
          >
            <Globe size={16} />
          </FloatingPill>
        ) : (
          <FloatingPill
            data-testid="map-view-pill"
            aria-label={m.ui_map_view_pill_label({ view: LABEL_BY_MAP_VIEW[view]() })}
            className="h-11"
          >
            <Globe size={16} />
            <span>{LABEL_BY_MAP_VIEW[view]()}</span>
            <ChevronDown size={14} className="text-text-tertiary" />
          </FloatingPill>
        )
      }
    >
      <div className="mb-3 flex items-center gap-2 text-text-tertiary max-lg:hidden">
        <Globe size={14} />
        <Typography variant="caption">{m.ui_map_view()}</Typography>
      </div>
      <RadioGroup
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
          <RadioGroupItem
            key={option}
            value={option}
            className="rounded-lg px-2 py-2 hover:bg-white/5 data-[state=checked]:bg-white/5"
          >
            <span className="min-w-0 flex-1">
              <Typography variant="subtitle1" as="span" className="block">
                {LABEL_BY_MAP_VIEW[option]()}
              </Typography>
              <Typography variant="caption" as="span" color="textTertiary" className="block">
                {DESCRIPTION_BY_MAP_VIEW[option]()}
              </Typography>
            </span>
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </ResponsivePopover>
  );
};
