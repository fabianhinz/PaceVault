import { useMemo } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Banner } from '@/components/ui/Banner.tsx';
import { validateRecords } from '@/lib/validation.ts';
import { sensorWarningText } from '@/features/sessions/session/sensorWarningText.ts';
import type { SessionRecord, Sport } from '@/packages/engine/types.ts';

interface SensorWarningBannerProps {
  records: SessionRecord[];
  sport: Sport;
}

export const SensorWarningBanner = (props: SensorWarningBannerProps) => {
  const warnings = useMemo(
    () => validateRecords(props.records, props.sport),
    [props.records, props.sport],
  );

  if (warnings.length === 0) return null;

  return (
    <Banner variant="warning" icon={TriangleAlert} role="status" className="h-auto min-h-[80px]">
      {warnings.map((warning) => (
        <span key={warning.code} className="block">
          {sensorWarningText(warning)}
        </span>
      ))}
    </Banner>
  );
};
