import type { SessionRecord, Sport } from '@/packages/engine/types.ts';

const MAX_VALID_HR = 230;

const SUSTAINED_ERROR_THRESHOLD = 10;

const MAX_VALID_POWER = 2500;

const MAX_SPEED_KMH: Record<Sport, number> = {
  cycling: 80,
  running: 25,
};

export type SensorWarning =
  | { code: 'hr_above_max'; limit: number; count: number }
  | { code: 'hr_all_zero' }
  | { code: 'power_above_max'; limit: number; count: number }
  | { code: 'speed_above_max'; limit: number; count: number };

export const validateRecords = (records: SessionRecord[], sport: Sport): SensorWarning[] => {
  const warnings: SensorWarning[] = [];

  const hrValues = records.map((r) => r.hr).filter((v): v is number => v !== undefined);
  const powerValues = records.map((r) => r.power).filter((v): v is number => v !== undefined);
  const speedValues = records.map((r) => r.speed).filter((v): v is number => v !== undefined);

  if (hrValues.length > 0) {
    const sustainedHighHr = hrValues.filter((hr) => hr > MAX_VALID_HR).length;
    if (sustainedHighHr > SUSTAINED_ERROR_THRESHOLD) {
      warnings.push({ code: 'hr_above_max', limit: MAX_VALID_HR, count: sustainedHighHr });
    }

    const zeroHrCount = hrValues.filter((hr) => hr === 0).length;
    if (zeroHrCount === hrValues.length) {
      warnings.push({ code: 'hr_all_zero' });
    }
  }

  if (powerValues.length > 0) {
    const sustainedHighPower = powerValues.filter((p) => p > MAX_VALID_POWER).length;
    if (sustainedHighPower > SUSTAINED_ERROR_THRESHOLD) {
      warnings.push({ code: 'power_above_max', limit: MAX_VALID_POWER, count: sustainedHighPower });
    }
  }

  if (speedValues.length > 0) {
    const speedKmh = speedValues.map((s) => s * 3.6);
    const maxThreshold = MAX_SPEED_KMH[sport];
    const sustainedHighSpeed = speedKmh.filter((s) => s > maxThreshold).length;
    if (sustainedHighSpeed > SUSTAINED_ERROR_THRESHOLD) {
      warnings.push({ code: 'speed_above_max', limit: maxThreshold, count: sustainedHighSpeed });
    }
  }

  return warnings;
};
