import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ExamsTasksSnapshot } from '../domain/exams';
import type { PlannerSnapshot } from '../domain/planner';
import { clearIndexedDbPersonalData } from './clearLocalData';
import { localDatabaseName } from './database';
import { readExamsTasksSnapshot, writeExamsTasksSnapshot } from './examsTasksStorage';
import { readPlannerSnapshot, writePlannerSnapshot } from './plannerStorage';

const timestamp = '2026-10-22T00:00:00.000Z';
const planner: PlannerSnapshot = {
  schemaVersion: 1,
  courses: [{ id: 'synthetic-clear-course', title: 'Synthetic clear test', ects: 1, moduleId: null, moduleVersionId: null, isExtraCourse: true, countsTowardDegree: false, createdAt: timestamp, updatedAt: timestamp }],
  attempts: [{ id: 'synthetic-clear-attempt', courseId: 'synthetic-clear-course', semesterId: '2026-winter', status: 'planned', recognitionConfirmed: false, poVersionId: null, requirementGroupId: null, location: '', days: [], startMinutes: null, durationMinutes: null, notes: '', createdAt: timestamp, updatedAt: timestamp }],
};
const examsAndTasks: ExamsTasksSnapshot = {
  schemaVersion: 1,
  exams: [],
  tasks: [{ id: 'synthetic-clear-task', title: 'Synthetic clear test', courseId: null, deadline: '2026-11-10T10:00', timezone: 'Europe/Berlin', notes: '', completed: false, origin: 'personal', createdAt: timestamp, updatedAt: timestamp }],
};

describe('complete IndexedDB personal-data clear', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(localDatabaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Synthetic test database deletion was blocked.'));
    });
  });

  it('clears planner, exam, and task records in one transaction', async () => {
    await writePlannerSnapshot(planner);
    await writeExamsTasksSnapshot(examsAndTasks);
    await clearIndexedDbPersonalData();
    await expect(readPlannerSnapshot()).resolves.toEqual({ schemaVersion: 1, courses: [], attempts: [] });
    await expect(readExamsTasksSnapshot()).resolves.toEqual({ schemaVersion: 1, exams: [], tasks: [] });
  });
});
