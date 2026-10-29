import type { Gender } from '@pacevault/engine/types.ts';
import type { ThresholdKey } from '@/types.ts';

export type NumberField = 'restHr' | 'maxHr' | 'thresholdHr' | 'ftp' | 'weight' | 'birthYear';
export type TextField = NumberField | 'thresholdPace';
/** A field that can show an error: the text fields plus the gender pick. */
export type FormField = TextField | 'gender';

export interface ProfileGate {
  ready: boolean;
  save: () => void;
}

export interface FormValues {
  gender: Gender | null;
  birthYear: string;
  restHr: string;
  maxHr: string;
  thresholdHr: string;
  ftp: string;
  thresholdPace: string;
  weight: string;
}

export interface ThresholdsForm {
  form: FormValues;
  current: FormValues;
  dirty: boolean;
  valid: boolean;
  visibleError: (field: FormField) => string;
  revealErrors: (targets: FormField[]) => FormField[];
  setField: ({ field, value }: { field: TextField; value: string }) => void;
  saveField: ({ field, value }: { field: ThresholdKey; value: string }) => ThresholdKey | undefined;
  setGender: (value: string) => void;
  save: () => void;
}
