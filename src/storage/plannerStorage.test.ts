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
    day: null,
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

  it('does not replace valid data when a new snapshot is invalid', async () => {
    await writePlannerSnapshot(syntheticSnapshot);
    const invalid = { ...syntheticSnapshot, attempts: [{ ...syntheticSnapshot.attempts[0]!, courseId: 'missing-course' }] };
    await expect(writePlannerSnapshot(invalid)).rejects.toThrow();
    await expect(readPlannerSnapshot()).resolves.toEqual(syntheticSnapshot);
  });
});
