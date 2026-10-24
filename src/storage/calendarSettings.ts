import { defaultSemesterStart, formatIsoDate, parseIsoDate } from '../domain/calendar';

const STORAGE_KEY = 'fau-study-navigator.calendar.v1';

type CalendarSettings = {
  semesterStarts: Record<string, string>;
};

function readRaw(): CalendarSettings {
  if (typeof localStorage === 'undefined') return { semesterStarts: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<CalendarSettings>;
    const starts = parsed.semesterStarts;
    if (!starts || typeof starts !== 'object') return { semesterStarts: {} };
    return {
      semesterStarts: Object.fromEntries(
        Object.entries(starts).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
      ),
    };
  } catch {
    return { semesterStarts: {} };
  }
}

/**
 * The start date a student chose for a semester, falling back to the 1st of
 * October (winter) or April (summer). Stored in localStorage because it is a
 * low-sensitivity display preference, like language and theme.
 */
export function readSemesterStart(semesterId: string): string {
  const stored = readRaw().semesterStarts[semesterId];
  if (stored && parseIsoDate(stored)) return stored;
  return defaultSemesterStart(semesterId);
}

export function writeSemesterStart(semesterId: string, dateIso: string): string {
  const parsed = parseIsoDate(dateIso);
  const value = parsed ? formatIsoDate(parsed) : defaultSemesterStart(semesterId);
  const settings = readRaw();
  settings.semesterStarts[semesterId] = value;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // A full or blocked localStorage must not break the calendar; the default
    // start is still returned and the user sees the date they typed this visit.
  }
  return value;
}
