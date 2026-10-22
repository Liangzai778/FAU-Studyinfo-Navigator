import { examsTasksSnapshotSchema, type ExamsTasksSnapshot } from '../domain/exams';
import { openLocalDatabase, personalExamsStoreName, studyTasksStoreName } from './database';

export const emptyExamsTasksSnapshot: ExamsTasksSnapshot = {
  schemaVersion: 1,
  exams: [],
  tasks: [],
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

export async function readExamsTasksSnapshot(): Promise<ExamsTasksSnapshot> {
  if (typeof indexedDB === 'undefined') return emptyExamsTasksSnapshot;
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction([personalExamsStoreName, studyTasksStoreName], 'readonly');
    const [exams, tasks] = await Promise.all([
      requestResult(transaction.objectStore(personalExamsStoreName).getAll()),
      requestResult(transaction.objectStore(studyTasksStoreName).getAll()),
    ]);
    const parsed = examsTasksSnapshotSchema.safeParse({ schemaVersion: 1, exams, tasks });
    if (!parsed.success) throw new Error('Stored exam/task data failed schema validation.');
    return parsed.data;
  } finally {
    database.close();
  }
}

export async function writeExamsTasksSnapshot(snapshot: ExamsTasksSnapshot): Promise<void> {
  const parsed = examsTasksSnapshotSchema.parse(snapshot);
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is unavailable.');
  const database = await openLocalDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([personalExamsStoreName, studyTasksStoreName], 'readwrite');
      const examStore = transaction.objectStore(personalExamsStoreName);
      const taskStore = transaction.objectStore(studyTasksStoreName);
      examStore.clear();
      taskStore.clear();
      parsed.exams.forEach((exam) => examStore.put(exam));
      parsed.tasks.forEach((task) => taskStore.put(task));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save exam/task data.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Exam/task save was aborted.'));
    });
  } finally {
    database.close();
  }
}
