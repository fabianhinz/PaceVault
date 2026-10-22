import { z } from 'zod';

const optNum = z.number().optional();
const dateTime = z.union([z.string(), z.date()]);
// fit-file-parser returns raw integers for unknown/invalid FIT enum values.
// This helper accepts both string and number, keeping strings and dropping numbers to undefined.
export const enumStr = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (typeof v === 'string') return v;
    return undefined;
  });

export const fitFileIdSchema = z.object({
  serial_number: optNum,
  time_created: z.union([z.string(), z.date()]),
});

export const fitRecordSchema = z.object({
  elapsed_time: z.number(),
  heart_rate: optNum,
  power: optNum,
  cadence: optNum,
  speed: optNum,
  enhanced_speed: optNum,
  position_lat: optNum,
  position_long: optNum,
  altitude: optNum,
  enhanced_altitude: optNum,
  distance: optNum,
  timer_time: optNum,
});

export const fitRecordsSchema = z.array(fitRecordSchema);

export type FitRecordInput = z.infer<typeof fitRecordSchema>;

export const fitLapSchema = z.object({
  start_time: dateTime,
  timestamp: dateTime,
  message_index: z.object({ value: z.number() }).optional(),
  total_elapsed_time: z.number(),
  total_timer_time: z.number(),
  total_moving_time: optNum,
  total_distance: optNum,
  min_heart_rate: optNum,
  max_heart_rate: optNum,
  intensity: enumStr,
});

export const fitLapsSchema = z.array(fitLapSchema);

export type FitLapInput = z.infer<typeof fitLapSchema>;
