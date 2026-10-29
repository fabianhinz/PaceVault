import type { FC } from 'react';
import { MapPinOff } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvBanner } from '@pacevault/ui/components/pvBanner/PvBanner.tsx';
import type { SessionRecord } from '@pacevault/engine/types.ts';

interface NoGpsBannerProps {
  records: SessionRecord[];
}

export const NoGpsBanner: FC<NoGpsBannerProps> = (props) => {
  const gpsRecorded = props.records.some((r) => r.lat != null && r.lng != null);

  if (gpsRecorded) return null;

  return (
    <PvBanner variant="warning" icon={MapPinOff}>
      {m.ui_no_gps_banner_text()}
    </PvBanner>
  );
};
