import { useRef } from 'react';
import { Route } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { StudioRouteItem } from './StudioRouteItem.tsx';
import { useGpxImport } from './hooks/useGpxImport.ts';

export const StudioTab = () => {
  const routes = useStudioStore((s) => s.routes);
  const inputRef = useRef<HTMLInputElement>(null);
  const gpxImport = useGpxImport();

  return (
    <div className="flex flex-col gap-2">
      {routes.map((route) => (
        <StudioRouteItem key={route.id} route={route} />
      ))}

      {routes.length === 0 && (
        <Card className="flex-row items-center gap-3">
          <Route size={18} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <Typography>{m.ui_studio_nudge_title()}</Typography>
            <Typography variant="caption" as="p">
              {m.ui_studio_nudge_desc()}
            </Typography>
          </div>
        </Card>
      )}

      <Button
        variant="primary"
        loading={gpxImport.importing}
        onClick={() => inputRef.current?.click()}
      >
        {m.ui_studio_cta_import()}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        multiple
        className="hidden"
        data-testid="studio-gpx-input"
        onChange={(e) => {
          gpxImport.handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};
