/**
 * Official FAU semester and lecture dates.
 *
 * Sources (checked 2026-10-24):
 *  - VorlZ-Satzung, 6 June 2023, amended 31 July 2026
 *    https://www.fau.de/... (Einteilung des Studienjahres und Vorlesungszeit)
 *  - UL-Beschluss of 14 February 2024: lecture periods and free days up to
 *    winter semester 2027/28.
 *
 * The four semesters below are transcribed from the decision. Later semesters
 * are derived from the statute: the winter lecture period starts on the Monday
 * of the penultimate full October week and runs 17 weeks; the summer period
 * starts on the Monday of the second-last full April week and runs 14 weeks.
 * Christmas, Easter and Pentecost breaks come from the statute.
 */

export type SemesterSchedule = {
  semesterId: string;
  semesterStart: string;
  semesterEnd: string;
  lectureStart: string;
  lectureEnd: string;
  /** Extra days without lectures on top of weekends, holidays and breaks. */
  freeDays: string[];
  source: 'ul-decision' | 'statute';
};

function iso(year: number, monthIndex: number, day: number): string {
  return [
    String(year).padStart(4, '0'),
    String(monthIndex + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function parse(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

function format(date: Date): string {
  return iso(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Monday-based weekday index: Monday 0 … Sunday 6. */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function mondayOfWeek(date: Date): Date {
  return addDays(date, -weekdayIndex(date));
}

/** Mondays of the weeks that lie completely inside the given month. */
export function fullWeekMondays(year: number, monthIndex: number): Date[] {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const mondays: Date[] = [];
  let cursor = mondayOfWeek(first);
  if (cursor < first) cursor = addDays(cursor, 7);
  for (; addDays(cursor, 6) <= last; cursor = addDays(cursor, 7)) mondays.push(cursor);
  return mondays;
}

/** Gregorian Easter Sunday (Meeus/Jones/Butcher). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Bavarian statutory holidays, as dates without lectures. */
export function holidayDates(year: number): string[] {
  const easter = easterSunday(year);
  return [
    iso(year, 0, 1),
    iso(year, 0, 6),
    format(addDays(easter, -2)), // Good Friday
    format(addDays(easter, 1)), // Easter Monday
    iso(year, 4, 1),
    format(addDays(easter, 39)), // Ascension
    format(addDays(easter, 50)), // Whit Monday
    format(addDays(easter, 60)), // Corpus Christi
    iso(year, 9, 3),
    iso(year, 10, 1),
    iso(year, 11, 25),
    iso(year, 11, 26),
  ];
}

function christmasAndNewYearClosures(semesterYear: number): string[] {
  // 24 December to 6 January, plus the last working day before each closure.
  const dates: string[] = [];
  for (let day = 24; day <= 31; day += 1) dates.push(iso(semesterYear, 11, day));
  for (let day = 1; day <= 6; day += 1) dates.push(iso(semesterYear + 1, 0, day));
  for (const date of [iso(semesterYear, 11, 23), iso(semesterYear, 11, 30)]) {
    const index = weekdayIndex(parse(date));
    if (index < 5) {
      dates.push(date);
    } else {
      dates.push(format(addDays(parse(date), -(index - 4))));
    }
  }
  return dates;
}

function easterBreak(year: number): string[] {
  const easter = easterSunday(year);
  return Array.from({ length: 6 }, (_, offset) => format(addDays(easter, offset - 3)));
}

function pentecostTuesday(year: number): string {
  return format(addDays(easterSunday(year), 51));
}

const officialSchedules: SemesterSchedule[] = [
  {
    semesterId: '2026-summer',
    semesterStart: '2026-04-01',
    semesterEnd: '2026-09-30',
    lectureStart: '2026-04-13',
    lectureEnd: '2026-07-17',
    freeDays: ['2026-06-05', pentecostTuesday(2026)],
    source: 'ul-decision',
  },
  {
    semesterId: '2026-winter',
    semesterStart: '2026-10-01',
    semesterEnd: '2027-03-31',
    lectureStart: '2026-10-12',
    lectureEnd: '2027-02-05',
    freeDays: christmasAndNewYearClosures(2026),
    source: 'ul-decision',
  },
  {
    semesterId: '2027-summer',
    semesterStart: '2027-04-01',
    semesterEnd: '2027-09-30',
    lectureStart: '2027-04-12',
    lectureEnd: '2027-07-16',
    freeDays: ['2027-05-28', pentecostTuesday(2027)],
    source: 'ul-decision',
  },
  {
    semesterId: '2027-winter',
    semesterStart: '2027-10-01',
    semesterEnd: '2028-03-31',
    lectureStart: '2027-10-18',
    lectureEnd: '2028-02-11',
    freeDays: christmasAndNewYearClosures(2027),
    source: 'ul-decision',
  },
];

const scheduleById = new Map(officialSchedules.map((schedule) => [schedule.semesterId, schedule]));

function statuteSchedule(semesterId: string): SemesterSchedule {
  const [yearText, term] = semesterId.split('-');
  const year = Number(yearText);
  const isWinter = term !== 'summer';
  const month = isWinter ? 9 : 3;
  const mondays = fullWeekMondays(year, month);
  const lectureStart = mondays.at(-2) ?? new Date(year, month, 1);
  const weeks = isWinter ? 17 : 14;
  const lectureEnd = addDays(lectureStart, weeks * 7 - 3);
  const freeDays = isWinter
    ? christmasAndNewYearClosures(year)
    : [pentecostTuesday(year), ...easterBreak(year)];

  return {
    semesterId,
    semesterStart: isWinter ? iso(year, 9, 1) : iso(year, 3, 1),
    semesterEnd: isWinter ? iso(year + 1, 2, 31) : iso(year, 8, 30),
    lectureStart: format(lectureStart),
    lectureEnd: format(lectureEnd),
    freeDays,
    source: 'statute',
  };
}

export function getSemesterSchedule(semesterId: string): SemesterSchedule {
  return scheduleById.get(semesterId) ?? statuteSchedule(semesterId);
}

export function listOfficialSchedules(): SemesterSchedule[] {
  return officialSchedules.slice();
}

/** The semester that contains a date, else the next one that starts after it. */
export function semesterIdForDate(dateIso: string): string {
  const containing = officialSchedules
    .filter((schedule) => dateIso >= schedule.semesterStart && dateIso <= schedule.semesterEnd)
    .at(-1);
  if (containing) return containing.semesterId;

  const upcoming = officialSchedules
    .filter((schedule) => schedule.semesterStart > dateIso)
    .sort((left, right) => left.semesterStart.localeCompare(right.semesterStart))[0];
  if (upcoming) return upcoming.semesterId;

  const date = parse(dateIso);
  return `${date.getFullYear()}-${date.getMonth() >= 3 && date.getMonth() <= 8 ? 'summer' : 'winter'}`;
}

export function isHoliday(dateIso: string): boolean {
  const date = parse(dateIso);
  return holidayDates(date.getFullYear()).includes(dateIso);
}

/** True on weekdays inside the lecture period, excluding holidays and free days. */
export function isLectureDay(dateIso: string, schedule: SemesterSchedule): boolean {
  if (dateIso < schedule.lectureStart || dateIso > schedule.lectureEnd) return false;
  const date = parse(dateIso);
  if (weekdayIndex(date) > 4) return false;
  if (schedule.freeDays.includes(dateIso)) return false;
  return !isHoliday(dateIso);
}

/** 1-based week counted from the calendar week that contains the lecture start. */
export function lectureWeekNumber(dateIso: string, schedule: SemesterSchedule): number | null {
  const startWeek = mondayOfWeek(parse(schedule.lectureStart));
  const dateWeek = mondayOfWeek(parse(dateIso));
  const diff = Math.round((dateWeek.getTime() - startWeek.getTime()) / 86_400_000);
  if (diff < 0) return null;
  return Math.floor(diff / 7) + 1;
}
