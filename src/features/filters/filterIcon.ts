import {
  CalendarRange,
  Mountain,
  MoveHorizontal,
  TextSearch,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { sportIcon } from '@/lib/sportIcons.ts';
import { type FilterCriteria, type FilterPartKind, filterParts } from '@/lib/savedFilters.ts';

const partIcons: Record<Exclude<FilterPartKind, 'sport'>, LucideIcon> = {
  time: CalendarRange,
  distance: MoveHorizontal,
  duration: Timer,
  elevationGain: Mountain,
  name: TextSearch,
};

export const filterIcon = (criteria: FilterCriteria): LucideIcon => {
  if (criteria.sport !== null) {
    return sportIcon[criteria.sport];
  }
  const head = filterParts(criteria)[0];
  if (head === undefined || head.kind === 'sport') {
    return CalendarRange;
  }
  return partIcons[head.kind];
};
