import { beforeEach, describe, expect, it } from 'vitest';
import { readSemesterRange, writeSemesterRange } from './calendarSettings';

describe('semester calendar settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults winter to October–March and summer to April–September', () => {
    expect(readSemesterRange('2026-winter')).toEqual({ start: '2026-10-01', end: '2027-03-31' });
    expect(readSemesterRange('2026-summer')).toEqual({ start: '2026-04-01', end: '2026-09-30' });
  });

  it('persists a custom start and end', () => {
    writeSemesterRange('2026-winter', { start: '2026-10-12', end: '2027-02-06' });
    expect(readSemesterRange('2026-winter')).toEqual({ start: '2026-10-12', end: '2027-02-06' });
  });

  it('clamps an end date that comes before the start', () => {
    const saved = writeSemesterRange('2026-winter', { start: '2026-11-01', end: '2026-10-01' });
    expect(saved).toEqual({ start: '2026-11-01', end: '2026-11-01' });
  });

  it('falls back to the defaults when a stored date is invalid', () => {
    writeSemesterRange('2026-summer', { start: 'not-a-date', end: '2026-08-15' });
    expect(readSemesterRange('2026-summer')).toEqual({ start: '2026-04-01', end: '2026-08-15' });
  });
});
