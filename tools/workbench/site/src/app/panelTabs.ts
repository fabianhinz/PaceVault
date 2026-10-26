import type { BoardItem } from '@site/lib/board.ts';
import { SLOTS, type Slot } from '@site/lib/vocabulary.ts';

export const tabFor = ({ item, asked }: { item: BoardItem; asked: Slot | undefined }): Slot => {
  if (asked !== undefined && item.present[asked]) return asked;
  const first = SLOTS.find((slot) => item.present[slot]);
  if (first === undefined) return 'plan';
  return first;
};
