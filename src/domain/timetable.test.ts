import { describe, expect, it } from 'vitest';
import type { TimetableDay } from './planner';
import { buildTimetable, findFreeStart } from './planner';
import { timetableDayLabelKey } from './timetableLabels';

const course = (id: string, title: string, ects: number | null) => ({
  id,
  title,
  ects,
  moduleId: null,
  moduleVersionId: null,
  isExtraCourse: false,
  countsTowardDegree: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

const attempt = (id: string, courseId: string, semesterId: string, location = '', day: TimetableDay | null = null) => ({
  id,
  courseId,
  semesterId,
  status: 'planned' as const,
  recognitionConfirmed: false,
  poVersionId: 'po-ils-2026',
  requirementGroupId: null,
  location,
  day,
  startMinutes: null,
  durationMinutes: null,
  notes: '',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

describe('timetable', () => {
  it('groups attempts by semester in chronological order', () => {
    const tables = buildTimetable(
      [attempt('a1', 'c1', '2027-summer'), attempt('a2', 'c2', '2026-winter')],
      [course('c1', 'Biomathematik', 10), course('c2', 'Statistics', 5)],
    );
    expect(tables.map((table) => table.semesterId)).toEqual(['2026-winter', '2027-summer']);
  });

  it('sorts by weekday and then room, keeping unscheduled courses last', () => {
    const tables = buildTimetable(
      [
        attempt('a1', 'c1', '2026-winter', 'Hörsaal B', 'wed'),
        attempt('a2', 'c2', '2026-winter', 'Hörsaal A', 'mon'),
        attempt('a3', 'c3', '2026-winter', '', null),
      ],
      [course('c1', 'One', 5), course('c2', 'Two', 5), course('c3', 'Three', 5)],
    );
    expect(tables[0]!.entries.map((entry) => entry.title)).toEqual(['Two', 'One', 'Three']);
  });

  it('totals ECTS and counts missing rooms', () => {
    const tables = buildTimetable(
      [
        attempt('a1', 'c1', '2026-winter', 'Staudtstr. 5', 'mon'),
        attempt('a2', 'c2', '2026-winter', '', 'tue'),
        attempt('a3', 'c3', '2026-winter', '  ', null),
      ],
      [course('c1', 'One', 10), course('c2', 'Two', 5), course('c3', 'Three', null)],
    );
    expect(tables[0]!.totalEcts).toBe(15);
    expect(tables[0]!.missingLocations).toBe(2);
  });

  it('keeps two attempts of the same course in different semesters separate', () => {
    const tables = buildTimetable(
      [
        attempt('a1', 'c1', '2026-winter', 'Hörsaal A', 'mon'),
        attempt('a2', 'c1', '2027-summer', 'Hörsaal C', 'thu'),
      ],
      [course('c1', 'Retaken', 5)],
    );
    expect(tables).toHaveLength(2);
    expect(tables[0]!.entries[0]!.location).toBe('Hörsaal A');
    expect(tables[1]!.entries[0]!.location).toBe('Hörsaal C');
  });

  it('drops attempts whose course was deleted', () => {
    expect(buildTimetable([attempt('a1', 'missing', '2026-winter')], [])).toEqual([]);
  });

  it('sorts courses on the same day by clock time, unscheduled ones last', () => {
    const timed = (id: string, courseId: string, startMinutes: number | null) => ({
      ...attempt(id, courseId, '2026-winter', 'Hörsaal A', 'mon'),
      startMinutes,
      durationMinutes: startMinutes === null ? null : 90,
    });
    const tables = buildTimetable(
      [timed('a1', 'c1', 14 * 60), timed('a2', 'c2', 8 * 60), timed('a3', 'c3', null)],
      [course('c1', 'Later', 5), course('c2', 'Early', 5), course('c3', 'NoTime', 5)],
    );
    expect(tables[0]!.entries.map((entry) => entry.title)).toEqual(['Early', 'Later', 'NoTime']);
  });

  it('carries the clock time onto the timetable entry', () => {
    const tables = buildTimetable(
      [{ ...attempt('a1', 'c1', '2026-winter', 'Hörsaal A', 'mon'), startMinutes: 555, durationMinutes: 90 }],
      [course('c1', 'Biomathematik', 10)],
    );
    expect(tables[0]!.entries[0]).toMatchObject({ startMinutes: 555, durationMinutes: 90, status: 'planned' });
  });

  it('moves a block down instead of overlapping an existing one', () => {
    const existing = [{ day: 'mon' as const, startMinutes: 9 * 60, durationMinutes: 90 }];
    // 09:00 is taken, so the next free quarter hour is 10:30.
    expect(findFreeStart('mon', 9 * 60, 90, existing)).toBe(10 * 60 + 30);
    // A different day is untouched.
    expect(findFreeStart('tue', 9 * 60, 90, existing)).toBe(9 * 60);
  });

  it('reports no free slot when the day is full', () => {
    const full = [{ day: 'fri' as const, startMinutes: 8 * 60, durationMinutes: 13 * 60 }];
    expect(findFreeStart('fri', 8 * 60, 90, full)).toBeNull();
  });

  it('labels an unassigned day separately from real weekdays', () => {
    expect(timetableDayLabelKey(null)).toBe('planner.timetable.day.unassigned');
    expect(timetableDayLabelKey('mon')).toBe('planner.timetable.day.mon');
  });
});
