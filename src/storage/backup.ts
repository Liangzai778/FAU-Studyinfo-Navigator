import { z } from 'zod';
import { examsTasksSnapshotSchema } from '../domain/exams';
import { plannerSnapshotSchema } from '../domain/planner';
import { storedAcademicProfileSchema, readAcademicProfile, type StoredAcademicProfile } from './academicProfileStorage';
import {
  academicProfileStoreName,
  openLocalDatabase,
  personalExamsStoreName,
  plannerAttemptsStoreName,
  plannerCoursesStoreName,
  studyTasksStoreName,
} from './database';
import { readExamsTasksSnapshot } from './examsTasksStorage';
import { readPlannerSnapshot } from './plannerStorage';

export const BACKUP_SCHEMA_VERSION = 1;
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

export const localBackupSchema = z.object({
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  application: z.literal('fau-study-navigator'),
  applicationVersion: z.string().min(1).max(40),
  exportedAt: z.string().datetime(),
  data: z.object({
    academicProfile: storedAcademicProfileSchema.nullable(),
    planner: plannerSnapshotSchema,
    examsAndTasks: examsTasksSnapshotSchema,
  }).strict(),
}).strict();
export type LocalBackup = z.infer<typeof localBackupSchema>;

export type RestoreSummary = {
  addedCourses: number;
  addedAttempts: number;
  addedExams: number;
  addedTasks: number;
  academicProfilePreserved: boolean;
};

function assertSafeJson(value: unknown, depth = 0) {
  if (depth > 16) throw new Error('Backup nesting is too deep.');
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item) => assertSafeJson(item, depth + 1));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') throw new Error('Backup contains a forbidden key.');
    assertSafeJson(child, depth + 1);
  }
}

export async function createLocalBackup(now = new Date()): Promise<LocalBackup> {
  const [academicProfile, planner, examsAndTasks] = await Promise.all([
    readAcademicProfile(),
    readPlannerSnapshot(),
    readExamsTasksSnapshot(),
  ]);
  return localBackupSchema.parse({
    schemaVersion: BACKUP_SCHEMA_VERSION,
    application: 'fau-study-navigator',
    applicationVersion: '0.1.0',
    exportedAt: now.toISOString(),
    data: { academicProfile, planner, examsAndTasks },
  });
}

export function serializeLocalBackup(backup: LocalBackup) {
  return `${JSON.stringify(localBackupSchema.parse(backup), null, 2)}\n`;
}

export function parseLocalBackup(text: string): LocalBackup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new Error('Backup file is too large.');
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Backup is not valid JSON.');
  }
  assertSafeJson(raw);
  return localBackupSchema.parse(raw);
}

function mergeById<T extends { id: string }>(current: readonly T[], imported: readonly T[], label: string) {
  const merged = new Map(current.map((item) => [item.id, item]));
  let added = 0;
  imported.forEach((item) => {
    const existing = merged.get(item.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(item)) throw new Error(`Conflicting ${label} id: ${item.id}`);
    if (!existing) {
      merged.set(item.id, item);
      added += 1;
    }
  });
  return { items: [...merged.values()], added };
}

function replaceStore<T>(store: IDBObjectStore, items: readonly T[]) {
  store.clear();
  items.forEach((item) => store.put(item));
}

export async function restoreLocalBackup(backup: LocalBackup): Promise<RestoreSummary> {
  const imported = localBackupSchema.parse(backup);
  const [currentAcademicProfile, currentPlanner, currentExamsAndTasks] = await Promise.all([
    readAcademicProfile(),
    readPlannerSnapshot(),
    readExamsTasksSnapshot(),
  ]);

  const courses = mergeById(currentPlanner.courses, imported.data.planner.courses, 'course');
  const attempts = mergeById(currentPlanner.attempts, imported.data.planner.attempts, 'attempt');
  const exams = mergeById(currentExamsAndTasks.exams, imported.data.examsAndTasks.exams, 'exam');
  const tasks = mergeById(currentExamsAndTasks.tasks, imported.data.examsAndTasks.tasks, 'task');
  const mergedPlanner = plannerSnapshotSchema.parse({ schemaVersion: 1, courses: courses.items, attempts: attempts.items });
  const mergedExamsAndTasks = examsTasksSnapshotSchema.parse({ schemaVersion: 1, exams: exams.items, tasks: tasks.items });
  const academicProfile: StoredAcademicProfile | null = currentAcademicProfile ?? imported.data.academicProfile;

  const database = await openLocalDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([
        academicProfileStoreName,
        plannerCoursesStoreName,
        plannerAttemptsStoreName,
        personalExamsStoreName,
        studyTasksStoreName,
      ], 'readwrite');
      const profileStore = transaction.objectStore(academicProfileStoreName);
      profileStore.delete('current');
      if (academicProfile) profileStore.put(academicProfile, 'current');
      replaceStore(transaction.objectStore(plannerCoursesStoreName), mergedPlanner.courses);
      replaceStore(transaction.objectStore(plannerAttemptsStoreName), mergedPlanner.attempts);
      replaceStore(transaction.objectStore(personalExamsStoreName), mergedExamsAndTasks.exams);
      replaceStore(transaction.objectStore(studyTasksStoreName), mergedExamsAndTasks.tasks);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Backup restore transaction failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Backup restore transaction was aborted.'));
    });
  } finally {
    database.close();
  }

  return {
    addedCourses: courses.added,
    addedAttempts: attempts.added,
    addedExams: exams.added,
    addedTasks: tasks.added,
    academicProfilePreserved: currentAcademicProfile !== null,
  };
}
