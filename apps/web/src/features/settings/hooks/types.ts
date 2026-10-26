export type NumberField = 'restHr' | 'maxHr' | 'thresholdHr' | 'ftp' | 'weight' | 'birthYear';
export type TextField = NumberField | 'thresholdPace';
/** A field that can show an error: the text fields plus the gender pick. */
export type FormField = TextField | 'gender';

export interface ProfileGate {
  ready: boolean;
  save: () => void;
}
