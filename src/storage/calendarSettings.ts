import {
  defaultSemesterEnd,
  defaultSemesterStart,
  formatIsoDate,
  parseIsoDate,
} from '../domain/calendar';

const STORAGE_KEY = 'fau-study-navigator.calendar.v1';

type CalendarSettings = {
  semesterStarts: Record<string, string>;
  semesterEnds: Record<string, string>;
};

export type SemesterRange = {
  start: string;
  end: string;
};

function readRaw(): CalendarSettings {
  if (typeof localStorage === 'undefined') return { semesterStarts: {}, semesterEnds: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<CalendarSettings>;
    const starts = parsed.semesterStarts;
    const ends = parsed.semesterEnds;
    const pickDates = (value: unknown) =>
      value && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
          )
        : {};
    return { semesterStarts: pickDates(starts), semesterEnds: pickDates(ends) };
  } catch {
    return { semesterStarts: {}, semesterEnds: {} };
  }
}

/**
 * Start and end a student chose for a semester.
 *
 * Defaults: 1 October – 31 March for winter, 1 April – 30 September for summer.
 * Only the display is affected; no academic rule depends on these dates.
 */
export function readSemesterRange(semesterId: string): SemesterRange {
  const settings = readRaw();
  const storedStart = settings.semesterStarts[semesterId];
  const storedEnd = settings.semesterEnds[semesterId];
  const start = storedStart && parseIsoDate(storedStart) ? storedStart : defaultSemesterStart(semesterId);
  let end = storedEnd && parseIsoDate(storedEnd) ? storedEnd : defaultSemesterEnd(semesterId);
  if (end < start) end = start;
  return { start, end };
}

export function writeSemesterRange(semesterId: string, range: SemesterRange): SemesterRange {
  const parsedStart = parseIsoDate(range.start);
  const parsedEnd = parseIsoDate(range.end);
  const start = parsedStart ? formatIsoDate(parsedStart) : defaultSemesterStart(semesterId);
  let end = parsedEnd ? formatIsoDate(parsedEnd) : defaultSemesterEnd(semesterId);
  if (end < start) end = start;

  const settings = readRaw();
  settings.semesterStarts[semesterId] = start;
  settings.semesterEnds[semesterId] = end;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // A blocked localStorage must not break the calendar; this visit still
    // shows what the student typed.
  }
  return { start, end };
}
