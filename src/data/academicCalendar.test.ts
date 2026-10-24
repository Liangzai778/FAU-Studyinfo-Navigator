import { describe, expect, it } from 'vitest';
import {
  getSemesterSchedule,
  holidayDates,
  isLectureDay,
  lectureWeekNumber,
  fullWeekMondays,
  semesterIdForDate,
} from './academicCalendar';

describe('official semester calendar', () => {
  it('transcribes the UL decision for the four published semesters', () => {
    expect(getSemesterSchedule('2026-summer')).toMatchObject({
      lectureStart: '2026-04-13',
      lectureEnd: '2026-07-17',
      source: 'ul-decision',
    });
    expect(getSemesterSchedule('2026-winter')).toMatchObject({
      lectureStart: '2026-10-12',
      lectureEnd: '2027-02-05',
      source: 'ul-decision',
    });
    expect(getSemesterSchedule('2027-summer')).toMatchObject({
      lectureStart: '2027-04-12',
      lectureEnd: '2027-07-16',
      source: 'ul-decision',
    });
    expect(getSemesterSchedule('2027-winter')).toMatchObject({
      lectureStart: '2027-10-18',
      lectureEnd: '2028-02-11',
      source: 'ul-decision',
    });
  });

  it('derives later semesters from the statute rule', () => {
    expect(getSemesterSchedule('2028-winter')).toMatchObject({
      lectureStart: '2028-10-16',
      lectureEnd: '2029-02-09',
      source: 'statute',
    });
    expect(getSemesterSchedule('2028-summer')).toMatchObject({
      lectureStart: '2028-04-17',
      lectureEnd: '2028-07-21',
      source: 'statute',
    });
  });

  it('finds the full October weeks used by the winter rule', () => {
    expect(fullWeekMondays(2026, 9).map((date) => date.getDate())).toEqual([5, 12, 19]);
    expect(fullWeekMondays(2027, 9).map((date) => date.getDate())).toEqual([4, 11, 18, 25]);
  });

  it('knows the Bavarian holidays that fall inside teaching time', () => {
    const holidays = holidayDates(2026);
    expect(holidays).toContain('2026-04-03'); // Good Friday
    expect(holidays).toContain('2026-05-14'); // Ascension
    expect(holidays).toContain('2026-05-25'); // Whit Monday
    expect(holidays).toContain('2026-06-04'); // Corpus Christi
    expect(holidays).toContain('2026-10-03');
  });

  it('only counts weekdays inside the lecture period as teaching days', () => {
    const winter = getSemesterSchedule('2026-winter');
    expect(isLectureDay('2026-10-12', winter)).toBe(true);
    expect(isLectureDay('2026-10-11', winter)).toBe(false); // before
    expect(isLectureDay('2026-10-10', winter)).toBe(false); // Saturday
    expect(isLectureDay('2026-12-24', winter)).toBe(false); // Christmas closure
    expect(isLectureDay('2026-12-23', winter)).toBe(false); // last working day before closure
    expect(isLectureDay('2027-02-06', winter)).toBe(false); // after
    expect(isLectureDay('2026-11-02', winter)).toBe(true);
    expect(isLectureDay('2026-11-01', winter)).toBe(false); // All Saints
  });

  it('numbers weeks from the lecture start', () => {
    const winter = getSemesterSchedule('2026-winter');
    expect(lectureWeekNumber('2026-10-12', winter)).toBe(1);
    expect(lectureWeekNumber('2026-10-18', winter)).toBe(1);
    expect(lectureWeekNumber('2026-10-19', winter)).toBe(2);
    expect(lectureWeekNumber('2027-02-05', winter)).toBe(17);
    expect(lectureWeekNumber('2026-10-11', winter)).toBeNull();
  });

  it('picks the semester containing a date, else the next published one', () => {
    expect(semesterIdForDate('2026-10-24')).toBe('2026-winter');
    expect(semesterIdForDate('2026-03-01')).toBe('2026-summer');
    expect(semesterIdForDate('2028-05-01')).toBe('2028-summer');
  });
});
