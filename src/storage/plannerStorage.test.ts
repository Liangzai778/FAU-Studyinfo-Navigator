import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PlannerSnapshot } from '../domain/planner';
import { localDatabaseName } from './database';
import { readPlannerSnapshot, writePlannerSnapshot } from './plannerStorage';

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
    startMinutes: null,
    durationMinutes: null,
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

  it('reads a plan saved before weekdays became a list', async () => {
    // Row shape written by the first timetable build: one `day` string and no
    // `days` array. Losing a student's saved plan over a renamed field would be
    // unacceptable, so the old shape must still load.
    const legacyRow = {
      id: 'legacy-attempt',
      courseId: 'synthetic-test-only-course',
      semesterId: '2026-winter',
      status: 'planned',
      recognitionConfirmed: false,
      poVersionId: null,
      requirementGroupId: null,
      location: 'Alte Aula',
      day: 'thu',
      startMinutes: null,
      durationMinutes: null,
      notes: 'written by an older build',
      createdAt: '2026-10-22T00:00:00.000Z',
      updatedAt: '2026-10-22T00:00:00.000Z',
    };

    await writePlannerSnapshot(syntheticSnapshot);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(localDatabaseName);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(['planner-attempts'], 'readwrite');
        transaction.objectStore('planner-attempts').clear();
        transaction.objectStore('planner-attempts').put(legacyRow);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });

    const snapshot = await readPlannerSnapshot();
    expect(snapshot.attempts).toHaveLength(1);
    expect(snapshot.attempts[0]!.days).toEqual(['thu']);
    expect(snapshot.attempts[0]!.notes).toBe('written by an older build');
    expect('day' in snapshot.attempts[0]!).toBe(false);
  });

  it('does not replace valid data when a new snapshot is invalid', async () => {
    await writePlannerSnapshot(syntheticSnapshot);
    const invalid = { ...syntheticSnapshot, attempts: [{ ...syntheticSnapshot.attempts[0]!, courseId: 'missing-course' }] };
    await expect(writePlannerSnapshot(invalid)).rejects.toThrow();
    await expect(readPlannerSnapshot()).resolves.toEqual(syntheticSnapshot);
  });
});
