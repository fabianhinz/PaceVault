export const zoomSelection = <T>({
  data,
  xKey,
  pressed,
  released,
}: {
  data: T[];
  xKey: keyof T & string;
  pressed: string | number;
  released: string | number;
}): { left: number; right: number } | null => {
  const pressedIndex = data.findIndex((d) => d[xKey] === pressed);
  const releasedIndex = data.findIndex((d) => d[xKey] === released);

  if (pressedIndex < 0 || releasedIndex < 0) {
    return null;
  }

  if (pressedIndex > releasedIndex) {
    return { left: releasedIndex, right: pressedIndex };
  }
  return { left: pressedIndex, right: releasedIndex };
};
