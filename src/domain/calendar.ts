import { z } from 'zod';

/** A calendar date without time, e.g. "2026-10-05". */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.');

const calendarEventBaseSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().trim().min(1).max(120),
  date: isoDateSchema,
  startMinutes: z.number().int().min(0).max(24 * 60 - 1).nullable(),
  endMinutes: z.number().int().min(0).max(24 * 60 - 1).nullable(),
  notes: z.string().max(500),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type EventTimeShape = {
  date: string;
  startMinutes: number | null;
  endMinutes: number | null;
};

function refineEvent(event: EventTimeShape, context: z.RefinementCtx) {
  if (event.startMinutes !== null && event.endMinutes !== null && event.endMinutes <= event.startMinutes) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Event end must be after its start.',
      path: ['endMinutes'],
    });
  }
  if (!parseIsoDate(event.date)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Date does not exist.', path: ['date'] });
  }
}

export const calendarEventSchema = calendarEventBaseSchema.superRefine(refineEvent);

export type CalendarEvent = z.infer<typeof calendarEventSchema>;

export const calendarEventInputSchema = calendarEventBaseSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .superRefine(refineEvent);
export type CalendarEventInput = z.infer<typeof calendarEventInputSchema>;

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function formatIsoDate(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addMonths(date: Date, months: number): Date {
  const lastDayOfTarget = new Date(date.getFullYear(), date.getMonth() + months + 1, 0).getDate();
  return new Date(date.getFullYear(), date.getMonth() + months, Math.min(date.getDate(), lastDayOfTarget));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Monday-based weekday index: Monday 0 … Sunday 6. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Monday of the week that contains `date`. */
export function mondayOfWeek(date: Date): Date {
  return addDays(startOfDay(date), -weekdayIndex(date));
}

export type MonthCell = {
  iso: string;
  date: Date;
  /** False for the padding days that belong to the previous or next month. */
  inMonth: boolean;
};

/** Six weeks of Monday-first cells covering the month. */
export function monthGrid(year: number, monthIndex: number): MonthCell[] {
  const first = new Date(year, monthIndex, 1);
  const gridStart = mondayOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      iso: formatIsoDate(date),
      date,
      inMonth: date.getMonth() === monthIndex && date.getFullYear() === year,
    };
  });
}

export type SemesterDateInfo = {
  /** Default start is the 1st of the month the semester usually begins in. */
  defaultStart: string;
  startIso: string;
};

/** Winter starts in October, summer in April; both on the 1st by default. */
export function defaultSemesterStart(semesterId: string): string {
  const [yearText, term] = semesterId.split('-');
  const year = Number(yearText);
  if (!Number.isFinite(year)) return formatIsoDate(startOfMonth(new Date()));
  const month = term === 'summer' ? 3 : 9;
  return formatIsoDate(new Date(year, month, 1));
}

/**
 * Natural end of a semester, used to stop drawing weekly courses after term.
 * Winter runs to 31 March, summer to 30 September.
 */
export function defaultSemesterEnd(semesterId: string): string {
  const [yearText, term] = semesterId.split('-');
  const year = Number(yearText);
  if (!Number.isFinite(year)) return `${new Date().getFullYear()}-12-31`;
  return term === 'summer' ? `${year}-09-30` : `${year + 1}-03-31`;
}

export function isWithinSemester(dateIso: string, startIso: string, endIso: string): boolean {
  return dateIso >= startIso && dateIso <= endIso;
}

/**
 * 1-based teaching week for a date, aligned to calendar weeks.
 *
 * The week containing the semester start is week 1, so a Monday row and its
 * "week N" label always agree. Counting seven-day blocks from the start date
 * instead would split the first week across two calendar rows.
 */
export function teachingWeekNumber(dateIso: string, startIso: string): number | null {
  const date = parseIsoDate(dateIso);
  const start = parseIsoDate(startIso);
  if (!date || !start) return null;
  const dateWeek = mondayOfWeek(date);
  const startWeek = mondayOfWeek(start);
  const diff = Math.round((dateWeek.getTime() - startWeek.getTime()) / 86_400_000);
  if (diff < 0) return null;
  return Math.floor(diff / 7) + 1;
}

/** Events on one date, sorted by start time (all-day events first). */
export function eventsOnDate(events: readonly CalendarEvent[], dateIso: string): CalendarEvent[] {
  return events
    .filter((event) => event.date === dateIso)
    .slice()
    .sort((left, right) => (left.startMinutes ?? -1) - (right.startMinutes ?? -1) || left.title.localeCompare(right.title));
}

export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return '';
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
