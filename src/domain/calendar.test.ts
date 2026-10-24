import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  calendarEventSchema,
  defaultSemesterEnd,
  defaultSemesterStart,
  eventsOnDate,
  formatIsoDate,
  isWithinSemester,
  mondayOfWeek,
  monthGrid,
  parseIsoDate,
  teachingWeekNumber,
} from './calendar';
import type { CalendarEvent } from './calendar';

const event = (id: string, date: string, startMinutes: number | null, title = id): CalendarEvent => ({
  id,
  title,
  date,
  startMinutes,
  endMinutes: startMinutes === null ? null : startMinutes + 60,
  notes: '',
  createdAt: '2026-10-24T10:00:00.000Z',
  updatedAt: '2026-10-24T10:00:00.000Z',
});

describe('calendar date helpers', () => {
  it('round-trips ISO dates and rejects impossible ones', () => {
    expect(formatIsoDate(parseIsoDate('2026-10-05')!)).toBe('2026-10-05');
    expect(parseIsoDate('2026-02-31')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('05.10.2026')).toBeNull();
  });

  it('moves across month and year boundaries', () => {
    expect(formatIsoDate(addDays(parseIsoDate('2026-12-31')!, 1))).toBe('2027-01-01');
    expect(formatIsoDate(addDays(parseIsoDate('2026-03-01')!, -1))).toBe('2026-02-28');
    expect(formatIsoDate(addMonths(parseIsoDate('2026-01-31')!, 1))).toBe('2026-02-28');
    expect(formatIsoDate(addMonths(parseIsoDate('2026-12-15')!, 1))).toBe('2027-01-15');
  });

  it('finds the Monday of a week, including Sundays', () => {
    expect(formatIsoDate(mondayOfWeek(parseIsoDate('2026-10-05')!))).toBe('2026-10-05');
    expect(formatIsoDate(mondayOfWeek(parseIsoDate('2026-10-11')!))).toBe('2026-10-05');
  });

  it('builds a Monday-first six-week month grid', () => {
    const cells = monthGrid(2026, 1); // February 2026
    expect(cells).toHaveLength(42);
    expect(cells[0]?.date.getDay()).toBe(1);
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(28);
    expect(cells[0]?.iso).toBe('2026-01-26');
    expect(cells.at(-1)?.iso).toBe('2026-03-08');
  });

  it('defaults a semester to the first of October or April', () => {
    expect(defaultSemesterStart('2026-winter')).toBe('2026-10-01');
    expect(defaultSemesterStart('2026-summer')).toBe('2026-04-01');
    expect(defaultSemesterEnd('2026-winter')).toBe('2027-03-31');
    expect(defaultSemesterEnd('2026-summer')).toBe('2026-09-30');
  });

  it('only treats dates inside the semester range as teaching days', () => {
    expect(isWithinSemester('2026-10-01', '2026-10-01', '2027-03-31')).toBe(true);
    expect(isWithinSemester('2026-09-30', '2026-10-01', '2027-03-31')).toBe(false);
    expect(isWithinSemester('2027-04-01', '2026-10-01', '2027-03-31')).toBe(false);
  });

  it('counts teaching weeks from the calendar week that contains the start', () => {
    expect(teachingWeekNumber('2026-10-01', '2026-10-01')).toBe(1);
    expect(teachingWeekNumber('2026-09-28', '2026-10-01')).toBe(1);
    expect(teachingWeekNumber('2026-10-04', '2026-10-01')).toBe(1);
    expect(teachingWeekNumber('2026-10-05', '2026-10-01')).toBe(2);
    expect(teachingWeekNumber('2026-09-27', '2026-10-01')).toBeNull();
  });
});

describe('calendar events', () => {
  it('sorts all-day events first, then by start time', () => {
    const events = [event('b', '2026-10-05', 600), event('a', '2026-10-05', null), event('c', '2026-10-05', 540)];
    expect(eventsOnDate(events, '2026-10-05').map((item) => item.id)).toEqual(['a', 'c', 'b']);
    expect(eventsOnDate(events, '2026-10-06')).toEqual([]);
  });

  it('rejects an event that ends before it starts', () => {
    const parsed = calendarEventSchema.safeParse({
      ...event('x', '2026-10-05', 600),
      startMinutes: 600,
      endMinutes: 540,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a date that does not exist', () => {
    const parsed = calendarEventSchema.safeParse({
      ...event('x', '2026-10-05', null),
      date: '2026-02-30',
    });
    expect(parsed.success).toBe(false);
  });
});
