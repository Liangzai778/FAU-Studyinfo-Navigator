import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { localDatabaseName } from '../storage/database';
import { emptyPlannerSnapshot, readPlannerSnapshot } from '../storage/plannerStorage';
import { usePlannerStore } from './planner';

async function deleteSyntheticDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(localDatabaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Synthetic test database deletion was blocked.'));
  });
}

describe('planner local CRUD', () => {
  beforeEach(async () => {
    await deleteSyntheticDatabase();
    usePlannerStore.setState({
      ...emptyPlannerSnapshot,
      courses: [],
      attempts: [],
      hydrated: true,
      storageError: false,
    });
  });

  it('adds, edits, reschedules, and removes a course with attempts', async () => {
    const courseId = await usePlannerStore.getState().addCourseWithAttempt(
      {
        title: 'Synthetic test-only course',
        ects: 6,
        moduleId: null,
        moduleVersionId: null,
        isExtraCourse: false,
        countsTowardDegree: true,
      },
      {
        semesterId: '2026-winter',
        status: 'planned',
        recognitionConfirmed: false,
        poVersionId: null,
        requirementGroupId: null,
        notes: '',
      },
    );
    expect(courseId).not.toBeNull();
    if (!courseId) return;

    await expect(usePlannerStore.getState().updateCourse(courseId, {
      title: 'Synthetic test-only course updated',
      ects: 7,
      moduleId: null,
      moduleVersionId: null,
      isExtraCourse: true,
      countsTowardDegree: false,
    })).resolves.toBe(true);

    const firstAttempt = usePlannerStore.getState().attempts[0]!;
    await expect(usePlannerStore.getState().updateAttempt(firstAttempt.id, {
      courseId,
      semesterId: '2027-summer',
      status: 'in_progress',
      recognitionConfirmed: false,
      poVersionId: null,
      requirementGroupId: null,
      notes: '',
    })).resolves.toBe(true);

    await expect(usePlannerStore.getState().addAttempt({
      courseId,
      semesterId: '2027-winter',
      status: 'planned',
      recognitionConfirmed: false,
      poVersionId: null,
      requirementGroupId: null,
      notes: 'Synthetic retake',
    })).resolves.not.toBeNull();
    expect(usePlannerStore.getState().attempts).toHaveLength(2);

    await expect(usePlannerStore.getState().deleteAttempt(firstAttempt.id)).resolves.toBe(true);
    expect(usePlannerStore.getState().attempts).toHaveLength(1);

    await expect(usePlannerStore.getState().deleteCourse(courseId)).resolves.toBe(true);
    expect(usePlannerStore.getState().courses).toEqual([]);
    expect(usePlannerStore.getState().attempts).toEqual([]);
    await expect(readPlannerSnapshot()).resolves.toEqual(emptyPlannerSnapshot);
  });
});
