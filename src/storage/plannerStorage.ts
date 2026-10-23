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
 * Folds the weekday column introduced in the first timetable build into the
 * day list used now. Rows written before the list existed are read, not
 * rejected: throwing away a student's saved plan because one field was
 * renamed would lose real work.
 */
function migrateAttempt(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const attempt = raw as Record<string, unknown>;
  if (attempt.days !== undefined) return attempt;

  const legacyDay = attempt.day;
  const days: string[] = [];
  if (Array.isArray(legacyDay)) {
    days.push(...legacyDay.filter((value): value is string => typeof value === 'string'));
  } else if (typeof legacyDay === 'string') {
    days.push(legacyDay);
  }

  // The legacy column is dropped here; the day list replaces it.
  const rest: Record<string, unknown> = { ...attempt };
  delete rest.day;
  return { ...rest, days };
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
