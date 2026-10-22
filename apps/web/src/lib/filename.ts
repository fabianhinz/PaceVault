/**
 * Extract a human-readable session name from a FIT filename.
 * Pattern: [i]{digits}_{Name_With_Underscores}.fit (intervals.icu prefixes the id with `i`)
 * Returns undefined if the filename does not match.
 */
export const extractSessionName = (filename: string): string | undefined => {
  const match = filename.match(/^i?\d+_(.+)\.fit$/i);
  if (!match) return undefined;
  const captured = match[1];
  if (!captured) return undefined;
  const name = captured.replace(/_/g, ' ').trim();
  if (name.length > 0) {
    return name;
  }
  return undefined;
};
