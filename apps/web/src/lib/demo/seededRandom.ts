import { v4 } from 'uuid';

export interface SeededRandom {
  next: () => number;
  between: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  uuid: () => string;
}

// mulberry32: tiny, fast and good enough for synthetic data.
const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const createSeededRandom = (seed: number): SeededRandom => {
  const next = mulberry32(seed);
  const between = (min: number, max: number) => min + next() * (max - min);
  const pick = <T>(items: readonly T[]): T => {
    const item = items[Math.floor(next() * items.length)];
    if (item === undefined) throw new Error('pick() needs a non-empty list');
    return item;
  };
  const uuid = () => {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(next() * 256);
    return v4({ random: bytes });
  };
  return { next, between, pick, uuid };
};
