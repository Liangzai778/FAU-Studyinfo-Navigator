import {
  courseAttemptSchema,
  localCourseSchema,
  plannerSnapshotSchema,
  type CourseAttempt,
  type LocalCourse,
  type PlannerSnapshot,
} from '../domain/planner';
import { openLocalDatabase, plannerAttemptsStoreName, plannerCoursesStoreName } from './database';
import { migratePlannerAttempt, migratePlannerCourse, salvageRows } from './migrations';

export const emptyPlannerSnapshot: PlannerSnapshot = {
  schemaVersion: 1,
  courses: [],
  attempts: [],
};

export type PlannerReadResult = {
  snapshot: PlannerSnapshot;
  /** Rows that could not be read but are still stored in IndexedDB. */
  rejected: number;
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

/**
 * Reads whatever is readable and reports the rest.
 *
 * A single malformed row used to throw and turn the whole plan into a storage
 * error. Now every row is migrated and parsed on its own, so one bad course
 * cannot hide the other thirty.
 */
export async function readPlannerSnapshotResult(): Promise<PlannerReadResult> {
  if (typeof indexedDB === 'undefined') return { snapshot: emptyPlannerSnapshot, rejected: 0 };
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction([plannerCoursesStoreName, plannerAttemptsStoreName], 'readonly');
    const [rawCourses, rawAttempts] = await Promise.all([
      requestResult(transaction.objectStore(plannerCoursesStoreName).getAll()),
      requestResult(transaction.objectStore(plannerAttemptsStoreName).getAll()),
    ]);

    const courses = salvageRows(rawCourses as unknown[], localCourseSchema, migratePlannerCourse);
    const attempts = salvageRows(rawAttempts as unknown[], courseAttemptSchema, migratePlannerAttempt);

    const uniqueCourses = dedupeById(courses.items);
    const duplicateCourses = courses.items.length - uniqueCourses.length;
    const courseIds = new Set(uniqueCourses.map((course) => course.id));
    const uniqueAttempts = dedupeById(attempts.items);
    const duplicateAttempts = attempts.items.length - uniqueAttempts.length;
    const validAttempts = uniqueAttempts.filter((attempt) => courseIds.has(attempt.courseId));

    const rejected =
      courses.rejected +
      attempts.rejected +
      duplicateCourses +
      duplicateAttempts +
      (uniqueAttempts.length - validAttempts.length);

    const snapshot = plannerSnapshotSchema.parse({
      schemaVersion: 1,
      courses: uniqueCourses,
      attempts: validAttempts,
    });
    return { snapshot, rejected };
  } finally {
    database.close();
  }
}

export async function readPlannerSnapshot(): Promise<PlannerSnapshot> {
  return (await readPlannerSnapshotResult()).snapshot;
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

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Planner save failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Planner save was aborted.'));
  });
}

/**
 * Writes one course (optionally with its first attempt) instead of the whole
 * snapshot. Two tabs adding different courses therefore both keep their row;
 * before this, the second tab's full rewrite deleted the first tab's course.
 */
export async function putPlannerCourse(course: LocalCourse, attempt?: CourseAttempt): Promise<void> {
  const parsedCourse = localCourseSchema.parse(course);
  const parsedAttempt = attempt ? courseAttemptSchema.parse(attempt) : null;
  const database = await openLocalDatabase();
  try {
    const stores = parsedAttempt
      ? [plannerCoursesStoreName, plannerAttemptsStoreName]
      : [plannerCoursesStoreName];
    const transaction = database.transaction(stores, 'readwrite');
    transaction.objectStore(plannerCoursesStoreName).put(parsedCourse);
    if (parsedAttempt) transaction.objectStore(plannerAttemptsStoreName).put(parsedAttempt);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function deletePlannerCourse(courseId: string): Promise<void> {
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction([plannerCoursesStoreName, plannerAttemptsStoreName], 'readwrite');
    transaction.objectStore(plannerCoursesStoreName).delete(courseId);
    const attemptsStore = transaction.objectStore(plannerAttemptsStoreName);
    const request = attemptsStore.getAll();
    request.onsuccess = () => {
      for (const attempt of request.result as CourseAttempt[]) {
        if (attempt.courseId === courseId) attemptsStore.delete(attempt.id);
      }
    };
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function putPlannerAttempt(attempt: CourseAttempt): Promise<void> {
  const parsed = courseAttemptSchema.parse(attempt);
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(plannerAttemptsStoreName, 'readwrite');
    transaction.objectStore(plannerAttemptsStoreName).put(parsed);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function deletePlannerAttemptRow(attemptId: string): Promise<void> {
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(plannerAttemptsStoreName, 'readwrite');
    transaction.objectStore(plannerAttemptsStoreName).delete(attemptId);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
