import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import type { SensorWarning } from '@/lib/validation.ts';

export const sensorWarningText = (warning: SensorWarning): string => {
  const numberFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });
  if (warning.code === 'hr_all_zero') return m.ui_sensor_warning_hr_all_zero();
  const values = {
    limit: numberFmt.format(warning.limit),
    count: numberFmt.format(warning.count),
  };
  if (warning.code === 'hr_above_max') return m.ui_sensor_warning_hr_above_max(values);
  if (warning.code === 'power_above_max') return m.ui_sensor_warning_power_above_max(values);
  return m.ui_sensor_warning_speed_above_max(values);
};
