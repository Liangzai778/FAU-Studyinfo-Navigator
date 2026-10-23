import type { TimetableDay } from '../domain/planner';

export const TIMETABLE_DAYS: readonly TimetableDay[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export function timetableDayLabelKey(day: TimetableDay | null): `planner.timetable.day.${TimetableDay | 'unassigned'}` {
  return `planner.timetable.day.${day ?? 'unassigned'}`;
}
