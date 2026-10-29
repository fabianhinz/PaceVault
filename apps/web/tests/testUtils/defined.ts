export const definedOrThrow = <T>(value: T | undefined): T => {
  if (value === undefined) {
    throw new Error('Expected a value, got undefined');
  }
  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const recordOrThrow = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error('Expected an object');
  }
  return value;
};

export const listOrThrow = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error('Expected an array');
  }
  return value;
};
