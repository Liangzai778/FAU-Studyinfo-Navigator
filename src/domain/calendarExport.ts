import { BERLIN_TIMEZONE, toIcsLocalDateTime } from './berlinDateTime.ts';
import type { PersonalExam, StudyTask } from './exams';

export type CalendarExportInput = {
  exams: readonly PersonalExam[];
  tasks: readonly StudyTask[];
  generatedAt?: Date;
};

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function safeUidPart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function examEvent(exam: PersonalExam, stamp: string) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:exam-${safeUidPart(exam.id)}@fau-study-navigator.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${BERLIN_TIMEZONE}:${toIcsLocalDateTime(exam.startsAt)}`,
  ];
  if (exam.endsAt) lines.push(`DTEND;TZID=${BERLIN_TIMEZONE}:${toIcsLocalDateTime(exam.endsAt)}`);
  lines.push(`SUMMARY:${escapeIcs(exam.title)}`);
  if (exam.location) lines.push(`LOCATION:${escapeIcs(exam.location)}`);
  if (exam.notes) lines.push(`DESCRIPTION:${escapeIcs(exam.notes)}`);
  lines.push('CATEGORIES:PERSONAL EXAM', 'X-FAU-SN-ORIGIN:PERSONAL', 'END:VEVENT');
  return lines;
}

function taskEvent(task: StudyTask, stamp: string) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:task-${safeUidPart(task.id)}@fau-study-navigator.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${BERLIN_TIMEZONE}:${toIcsLocalDateTime(task.deadline)}`,
    `SUMMARY:${escapeIcs(task.title)}`,
  ];
  if (task.notes) lines.push(`DESCRIPTION:${escapeIcs(task.notes)}`);
  lines.push('CATEGORIES:PERSONAL STUDY TASK', 'X-FAU-SN-ORIGIN:PERSONAL', `X-FAU-SN-COMPLETED:${task.completed ? 'TRUE' : 'FALSE'}`, 'END:VEVENT');
  return lines;
}

export function createCalendarIcs(input: CalendarExportInput) {
  const stamp = utcStamp(input.generatedAt ?? new Date());
  const seenUids = new Set<string>();
  const events = [...input.exams.map((exam) => examEvent(exam, stamp)), ...input.tasks.map((task) => taskEvent(task, stamp))]
    .filter((lines) => {
      const uid = lines.find((line) => line.startsWith('UID:')) ?? '';
      if (seenUids.has(uid)) return false;
      seenUids.add(uid);
      return true;
    });
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FAU Study Navigator//Local Personal Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${BERLIN_TIMEZONE}`,
    'X-LIC-LOCATION:Europe/Berlin',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events.flat(),
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}
