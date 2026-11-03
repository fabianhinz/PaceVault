import { useSyncExternalStore } from 'react';

export type Hover = { kind: 'explorer'; seconds: number } | { kind: 'pass'; sessionId: string } | null;

let current: Hover = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setHover = (next: Hover) => {
  if (next === current) return;
  if (next !== null && current !== null && next.kind === current.kind) {
    if (next.kind === 'explorer' && current.kind === 'explorer' && next.seconds === current.seconds) return;
    if (next.kind === 'pass' && current.kind === 'pass' && next.sessionId === current.sessionId) return;
  }
  current = next;
  for (const listener of listeners) listener();
};

export const useHover = (): Hover => useSyncExternalStore(subscribe, () => current);

export const useHoveredPassId = (): string | null =>
  useSyncExternalStore(subscribe, () => {
    if (current !== null && current.kind === 'pass') return current.sessionId;
    return null;
  });

export const useExplorerSeconds = (): number | null =>
  useSyncExternalStore(subscribe, () => {
    if (current !== null && current.kind === 'explorer') return current.seconds;
    return null;
  });
