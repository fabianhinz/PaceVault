import { useMemo, type FC } from 'react';
import { TriangleAlert } from 'lucide-react';
import { PvBanner } from '@pacevault/ui/components/pvBanner/PvBanner.tsx';
import { validateRecords } from '@/components/sessions/session/validation.ts';
import { sensorWarningText } from '@/components/sessions/session/sensorWarningText.ts';
import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';

interface SensorWarningBannerProps {
  records: SessionRecord[];
  sport: Sport;
}

export const SensorWarningBanner: FC<SensorWarningBannerProps> = (props) => {
  const warnings = useMemo(
    () => validateRecords({ records: props.records, sport: props.sport }),
    [props.records, props.sport],
  );

  if (warnings.length === 0) return null;

  return (
    <PvBanner variant="warning" icon={TriangleAlert} role="status" className="h-auto min-h-80px">
      {warnings.map((warning) => (
        <span key={warning.code} className="block">
          {sensorWarningText(warning)}
        </span>
      ))}
    </PvBanner>
  );
};
