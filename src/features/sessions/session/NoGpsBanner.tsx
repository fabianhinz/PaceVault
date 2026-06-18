import { MapPinOff } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Banner } from '@/components/ui/Banner.tsx';
import type { SessionRecord } from '@/packages/engine/types.ts';

interface NoGpsBannerProps {
  records: SessionRecord[];
}

export const NoGpsBanner = (props: NoGpsBannerProps) => {
  const hasGps = props.records.some((r) => r.lat != null && r.lng != null);

  if (hasGps) return null;

  return (
    <Banner variant="warning" icon={MapPinOff}>
      {m.ui_no_gps_banner_text()}
    </Banner>
  );
};
