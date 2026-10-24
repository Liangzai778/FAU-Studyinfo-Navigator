import { z } from 'zod';

/**
 * Storage schema version for the browser database.
 *
 * Increment this whenever a stored shape changes, and add a migration below.
 * The rules for contributors:
 *
 *  1. A new field must get a default in the migration so older rows still load.
 *  2. Never clear or rewrite a store during an upgrade; migrate row by row.
 *  3. Add a test with the old shape. `npm test` must prove the old row survives.
 *  4. A row that still cannot be read is skipped, kept in IndexedDB and counted,
 *     never silently deleted.
 */
export const STORAGE_SCHEMA_VERSION = 2;

export type SalvageResult<T> = {
  items: T[];
  rejected: number;
};

const nowIso = () => new Date().toISOString();

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : null;
}

/** Parses each row on its own so one bad row cannot hide the rest. */
export function salvageRows<T>(
  rows: readonly unknown[],
  schema: z.ZodType<T>,
  migrate: (raw: unknown) => unknown,
): SalvageResult<T> {
  const items: T[] = [];
  let rejected = 0;
  for (const row of rows) {
    try {
      items.push(schema.parse(migrate(row)));
    } catch {
      rejected += 1;
    }
  }
  return { items, rejected };
}

export function migratePlannerCourse(raw: unknown): unknown {
  const course = asRecord(raw);
  if (!course) return raw;
  course.moduleId ??= null;
  course.moduleVersionId ??= null;
  course.isExtraCourse ??= false;
  course.countsTowardDegree ??= true;
  course.createdAt ??= nowIso();
  course.updatedAt ??= nowIso();
  return course;
}

/**
 * Folds every attempt shape written so far into the current one.
 *
 * Older builds stored a single `day` string, then a `days` array sharing one
 * start time. Both become `meetings`; anything typed is kept.
 */
export function migratePlannerAttempt(raw: unknown): unknown {
  const attempt = asRecord(raw);
  if (!attempt) return raw;

  const legacyDays: string[] = [];
  if (Array.isArray(attempt.days)) {
    legacyDays.push(...attempt.days.filter((value): value is string => typeof value === 'string'));
  }
  if (typeof attempt.day === 'string') legacyDays.push(attempt.day);
  delete attempt.day;

  const startMinutes = attempt.startMinutes;
  const durationMinutes = typeof attempt.durationMinutes === 'number' ? attempt.durationMinutes : null;
  delete attempt.startMinutes;
  delete attempt.durationMinutes;

  const sharedStart = typeof startMinutes === 'number' ? startMinutes : null;
  const meetings: unknown[] = Array.isArray(attempt.meetings) ? attempt.meetings : [];
  const alreadyScheduled = new Set(
    meetings.map((meeting) => (meeting && typeof meeting === 'object' ? (meeting as Record<string, unknown>).day : null)),
  );

  const daysWithoutTime: string[] = [];
  for (const day of legacyDays) {
    if (alreadyScheduled.has(day)) continue;
    alreadyScheduled.add(day);
    if (sharedStart === null) {
      daysWithoutTime.push(day);
    } else {
      meetings.push({ day, startMinutes: sharedStart, durationMinutes });
    }
  }

  attempt.meetings = meetings;
  attempt.days = daysWithoutTime;
  attempt.location ??= '';
  attempt.notes ??= '';
  attempt.recognitionConfirmed ??= false;
  attempt.createdAt ??= nowIso();
  attempt.updatedAt ??= nowIso();
  return attempt;
}

export function migrateCalendarEvent(raw: unknown): unknown {
  const event = asRecord(raw);
  if (!event) return raw;
  event.startMinutes ??= null;
  event.endMinutes ??= null;
  event.notes ??= '';
  event.createdAt ??= nowIso();
  event.updatedAt ??= nowIso();
  return event;
}

export function migrateExam(raw: unknown): unknown {
  const exam = asRecord(raw);
  if (!exam) return raw;
  exam.endsAt ??= null;
  exam.courseId ??= null;
  exam.location ??= '';
  exam.notes ??= '';
  exam.timezone ??= 'Europe/Berlin';
  exam.origin ??= 'personal';
  exam.dateStatus ??= 'user_entered';
  exam.registrationStatus ??= 'unknown';
  exam.createdAt ??= nowIso();
  exam.updatedAt ??= nowIso();
  return exam;
}

export function migrateTask(raw: unknown): unknown {
  const task = asRecord(raw);
  if (!task) return raw;
  task.courseId ??= null;
  task.notes ??= '';
  task.completed ??= false;
  task.timezone ??= 'Europe/Berlin';
  task.origin ??= 'personal';
  task.createdAt ??= nowIso();
  task.updatedAt ??= nowIso();
  return task;
}
