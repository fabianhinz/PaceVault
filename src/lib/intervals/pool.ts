export const mapWithConcurrency = async <TIn, TOut>(
  items: TIn[],
  limit: number,
  worker: (item: TIn, index: number) => Promise<TOut>,
  signal?: AbortSignal,
): Promise<Array<TOut | undefined>> => {
  const results: Array<TOut | undefined> = items.map(() => undefined);
  if (items.length === 0) return results;

  const iterator = items.entries();

  const runner = async (): Promise<void> => {
    for (const [index, item] of iterator) {
      if (signal?.aborted) return;
      try {
        results[index] = await worker(item, index);
      } catch {
        results[index] = undefined;
      }
    }
  };

  let effectiveLimit = limit;
  if (effectiveLimit < 1) effectiveLimit = 1;
  if (effectiveLimit > items.length) effectiveLimit = items.length;

  const runners: Promise<void>[] = [];
  for (let i = 0; i < effectiveLimit; i++) {
    runners.push(runner());
  }

  await Promise.all(runners);
  return results;
};
