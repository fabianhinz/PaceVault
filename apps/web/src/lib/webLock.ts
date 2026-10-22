export const withExclusiveLock = async <T>(name: string, task: () => Promise<T>): Promise<T> => {
  if (typeof navigator === 'undefined' || !('locks' in navigator)) return task();
  return navigator.locks.request(name, { mode: 'exclusive' }, task);
};
