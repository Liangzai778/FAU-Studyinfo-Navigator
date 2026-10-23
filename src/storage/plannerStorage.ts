import { plannerSnapshotSchema, type PlannerSnapshot } from '../domain/planner';
import { openLocalDatabase, plannerAttemptsStoreName, plannerCoursesStoreName } from './database';

export const emptyPlannerSnapshot: PlannerSnapshot = {
  schemaVersion: 1,
  courses: [],
  attempts: [],
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

/**
 * Reshapes rows written by earlier builds into the current one.
 *
 * Two older shapes exist: a single `day` string (first timetable build) and a
 * `days` array sharing one start time (second build). Both are folded into a
 * meeting list here. Throwing away a student's saved plan because a field was
 * renamed would lose real work, so this migrates instead of rejecting.
 */
function migrateAttempt(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const attempt = { ...(raw as Record<string, unknown>) };

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

  // A time recorded by an older build is shared by every weekday it knew about.
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

  return { ...attempt, meetings, days: daysWithoutTime };
}

export async function readPlannerSnapshot(): Promise<PlannerSnapshot> {
  if (typeof indexedDB === 'undefined') return emptyPlannerSnapshot;
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction([plannerCoursesStoreName, plannerAttemptsStoreName], 'readonly');
    const [courses, attempts] = await Promise.all([
      requestResult(transaction.objectStore(plannerCoursesStoreName).getAll()),
      requestResult(transaction.objectStore(plannerAttemptsStoreName).getAll()),
    ]);
    const parsed = plannerSnapshotSchema.safeParse({
      schemaVersion: 1,
      courses,
      attempts: (attempts as unknown[]).map(migrateAttempt),
    });
    if (!parsed.success) throw new Error('Stored planner data failed schema validation.');
    return parsed.data;
  } finally {
    database.close();
  }
}

export async function writePlannerSnapshot(snapshot: PlannerSnapshot): Promise<void> {
  const parsed = plannerSnapshotSchema.parse(snapshot);
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is unavailable.');
  const database = await openLocalDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([plannerCoursesStoreName, plannerAttemptsStoreName], 'readwrite');
      const coursesStore = transaction.objectStore(plannerCoursesStoreName);
      const attemptsStore = transaction.objectStore(plannerAttemptsStoreName);
      coursesStore.clear();
      attemptsStore.clear();
      parsed.courses.forEach((course) => coursesStore.put(course));
      parsed.attempts.forEach((attempt) => attemptsStore.put(attempt));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save planner data.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Planner save was aborted.'));
    });
  } finally {
    database.close();
  }
}
