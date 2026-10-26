import { useRef, type FC } from 'react';
import { Route } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { StudioRouteItem } from './StudioRouteItem.tsx';
import { useGpxImport } from './hooks/useGpxImport.ts';

export const StudioTab: FC = () => {
  const routes = useStudioStore((s) => s.routes);
  const inputRef = useRef<HTMLInputElement>(null);
  const gpxImport = useGpxImport();

  return (
    <div className="flex flex-col gap-2">
      {routes.map((route) => (
        <StudioRouteItem key={route.id} route={route} />
      ))}

      {routes.length === 0 && (
        <PvCard className="flex-row items-center gap-3">
          <Route size={18} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <PvTypography>{m.ui_studio_nudge_title()}</PvTypography>
            <PvTypography variant="caption" as="p">
              {m.ui_studio_nudge_desc()}
            </PvTypography>
          </div>
        </PvCard>
      )}

      <PvButton
        variant="primary"
        loading={gpxImport.importing}
        onClick={() => inputRef.current?.click()}
      >
        {m.ui_studio_cta_import()}
      </PvButton>

      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        multiple
        className="hidden"
        data-testid="studio-gpx-input"
        onChange={(e) => {
          void gpxImport.handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};
