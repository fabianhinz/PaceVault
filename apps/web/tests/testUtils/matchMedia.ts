import { DESKTOP_MEDIA_QUERY, FINE_POINTER_QUERY } from '@pacevault/ui/hooks/useDevice.ts';

const minWidthOf = (query: string): number | undefined => {
  const match = /min-width:\s*(\d+)px/.exec(query);
  if (match?.[1] === undefined) {
    return undefined;
  }
  return Number(match[1]);
};

export const DESKTOP_MIN_WIDTH = minWidthOf(DESKTOP_MEDIA_QUERY) ?? 0;

const matchesQuery = (args: { query: string; width: number; pointerFine: boolean }): boolean => {
  if (args.query === FINE_POINTER_QUERY) {
    return args.pointerFine;
  }
  const minWidth = minWidthOf(args.query);
  if (minWidth === undefined) {
    return false;
  }
  return args.width >= minWidth;
};

export const createMatchMedia =
  (width: number, options: { pointerFine?: boolean } = {}): Window['matchMedia'] =>
  (query: string) => ({
    matches: matchesQuery({ query, width, pointerFine: options.pointerFine ?? false }),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
