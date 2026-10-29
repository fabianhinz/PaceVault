import { z } from 'zod';

const optNumSchema = z.number().optional();
const dateTimeSchema = z.union([z.string(), z.date()]);
// fit-file-parser returns raw integers for unknown/invalid FIT enum values.
// This helper accepts both string and number, keeping strings and dropping numbers to undefined.
export const enumStrSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (typeof v === 'string') return v;
    return undefined;
  });

export const fitFileIdSchema = z.object({
  serial_number: optNumSchema,
  time_created: dateTimeSchema,
});

export type FitFileId = z.infer<typeof fitFileIdSchema>;

export const fitRecordInputSchema = z.object({
  elapsed_time: z.number(),
  heart_rate: optNumSchema,
  power: optNumSchema,
  cadence: optNumSchema,
  speed: optNumSchema,
  enhanced_speed: optNumSchema,
  position_lat: optNumSchema,
  position_long: optNumSchema,
  altitude: optNumSchema,
  enhanced_altitude: optNumSchema,
  distance: optNumSchema,
  timer_time: optNumSchema,
});

export const fitRecordsSchema = z.array(fitRecordInputSchema);

export type FitRecordInput = z.infer<typeof fitRecordInputSchema>;

export const fitLapInputSchema = z.object({
  start_time: dateTimeSchema,
  timestamp: dateTimeSchema,
  message_index: z.object({ value: z.number() }).optional(),
  total_elapsed_time: z.number(),
  total_timer_time: z.number(),
  total_moving_time: optNumSchema,
  total_distance: optNumSchema,
  min_heart_rate: optNumSchema,
  max_heart_rate: optNumSchema,
  intensity: enumStrSchema,
});

export const fitLapsSchema = z.array(fitLapInputSchema);

export type FitLapInput = z.infer<typeof fitLapInputSchema>;
