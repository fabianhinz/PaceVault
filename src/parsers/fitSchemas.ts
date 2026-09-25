import { z } from 'zod';

const optNum = z.number().optional();
const optDateTime = z.union([z.string(), z.date()]).optional();
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
  elapsed_time: optNum,
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
  grade: optNum,
  timer_time: optNum,
});

export const fitRecordsSchema = z.array(fitRecordSchema);

export type FitRecordInput = z.infer<typeof fitRecordSchema>;

export const fitLapSchema = z.object({
  start_time: optDateTime,
  timestamp: optDateTime,
  message_index: z.object({ value: z.number() }).optional(),
  total_elapsed_time: optNum,
  total_timer_time: optNum,
  total_moving_time: optNum,
  total_distance: optNum,
  avg_speed: optNum,
  enhanced_avg_speed: optNum,
  max_speed: optNum,
  enhanced_max_speed: optNum,
  total_ascent: optNum,
  min_altitude: optNum,
  enhanced_min_altitude: optNum,
  max_altitude: optNum,
  enhanced_max_altitude: optNum,
  avg_altitude: optNum,
  enhanced_avg_altitude: optNum,
  avg_grade: optNum,
  avg_heart_rate: optNum,
  min_heart_rate: optNum,
  max_heart_rate: optNum,
  avg_cadence: optNum,
  max_cadence: optNum,
  intensity: enumStr,
  repetition_num: optNum,
});

export const fitLapsSchema = z.array(fitLapSchema);

export type FitLapInput = z.infer<typeof fitLapSchema>;
