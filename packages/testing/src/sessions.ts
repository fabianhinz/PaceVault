import type { TrainingSession } from '@pacevault/engine/types.ts';
import { SESSION_DERIVATION_VERSION } from '@pacevault/engine/sessionDerivation.ts';

export const createMockTrainingSession = (
  overrides?: Partial<TrainingSession>,
): TrainingSession => ({
  id: `session-${Date.now()}`,
  sport: 'cycling',
  date: Date.now(),
  duration: 3600,
  distance: 30000,
  avgHr: 150,
  maxHr: 175,
  avgPower: 200,
  normalizedPower: 215,
  avgCadence: 88,
  avgPace: undefined,
  elevationGain: 300,
  tss: 80,
  stressMethod: 'tss',
  isPlanned: false,
  hasDetailedRecords: true,
  derivationVersion: SESSION_DERIVATION_VERSION,
  createdAt: Date.now(),
  source: { kind: 'file' },
  ...overrides,
});
