import {
  examsTasksSnapshotSchema,
  personalExamSchema,
  studyTaskSchema,
  type ExamsTasksSnapshot,
  type PersonalExam,
  type StudyTask,
} from '../domain/exams';
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

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Exam/task save failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Exam/task save was aborted.'));
  });
}

/** Row-level writes, so two tabs do not erase each other's entries. */
export async function putExam(exam: PersonalExam): Promise<void> {
  const parsed = personalExamSchema.parse(exam);
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(personalExamsStoreName, 'readwrite');
    transaction.objectStore(personalExamsStoreName).put(parsed);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function deleteExamRow(id: string): Promise<void> {
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(personalExamsStoreName, 'readwrite');
    transaction.objectStore(personalExamsStoreName).delete(id);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function putTask(task: StudyTask): Promise<void> {
  const parsed = studyTaskSchema.parse(task);
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(studyTasksStoreName, 'readwrite');
    transaction.objectStore(studyTasksStoreName).put(parsed);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function deleteTaskRow(id: string): Promise<void> {
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(studyTasksStoreName, 'readwrite');
    transaction.objectStore(studyTasksStoreName).delete(id);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
