export type IntervalsKeyCheck =
  | { kind: 'checking' }
  | { kind: 'valid' }
  | { kind: 'rejected' }
  | { kind: 'failed'; message: string };
