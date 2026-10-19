interface AttributeConfig {
  tolerance: number;
  minWindow: number;
}

const ATTRIBUTE_CONFIG = {
  duration: { tolerance: 0.2, minWindow: 600 },
  distance: { tolerance: 0.15, minWindow: 500 },
  elevationGain: { tolerance: 0.25, minWindow: 150 },
} satisfies Record<string, AttributeConfig>;

type AttributeFilterKey = keyof typeof ATTRIBUTE_CONFIG;

export const ATTRIBUTE_FILTER_KEYS = Object.keys(ATTRIBUTE_CONFIG) as AttributeFilterKey[];

export const fuzzyBounds = (
  key: AttributeFilterKey,
  target: number,
): { min: number; max: number } => {
  const config = ATTRIBUTE_CONFIG[key];
  const window = Math.max(target * config.tolerance, config.minWindow);
  return { min: Math.max(0, target - window), max: target + window };
};

export const matchesFuzzy = (
  value: number | undefined,
  key: AttributeFilterKey,
  target: number | null,
): boolean => {
  if (typeof target !== 'number') {
    return true;
  }
  if (value === undefined) {
    return false;
  }
  const bounds = fuzzyBounds(key, target);
  return value >= bounds.min && value <= bounds.max;
};
