import { m } from '@pacevault/i18n/messages.js';
import { formatNumber } from '@/lib/formatters.ts';
import type { SensorWarning } from '@/lib/validation.ts';

export const sensorWarningText = (warning: SensorWarning): string => {
  const values = (counted: { limit: number; count: number }) => ({
    limit: formatNumber(counted.limit),
    count: formatNumber(counted.count),
  });
  switch (warning.code) {
    case 'hr_all_zero':
      return m.ui_sensor_warning_hr_all_zero();
    case 'hr_above_max':
      return m.ui_sensor_warning_hr_above_max(values(warning));
    case 'power_above_max':
      return m.ui_sensor_warning_power_above_max(values(warning));
    case 'speed_above_max':
      return m.ui_sensor_warning_speed_above_max(values(warning));
  }
};
