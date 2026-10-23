import { describe, expect, it } from 'vitest';
import type { CourseMeeting, TimetableDay, TimetableEntry } from './planner';
import { attemptDays, buildTimetable, findClashes, findFreeStart, normaliseMeetings, timetableOccurrences } from './planner';
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
  meetings: [] as CourseMeeting[],
  days: [] as TimetableDay[],
  day,
  startMinutes: null as number | null,
  durationMinutes: null as number | null,
  notes: '',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
});

/** Attempt that meets on the given days at the given times. */
const meets = (id: string, courseId: string, semesterId: string, meetings: CourseMeeting[], location = 'Hörsaal A') => ({
  ...attempt(id, courseId, semesterId, location),
  meetings,
});

const entry = (overrides: Partial<TimetableEntry> & Pick<TimetableEntry, 'attemptId' | 'title' | 'meetings'>): TimetableEntry => ({
  courseId: overrides.attemptId,
  ects: 5,
  semesterId: '2026-winter',
  location: '',
  daysWithoutTime: [],
  status: 'planned',
  isExtraCourse: false,
  ...overrides,
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
        meets('a1', 'c1', '2026-winter', [{ day: 'wed', startMinutes: 9 * 60, durationMinutes: 90 }], 'Hörsaal B'),
        meets('a2', 'c2', '2026-winter', [{ day: 'mon', startMinutes: 9 * 60, durationMinutes: 90 }], 'Hörsaal A'),
        attempt('a3', 'c3', '2026-winter', '', null),
      ],
      [course('c1', 'One', 5), course('c2', 'Two', 5), course('c3', 'Three', 5)],
    );
    expect(tables[0]!.entries.map((item) => item.title)).toEqual(['Two', 'One', 'Three']);
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
    const tables = buildTimetable(
      [
        meets('a1', 'c1', '2026-winter', [{ day: 'mon', startMinutes: 14 * 60, durationMinutes: 90 }]),
        meets('a2', 'c2', '2026-winter', [{ day: 'mon', startMinutes: 8 * 60, durationMinutes: 90 }]),
        attempt('a3', 'c3', '2026-winter', '', null),
      ],
      [course('c1', 'Later', 5), course('c2', 'Early', 5), course('c3', 'NoTime', 5)],
    );
    expect(tables[0]!.entries.map((item) => item.title)).toEqual(['Early', 'Later', 'NoTime']);
  });

  it('carries the clock time onto the timetable entry', () => {
    const tables = buildTimetable(
      [meets('a1', 'c1', '2026-winter', [{ day: 'mon', startMinutes: 555, durationMinutes: 90 }])],
      [course('c1', 'Biomathematik', 10)],
    );
    expect(tables[0]!.entries[0]).toMatchObject({
      meetings: [{ day: 'mon', startMinutes: 555, durationMinutes: 90 }],
      status: 'planned',
    });
  });

  it('gives each weekday its own time', () => {
    // Monday at 09:00 and Wednesday at 14:00 is what the student actually has.
    const tables = buildTimetable(
      [
        meets('a1', 'c1', '2026-winter', [
          { day: 'mon', startMinutes: 9 * 60, durationMinutes: 90 },
          { day: 'wed', startMinutes: 14 * 60, durationMinutes: 90 },
        ]),
      ],
      [course('c1', 'Biomathematik', 10)],
    );
    expect(timetableOccurrences(tables[0]!.entries[0]!)).toEqual([
      { day: 'mon', startMinutes: 540, durationMinutes: 90 },
      { day: 'wed', startMinutes: 840, durationMinutes: 90 },
    ]);
  });

  it('sorts by the earliest time when the days differ', () => {
    const tables = buildTimetable(
      [
        meets('a1', 'c1', '2026-winter', [{ day: 'wed', startMinutes: 8 * 60, durationMinutes: 90 }]),
        meets('a2', 'c2', '2026-winter', [{ day: 'mon', startMinutes: 16 * 60, durationMinutes: 90 }]),
      ],
      [course('c1', 'WednesdayEarly', 5), course('c2', 'MondayLate', 5)],
    );
    expect(tables[0]!.entries.map((item) => item.title)).toEqual(['MondayLate', 'WednesdayEarly']);
  });

  it('keeps one record for a course that meets twice a week', () => {
    const tables = buildTimetable(
      [
        meets('a1', 'c1', '2026-winter', [
          { day: 'mon', startMinutes: 8 * 60, durationMinutes: 90 },
          { day: 'wed', startMinutes: 8 * 60, durationMinutes: 90 },
        ]),
      ],
      [course('c1', 'Biomathematik', 10)],
    );
    expect(tables[0]!.entries).toHaveLength(1);
    expect(attemptDays(tables[0]!.entries[0]!)).toEqual(['mon', 'wed']);
    // The ECTS are counted once, not once per meeting.
    expect(tables[0]!.totalEcts).toBe(10);
  });

  it('refuses two blocks on the same weekday', () => {
    const duplicate = {
      day: 'mon' as const,
      startMinutes: 9 * 60,
      durationMinutes: 90,
    };
    const { meetings } = normaliseMeetings({ ...attempt('a1', 'c1', '2026-winter'), meetings: [duplicate, { ...duplicate, startMinutes: 14 * 60 }] });
    expect(meetings).toHaveLength(1);
    expect(meetings[0]!.startMinutes).toBe(540);
  });

  it('ignores times off the quarter-hour grid or outside 08:00-21:00', () => {
    const { meetings } = normaliseMeetings({
      ...attempt('a1', 'c1', '2026-winter'),
      meetings: [
        { day: 'mon', startMinutes: 9 * 60 + 7, durationMinutes: 90 },
        { day: 'tue', startMinutes: 23 * 60, durationMinutes: 90 },
        { day: 'wed', startMinutes: 10 * 60, durationMinutes: 90 },
      ],
    });
    expect(meetings).toEqual([{ day: 'wed', startMinutes: 600, durationMinutes: 90 }]);
  });

  describe('reading data saved by older builds', () => {
    it('folds a legacy single day into the day list', () => {
      expect(attemptDays({ ...attempt('a1', 'c1', '2026-winter'), day: 'thu' })).toEqual(['thu']);
      expect(attemptDays({ ...attempt('a1', 'c1', '2026-winter'), days: ['mon', 'wed'], day: 'wed' })).toEqual(['mon', 'wed']);
      expect(attemptDays(attempt('a1', 'c1', '2026-winter'))).toEqual([]);
    });

    it('reuses the old shared time for every day of a twice-weekly course', () => {
      // Shape written by the previous build: two days, one time for both.
      const { meetings, daysWithoutTime } = normaliseMeetings({
        ...attempt('a1', 'c1', '2026-winter'),
        days: ['mon', 'wed'],
        startMinutes: 8 * 60,
        durationMinutes: 90,
      });
      expect(meetings).toEqual([
        { day: 'mon', startMinutes: 480, durationMinutes: 90 },
        { day: 'wed', startMinutes: 480, durationMinutes: 90 },
      ]);
      expect(daysWithoutTime).toEqual([]);
    });

    it('keeps a weekday whose time was never filled in', () => {
      const { meetings, daysWithoutTime } = normaliseMeetings({ ...attempt('a1', 'c1', '2026-winter'), days: ['thu', 'fri'] });
      expect(meetings).toEqual([]);
      expect(daysWithoutTime).toEqual(['thu', 'fri']);
    });

    it('does not duplicate a day that is both in the list and in the legacy column', () => {
      const { meetings } = normaliseMeetings({
        ...attempt('a1', 'c1', '2026-winter'),
        days: ['mon'],
        day: 'mon',
        startMinutes: 600,
        durationMinutes: 90,
      });
      expect(meetings).toEqual([{ day: 'mon', startMinutes: 600, durationMinutes: 90 }]);
    });
  });

  it('moves a block down instead of overlapping an existing one', () => {
    const existing = [meets('x', 'x1', '2026-winter', [{ day: 'mon', startMinutes: 9 * 60, durationMinutes: 90 }])];
    // 09:00 is taken, so the next free quarter hour is 10:30.
    expect(findFreeStart('mon', 9 * 60, 90, existing)).toBe(10 * 60 + 30);
    // A different day is untouched.
    expect(findFreeStart('tue', 9 * 60, 90, existing)).toBe(9 * 60);
  });

  it('reports no free slot when the day is full', () => {
    const full = [meets('x', 'x1', '2026-winter', [{ day: 'fri', startMinutes: 8 * 60, durationMinutes: 13 * 60 }])];
    expect(findFreeStart('fri', 8 * 60, 90, full)).toBeNull();
  });

  it('reports a clash only when two courses really overlap', () => {
    const block = (start: number, day: TimetableDay = 'mon'): CourseMeeting[] => [{ day, startMinutes: start, durationMinutes: 90 }];
    const overlapping = [entry({ attemptId: 'a', title: 'A', meetings: block(9 * 60) }), entry({ attemptId: 'b', title: 'B', meetings: block(10 * 60) })];
    expect(findClashes(overlapping)).toHaveLength(1);
    expect(findClashes(overlapping)[0]!.day).toBe('mon');

    const backToBack = [entry({ attemptId: 'a', title: 'A', meetings: block(9 * 60) }), entry({ attemptId: 'b', title: 'B', meetings: block(10 * 60 + 30) })];
    expect(findClashes(backToBack)).toHaveLength(0);

    const differentDays = [entry({ attemptId: 'a', title: 'A', meetings: block(9 * 60) }), entry({ attemptId: 'b', title: 'B', meetings: block(9 * 60, 'tue') })];
    expect(findClashes(differentDays)).toHaveLength(0);
  });

  it('compares each day of a twice-weekly course against its own time', () => {
    // Monday 09:00-10:30 and Wednesday 14:00-15:30.
    const twice = entry({
      attemptId: 'a',
      title: 'Biomathematik',
      meetings: [
        { day: 'mon', startMinutes: 9 * 60, durationMinutes: 90 },
        { day: 'wed', startMinutes: 14 * 60, durationMinutes: 90 },
      ],
    });
    // Clashes with Monday morning only.
    const mondayMover = entry({ attemptId: 'b', title: 'Statistics', meetings: [{ day: 'mon', startMinutes: 10 * 60, durationMinutes: 90 }] });
    // Clashes with Wednesday afternoon only.
    const wednesdayMover = entry({ attemptId: 'c', title: 'Systems Biology', meetings: [{ day: 'wed', startMinutes: 15 * 60, durationMinutes: 90 }] });
    // Sitting in Monday's 14:00 slot is fine: that time only counts on Wednesday.
    const mondayAfternoon = entry({ attemptId: 'd', title: 'Seminar', meetings: [{ day: 'mon', startMinutes: 14 * 60, durationMinutes: 90 }] });

    expect(findClashes([twice, mondayMover]).map((clash) => clash.second.title)).toEqual(['Statistics']);
    expect(findClashes([twice, wednesdayMover]).map((clash) => clash.second.title)).toEqual(['Systems Biology']);
    expect(findClashes([twice, mondayAfternoon])).toHaveLength(0);
  });

  it('treats every meeting day of a twice-weekly course as blocked', () => {
    const taken = [
      meets('x', 'x1', '2026-winter', [
        { day: 'mon', startMinutes: 9 * 60, durationMinutes: 90 },
        { day: 'wed', startMinutes: 9 * 60, durationMinutes: 90 },
      ]),
    ];
    expect(findFreeStart('mon', 9 * 60, 90, taken)).toBe(10 * 60 + 30);
    expect(findFreeStart('wed', 9 * 60, 90, taken)).toBe(10 * 60 + 30);
    expect(findFreeStart('tue', 9 * 60, 90, taken)).toBe(9 * 60);
  });

  it('labels an unassigned day separately from real weekdays', () => {
    expect(timetableDayLabelKey(null)).toBe('planner.timetable.day.unassigned');
    expect(timetableDayLabelKey('mon')).toBe('planner.timetable.day.mon');
  });
});
