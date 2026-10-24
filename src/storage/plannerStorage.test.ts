import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PlannerSnapshot } from '../domain/planner';
import { localDatabaseName } from './database';
import {
  deletePlannerCourse,
  putPlannerCourse,
  readPlannerSnapshot,
  writePlannerSnapshot,
} from './plannerStorage';

const syntheticSnapshot: PlannerSnapshot = {
  schemaVersion: 1,
  courses: [{
    id: 'synthetic-test-only-course',
    title: 'Synthetic test-only course',
    ects: 6,
    moduleId: null,
    moduleVersionId: null,
    isExtraCourse: false,
    countsTowardDegree: true,
    createdAt: '2026-10-22T00:00:00.000Z',
    updatedAt: '2026-10-22T00:00:00.000Z',
  }],
  attempts: [{
    id: 'synthetic-test-only-attempt',
    courseId: 'synthetic-test-only-course',
    semesterId: '2026-winter',
    status: 'planned',
    recognitionConfirmed: false,
    poVersionId: null,
    requirementGroupId: null,
    location: '',
    days: [],
    meetings: [],
    notes: '',
    createdAt: '2026-10-22T00:00:00.000Z',
    updatedAt: '2026-10-22T00:00:00.000Z',
  }],
};

describe('planner IndexedDB storage', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(localDatabaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Synthetic test database deletion was blocked.'));
    });
  });

  it('saves and restores courses with their attempt history', async () => {
    await writePlannerSnapshot(syntheticSnapshot);
    await expect(readPlannerSnapshot()).resolves.toEqual(syntheticSnapshot);
  });

  it('reads a plan saved before weekdays each got their own time', async () => {
    // Shapes written by earlier builds:
    //  1. one `day` string and no `days` array (the first timetable build),
    //  2. a `days` array with one shared start time (the second build).
    // Losing a student's saved plan over a renamed field would be unacceptable,
    // so both must load.
    const base = {
      courseId: 'synthetic-test-only-course',
      semesterId: '2026-winter',
      status: 'planned',
      recognitionConfirmed: false,
      poVersionId: null,
      requirementGroupId: null,
      location: 'Alte Aula',
      createdAt: '2026-10-22T00:00:00.000Z',
      updatedAt: '2026-10-22T00:00:00.000Z',
    };
    const legacyRows = [
      { ...base, id: 'legacy-day', day: 'thu', startMinutes: null, durationMinutes: null, notes: 'first build' },
      { ...base, id: 'legacy-days', days: ['mon', 'wed'], startMinutes: 480, durationMinutes: 90, notes: 'second build' },
    ];

    await writePlannerSnapshot(syntheticSnapshot);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(localDatabaseName);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(['planner-attempts'], 'readwrite');
        transaction.objectStore('planner-attempts').clear();
        legacyRows.forEach((row) => transaction.objectStore('planner-attempts').put(row));
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });

    const snapshot = await readPlannerSnapshot();
    expect(snapshot.attempts).toHaveLength(2);

    const byNote = new Map(snapshot.attempts.map((item) => [item.notes, item]));
    const first = byNote.get('first build')!;
    expect(first.days).toEqual(['thu']);
    expect(first.meetings).toEqual([]);
    expect('day' in first).toBe(false);

    const second = byNote.get('second build')!;
    expect(second.meetings).toEqual([
      { day: 'mon', startMinutes: 480, durationMinutes: 90 },
      { day: 'wed', startMinutes: 480, durationMinutes: 90 },
    ]);
  });
  it('does not replace valid data when a new snapshot is invalid', async () => {
    await writePlannerSnapshot(syntheticSnapshot);
    const invalid = { ...syntheticSnapshot, attempts: [{ ...syntheticSnapshot.attempts[0]!, courseId: 'missing-course' }] };
    await expect(writePlannerSnapshot(invalid)).rejects.toThrow();
    await expect(readPlannerSnapshot()).resolves.toEqual(syntheticSnapshot);
  });

  it('keeps a course written by another tab instead of replacing the whole plan', async () => {
    await writePlannerSnapshot(syntheticSnapshot);
    const secondCourse = {
      ...syntheticSnapshot.courses[0]!,
      id: 'synthetic-test-only-course-2',
      title: 'Second tab course',
    };
    const secondAttempt = {
      ...syntheticSnapshot.attempts[0]!,
      id: 'synthetic-test-only-attempt-2',
      courseId: secondCourse.id,
    };

    await putPlannerCourse(secondCourse, secondAttempt);
    const snapshot = await readPlannerSnapshot();
    expect(snapshot.courses.map((course) => course.id).sort()).toEqual([
      'synthetic-test-only-course',
      'synthetic-test-only-course-2',
    ]);
    expect(snapshot.attempts).toHaveLength(2);
  });

  it('deletes one course and only that course attempts', async () => {
    await writePlannerSnapshot(syntheticSnapshot);
    const secondCourse = {
      ...syntheticSnapshot.courses[0]!,
      id: 'synthetic-test-only-course-2',
      title: 'Second tab course',
    };
    const secondAttempt = {
      ...syntheticSnapshot.attempts[0]!,
      id: 'synthetic-test-only-attempt-2',
      courseId: secondCourse.id,
    };
    await putPlannerCourse(secondCourse, secondAttempt);

    await deletePlannerCourse('synthetic-test-only-course');
    const snapshot = await readPlannerSnapshot();
    expect(snapshot.courses.map((course) => course.id)).toEqual(['synthetic-test-only-course-2']);
    expect(snapshot.attempts.map((attempt) => attempt.courseId)).toEqual(['synthetic-test-only-course-2']);
  });
});
