import type { SessionRecord } from '@/packages/engine/types.ts';

export {
  makeCyclingRecords,
  makeRunningRecords,
  makeLaps,
  makeLapsFromRecords,
} from '@/lib/factories/records.ts';

export const makeInvalidRecords = (
  sessionId: string,
  type: 'highHr' | 'highPower' | 'zeroHr',
): SessionRecord[] => {
  const count = 20;
  const records: SessionRecord[] = [];

  for (let i = 0; i < count; i++) {
    const base: SessionRecord = { sessionId, timestamp: i };

    switch (type) {
      case 'highHr':
        base.hr = 240;
        base.power = 200;
        break;
      case 'highPower':
        base.power = 3000;
        base.hr = 150;
        break;
      case 'zeroHr':
        base.hr = 0;
        base.power = 200;
        break;
    }

    records.push(base);
  }

  return records;
};
