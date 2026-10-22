export const BERLIN_TIMEZONE = 'Europe/Berlin' as const;

export type BerlinLocalDateTimeResolution = {
  valid: boolean;
  ambiguous: boolean;
  matchingInstants: string[];
};

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function parseLocalDateTime(value: string): DateTimeParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const parts = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
  };
  if (parts.year < 1900 || parts.year > 2200 || parts.month < 1 || parts.month > 12 || parts.hour > 23 || parts.minute > 59) return null;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (date.getUTCFullYear() !== parts.year || date.getUTCMonth() !== parts.month - 1 || date.getUTCDate() !== parts.day) return null;
  return parts;
}

function partsAtInstant(timestamp: number): DateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BERLIN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const values = Object.fromEntries(
    formatter.formatToParts(new Date(timestamp)).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function sameParts(left: DateTimeParts, right: DateTimeParts) {
  return left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour && left.minute === right.minute;
}

export function resolveBerlinLocalDateTime(value: string): BerlinLocalDateTimeResolution {
  const target = parseLocalDateTime(value);
  if (!target) return { valid: false, ambiguous: false, matchingInstants: [] };
  const naiveUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
  const matchingInstants: string[] = [];
  for (let offsetMinutes = -180; offsetMinutes <= 180; offsetMinutes += 15) {
    const candidate = naiveUtc + offsetMinutes * 60_000;
    if (sameParts(partsAtInstant(candidate), target)) matchingInstants.push(new Date(candidate).toISOString());
  }
  return {
    valid: matchingInstants.length > 0,
    ambiguous: matchingInstants.length > 1,
    matchingInstants,
  };
}

export function compareBerlinLocalDateTimes(left: string, right: string) {
  return left.localeCompare(right);
}

export function formatBerlinLocalDateTime(value: string, language: 'zh-CN' | 'en') {
  const parts = parseLocalDateTime(value);
  if (!parts) return value;
  const date = `${String(parts.day).padStart(2, '0')}.${String(parts.month).padStart(2, '0')}.${parts.year}`;
  const time = `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
  return language === 'zh-CN' ? `${date} ${time}（柏林时间）` : `${date}, ${time} (Berlin time)`;
}

export function toIcsLocalDateTime(value: string) {
  const parts = parseLocalDateTime(value);
  if (!parts) throw new Error('Invalid Berlin local date-time.');
  return `${parts.year}${String(parts.month).padStart(2, '0')}${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}${String(parts.minute).padStart(2, '0')}00`;
}
