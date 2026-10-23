import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ExamsTasksSnapshot } from '../domain/exams';
import type { PlannerSnapshot } from '../domain/planner';
import { createLocalBackup, parseLocalBackup, restoreLocalBackup, serializeLocalBackup } from './backup';
import { localDatabaseName } from './database';
import { readExamsTasksSnapshot, writeExamsTasksSnapshot } from './examsTasksStorage';
import { readPlannerSnapshot, writePlannerSnapshot } from './plannerStorage';

const timestamp = '2026-10-22T00:00:00.000Z';
const planner: PlannerSnapshot = {
  schemaVersion: 1,
  courses: [{ id: 'synthetic-course', title: 'Synthetic test course', ects: 5, moduleId: null, moduleVersionId: null, isExtraCourse: false, countsTowardDegree: true, createdAt: timestamp, updatedAt: timestamp }],
  attempts: [{ id: 'synthetic-attempt', courseId: 'synthetic-course', semesterId: '2026-winter', status: 'planned', recognitionConfirmed: false, poVersionId: null, requirementGroupId: null, location: '', day: null, notes: '', createdAt: timestamp, updatedAt: timestamp }],
};
const examsAndTasks: ExamsTasksSnapshot = {
  schemaVersion: 1,
  exams: [{ id: 'synthetic-exam', title: 'Synthetic test exam', courseId: 'synthetic-course', startsAt: '2026-11-12T09:30', endsAt: null, timezone: 'Europe/Berlin', location: '', notes: '', registrationStatus: 'unknown', origin: 'personal', dateStatus: 'user_entered', createdAt: timestamp, updatedAt: timestamp }],
  tasks: [],
};

async function resetDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(localDatabaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Synthetic test database deletion was blocked.'));
  });
}

describe('local JSON backup', () => {
  beforeEach(resetDatabase);

  it('exports, validates, and restores a versioned snapshot', async () => {
    await writePlannerSnapshot(planner);
    await writeExamsTasksSnapshot(examsAndTasks);
    const serialized = serializeLocalBackup(await createLocalBackup(new Date(timestamp)));
    const parsed = parseLocalBackup(serialized);
    await resetDatabase();
    await expect(restoreLocalBackup(parsed)).resolves.toMatchObject({ addedCourses: 1, addedAttempts: 1, addedExams: 1 });
    await expect(readPlannerSnapshot()).resolves.toEqual(planner);
    await expect(readExamsTasksSnapshot()).resolves.toEqual(examsAndTasks);
  });

  it('rejects incompatible versions and malformed records', async () => {
    const backup = await createLocalBackup(new Date(timestamp));
    expect(() => parseLocalBackup(JSON.stringify({ ...backup, schemaVersion: 2 }))).toThrow();
    const malformed = { ...backup, data: { ...backup.data, examsAndTasks: { ...examsAndTasks, exams: [{ ...examsAndTasks.exams[0]!, registrationStatus: 'officially_registered' }] } } };
    expect(() => parseLocalBackup(JSON.stringify(malformed))).toThrow();
  });

  it('refuses same-id conflicts without overwriting current records', async () => {
    await writePlannerSnapshot(planner);
    const imported = await createLocalBackup(new Date(timestamp));
    await writePlannerSnapshot({ ...planner, courses: [{ ...planner.courses[0]!, title: 'Current data must survive' }] });
    await expect(restoreLocalBackup(imported)).rejects.toThrow(/Conflicting course id/);
    expect((await readPlannerSnapshot()).courses[0]?.title).toBe('Current data must survive');
  });
});
