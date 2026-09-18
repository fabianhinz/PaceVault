import { z } from 'zod';

const optStr = z.string().nullish();
const optNum = z.number().nullish();

export const intervalsAthleteSchema = z.object({
  firstname: optStr,
  icu_athlete_id: optStr,
});

export type IntervalsAthlete = z.infer<typeof intervalsAthleteSchema>;

const intervalsActivitySchema = z.object({
  id: z.string(),
  name: optStr,
  type: optStr,
  sub_type: optStr,
  start_date_local: optStr,
  source: optStr,
  file_type: optStr,
  moving_time: optNum,
  distance: optNum,
  icu_training_load: optNum,
  _note: optStr,
});

export type IntervalsActivity = z.infer<typeof intervalsActivitySchema>;

export interface ParsedActivityList {
  activities: IntervalsActivity[];
  dropped: number;
}

export const parseActivityList = (raw: unknown): ParsedActivityList => {
  if (!Array.isArray(raw)) {
    return { activities: [], dropped: 0 };
  }

  const activities: IntervalsActivity[] = [];
  let dropped = 0;

  for (const entry of raw) {
    const result = intervalsActivitySchema.safeParse(entry);
    if (result.success) {
      activities.push(result.data);
    } else {
      dropped++;
    }
  }

  return { activities, dropped };
};
