import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { localCourseSchema, courseAttemptSchema } from '../domain/planner';
import { calendarEventSchema } from '../domain/calendar';
import { personalExamSchema, studyTaskSchema } from '../domain/exams';
import { localDatabaseName } from './database';
import {
  migrateCalendarEvent,
  migrateExam,
  migratePlannerAttempt,
  migratePlannerCourse,
  migrateTask,
  salvageRows,
} from './migrations';

const oldCourse = {
  id: 'legacy-course',
  title: 'Legacy course',
  ects: 5,
  createdAt: '2025-10-01T00:00:00.000Z',
  updatedAt: '2025-10-01T00:00:00.000Z',
};

const oldAttempt = {
  id: 'legacy-attempt',
  courseId: 'legacy-course',
  semesterId: '2026-winter',
  status: 'planned',
  poVersionId: null,
  requirementGroupId: null,
  day: 'thu',
  startMinutes: 600,
  durationMinutes: 90,
  createdAt: '2025-10-01T00:00:00.000Z',
  updatedAt: '2025-10-01T00:00:00.000Z',
};

describe('storage migrations', () => {
  it('fills defaults a 2025 course is missing', () => {
    const parsed = localCourseSchema.parse(migratePlannerCourse(oldCourse));
    expect(parsed).toMatchObject({ moduleId: null, moduleVersionId: null, isExtraCourse: false, countsTowardDegree: true });
  });

  it('folds a legacy day and shared time into a meeting', () => {
    const parsed = courseAttemptSchema.parse(migratePlannerAttempt(oldAttempt));
    expect(parsed.meetings).toEqual([{ day: 'thu', startMinutes: 600, durationMinutes: 90 }]);
    expect(parsed.days).toEqual([]);
    expect(parsed.location).toBe('');
    expect(parsed.recognitionConfirmed).toBe(false);
  });

  it('keeps a weekday that had no time instead of dropping it', () => {
    const parsed = courseAttemptSchema.parse(migratePlannerAttempt({ ...oldAttempt, startMinutes: null }));
    expect(parsed.meetings).toEqual([]);
    expect(parsed.days).toEqual(['thu']);
  });

  it('defaults calendar, exam and task fields', () => {
    const event = calendarEventSchema.parse(
      migrateCalendarEvent({ id: 'e', title: 'Plan', date: '2026-10-05', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }),
    );
    expect(event.notes).toBe('');
    expect(event.startMinutes).toBeNull();

    const exam = personalExamSchema.parse(
      migrateExam({
        id: 'x',
        title: 'Exam',
        startsAt: '2026-10-05T09:00',
        timezone: 'Europe/Berlin',
        origin: 'personal',
        dateStatus: 'user_entered',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    expect(exam.notes).toBe('');
    expect(exam.registrationStatus).toBe('unknown');

    const task = studyTaskSchema.parse(
      migrateTask({
        id: 't',
        title: 'Task',
        deadline: '2026-10-05T09:00',
        timezone: 'Europe/Berlin',
        origin: 'personal',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    expect(task.completed).toBe(false);
    expect(task.notes).toBe('');
  });

  it('keeps valid rows and counts the invalid ones instead of throwing', () => {
    const result = salvageRows(
      [oldCourse, { id: 'broken', title: '' }],
      localCourseSchema,
      migratePlannerCourse,
    );
    expect(result.items).toHaveLength(1);
    expect(result.rejected).toBe(1);
  });
});

describe('planner reader with legacy rows', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(localDatabaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Synthetic test database deletion was blocked.'));
    });
  });

  it('reads a 2025 row after the schema gained fields', async () => {
    const { readPlannerSnapshotResult } = await import('./plannerStorage');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(localDatabaseName);
      request.onupgradeneeded = () => {
        const database = request.result;
        database.createObjectStore('planner-courses', { keyPath: 'id' });
        database.createObjectStore('planner-attempts', { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(['planner-courses', 'planner-attempts'], 'readwrite');
        transaction.objectStore('planner-courses').put(oldCourse);
        transaction.objectStore('planner-attempts').put(oldAttempt);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });

    const result = await readPlannerSnapshotResult();
    expect(result.rejected).toBe(0);
    expect(result.snapshot.courses[0]).toMatchObject({ id: 'legacy-course', moduleId: null });
    expect(result.snapshot.attempts[0]?.meetings).toEqual([{ day: 'thu', startMinutes: 600, durationMinutes: 90 }]);
  });

  it('does not delete a broken row and keeps the readable ones', async () => {
    const { readPlannerSnapshotResult } = await import('./plannerStorage');
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(localDatabaseName);
      request.onupgradeneeded = () => {
        const database = request.result;
        database.createObjectStore('planner-courses', { keyPath: 'id' });
        database.createObjectStore('planner-attempts', { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('planner-courses', 'readwrite');
        transaction.objectStore('planner-courses').put(oldCourse);
        transaction.objectStore('planner-courses').put({ id: 'broken', title: '' });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });

    const result = await readPlannerSnapshotResult();
    expect(result.snapshot.courses.map((course) => course.id)).toEqual(['legacy-course']);
    expect(result.rejected).toBe(1);

    const rawCount = await new Promise<number>((resolve, reject) => {
      const request = indexedDB.open(localDatabaseName);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('planner-courses', 'readonly');
        const count = transaction.objectStore('planner-courses').count();
        count.onsuccess = () => {
          database.close();
          resolve(count.result);
        };
        count.onerror = () => reject(count.error);
      };
      request.onerror = () => reject(request.error);
    });
    expect(rawCount).toBe(2);
  });
});
