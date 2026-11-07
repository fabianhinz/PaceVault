export type ActionItemSize = 'md' | 'sm';

export const LIST_GAP_CLASS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, string> = {
  md: 'gap-2',
  sm: 'gap-1',
};

// A virtualised list positions every row absolutely, so a flex gap cannot apply; each row
// carries the same spacing below it instead.
export const LIST_ROW_SPACING_CLASS_BY_ACTION_ITEM_SIZE: Record<ActionItemSize, string> = {
  md: 'pb-2',
  sm: 'pb-1',
};
