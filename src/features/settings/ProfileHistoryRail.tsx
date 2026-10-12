import { m } from '@/paraglide/messages.js';
import { valueAt, type DatedValue } from '@/packages/engine/datedValue.ts';
import { StatRail } from '@/components/ui/StatRail.tsx';
import { toDateString } from '@/lib/formatters.ts';
import { formatDashboardDate } from '@/features/dashboard/dashboardDate.ts';
import { useChartHoverX } from '@/store/chartHover.ts';
import { PROFILE_HISTORY_HOVER_GROUP } from '@/lib/profileHistory.ts';

const MISSING = '--';

interface ProfileHistoryRailProps {
  history: DatedValue<number>[];
  unit: string;
  min: number | undefined;
  max: number | undefined;
  format: (value: number) => string;
}

export const ProfileHistoryRail = (props: ProfileHistoryRailProps) => {
  const x = useChartHoverX(PROFILE_HISTORY_HOVER_GROUP);
  let header: string = m.ui_rail_latest();
  let date = Date.now();
  let active = false;
  if (typeof x === 'number') {
    header = formatDashboardDate(toDateString(x));
    date = x;
    active = true;
  }
  const value = valueAt(props.history, date);
  let secondary = '';
  if (props.min !== undefined && props.max !== undefined) {
    secondary = `${props.format(props.min)}–${props.format(props.max)} ${props.unit}`;
  }

  return (
    <StatRail
      header={header}
      active={active}
      secondarySlot
      rows={[
        {
          key: 'value',
          value: value === undefined ? MISSING : props.format(value),
          unit: props.unit,
          secondary,
        },
      ]}
    />
  );
};
