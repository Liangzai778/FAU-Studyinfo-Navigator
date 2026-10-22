import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ExamsTasksSnapshot } from '../domain/exams';
import { localDatabaseName } from './database';
import { readExamsTasksSnapshot, writeExamsTasksSnapshot } from './examsTasksStorage';

const syntheticSnapshot: ExamsTasksSnapshot = {
  schemaVersion: 1,
  exams: [{
    id: 'synthetic-test-only-exam', title: 'Synthetic test-only exam', courseId: null,
    startsAt: '2026-11-12T09:30', endsAt: '2026-11-12T11:00', timezone: 'Europe/Berlin',
    location: 'Synthetic room', notes: '', registrationStatus: 'user_marked_registered',
    origin: 'personal', dateStatus: 'user_entered', createdAt: '2026-10-22T00:00:00.000Z', updatedAt: '2026-10-22T00:00:00.000Z',
  }],
  tasks: [{
    id: 'synthetic-test-only-task', title: 'Synthetic test-only task', courseId: null,
    deadline: '2026-11-10T18:00', timezone: 'Europe/Berlin', notes: '', completed: false,
    origin: 'personal', createdAt: '2026-10-22T00:00:00.000Z', updatedAt: '2026-10-22T00:00:00.000Z',
  }],
};

async function resetDatabase() {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(localDatabaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Synthetic test database deletion was blocked.'));
  });
}

describe('exam and task IndexedDB storage', () => {
  beforeEach(resetDatabase);

  it('saves and restores personal exams and study tasks together', async () => {
    await writeExamsTasksSnapshot(syntheticSnapshot);
    await expect(readExamsTasksSnapshot()).resolves.toEqual(syntheticSnapshot);
  });

  it('rejects invalid Berlin dates before changing stored data', async () => {
    await writeExamsTasksSnapshot(syntheticSnapshot);
    const invalid = { ...syntheticSnapshot, exams: [{ ...syntheticSnapshot.exams[0]!, startsAt: '2026-03-29T02:30' }] };
    await expect(writeExamsTasksSnapshot(invalid)).rejects.toThrow();
    await expect(readExamsTasksSnapshot()).resolves.toEqual(syntheticSnapshot);
  });
});
