import {
  CalendarRange,
  Mountain,
  MoveHorizontal,
  TextSearch,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { ICON_BY_SPORT } from '@/components/sessions/sportIcons.ts';
import { type FilterCriteria, type FilterPartKind, filterParts } from '@/lib/filtering/filters.ts';

const ICON_BY_FILTER_PART_KIND: Record<Exclude<FilterPartKind, 'sport'>, LucideIcon> = {
  time: CalendarRange,
  distance: MoveHorizontal,
  duration: Timer,
  elevationGain: Mountain,
  name: TextSearch,
};

export const filterIcon = (criteria: FilterCriteria): LucideIcon => {
  if (criteria.sport !== null) {
    return ICON_BY_SPORT[criteria.sport];
  }
  const head = filterParts(criteria)[0];
  if (head === undefined || head.kind === 'sport') {
    return CalendarRange;
  }
  return ICON_BY_FILTER_PART_KIND[head.kind];
};
