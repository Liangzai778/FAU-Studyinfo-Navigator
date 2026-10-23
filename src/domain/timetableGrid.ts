import { z } from 'zod';

/** Weekday columns of the timetable grid. */
export const TIMETABLE_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;

/**
 * Teaching hours shown in the grid, 08:00 to 21:00 in quarter-hour steps.
 *
 * FAU lectures start at :00 or :15 (ct) and run in 45/90 minute blocks, so the
 * grid has to be finer than whole hours or a 90 minute class looks like it
 * ends at the wrong place.
 */
export const GRID_START_MINUTES = 8 * 60;
export const GRID_END_MINUTES = 21 * 60;
export const SLOT_MINUTES = 15;
export const SLOT_COUNT = (GRID_END_MINUTES - GRID_START_MINUTES) / SLOT_MINUTES;

/** Default length of a course block placed on the grid, in minutes. */
export const DEFAULT_BLOCK_MINUTES = 90;

export const timetableSlotSchema = z.object({
  day: z.enum(TIMETABLE_DAYS),
  /** Minutes from midnight, snapped to the quarter hour grid. */
  startMinutes: z
    .number()
    .int()
    .min(GRID_START_MINUTES)
    .max(GRID_END_MINUTES - SLOT_MINUTES)
    .multipleOf(SLOT_MINUTES),
  durationMinutes: z
    .number()
    .int()
    .min(SLOT_MINUTES)
    .max(GRID_END_MINUTES - GRID_START_MINUTES)
    .multipleOf(SLOT_MINUTES),
});
export type TimetableSlot = z.infer<typeof timetableSlotSchema>;

export function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function snapToSlot(minutes: number) {
  const snapped = Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
  return Math.min(GRID_END_MINUTES - SLOT_MINUTES, Math.max(GRID_START_MINUTES, snapped));
}

export function clampDuration(startMinutes: number, durationMinutes: number) {
  const maxDuration = GRID_END_MINUTES - startMinutes;
  return Math.max(SLOT_MINUTES, Math.min(maxDuration, Math.round(durationMinutes / SLOT_MINUTES) * SLOT_MINUTES));
}

/** Shared "HH:MM" time-of-day pattern used by the form inputs. */
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM.');

/** Turns "09:15" into 555 minutes from midnight. */
export function parseTimeOfDay(value: string) {
  const [hourText, minuteText] = value.split(':');
  const hours = Number(hourText);
  const minutes = Number(minuteText);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}
