import type { FC } from 'react';
import { CloudSun } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvExternalLink } from '@pacevault/ui/components/pvExternalLink/PvExternalLink.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { WeatherSnapshot } from '@/lib/weather.ts';
import type { WindExposure } from '@pacevault/engine/windExposure.ts';
import { WeatherHourlyTable } from '@/features/sessions/session/WeatherHourlyTable.tsx';
import { WindLegend } from '@/features/sessions/session/WindLegend.tsx';
import { WindRose } from '@/features/sessions/session/WindRose.tsx';

const OPEN_METEO_URL = 'https://open-meteo.com/';

interface WeatherDetailsProps {
  snapshots: WeatherSnapshot[];
  rose: number[] | null;
  exposure: WindExposure | null;
}

export const WeatherDetails: FC<WeatherDetailsProps> = (props) => (
  <div className="flex flex-col gap-3">
    {props.rose !== null && (
      <div className="flex items-center gap-3.5">
        <WindRose shares={props.rose} size={118} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <PvTypography variant="caption" color="textTertiary">
            {m.ui_weather_rose_caption()}
          </PvTypography>
          {props.exposure !== null && <WindLegend exposure={props.exposure} />}
        </div>
      </div>
    )}
    <WeatherHourlyTable snapshots={props.snapshots} />
    <PvExternalLink href={OPEN_METEO_URL} icon={CloudSun}>
      {m.ui_weather_attribution()}
    </PvExternalLink>
  </div>
);
