import { z } from 'zod';
import {
  academicSelectionSchema,
  degreeTypeSchema,
  entrySemesterIdSchema,
  facultyIdSchema,
} from '../domain/academic';
import { academicProfileStoreName, localDatabaseName, openLocalDatabase } from './database';

const PROFILE_KEY = 'current';

export const storedAcademicProfileSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('general'),
    degreeType: degreeTypeSchema,
    facultyId: facultyIdSchema,
    entrySemesterId: entrySemesterIdSchema,
    savedAt: z.string().datetime(),
  }),
  z.object({
    mode: z.literal('scoped'),
    selection: academicSelectionSchema,
    savedAt: z.string().datetime(),
  }),
]);
export type StoredAcademicProfile = z.infer<typeof storedAcademicProfileSchema>;

export async function readAcademicProfile(): Promise<StoredAcademicProfile | null> {
  if (typeof indexedDB === 'undefined') return null;
  const database = await openLocalDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(academicProfileStoreName, 'readonly');
      const request = transaction.objectStore(academicProfileStoreName).get(PROFILE_KEY);
      request.onsuccess = () => {
        const parsed = storedAcademicProfileSchema.safeParse(request.result);
        resolve(parsed.success ? parsed.data : null);
      };
      request.onerror = () => reject(request.error ?? new Error('Unable to read local academic profile.'));
    });
  } finally {
    database.close();
  }
}

export async function writeAcademicProfile(profile: StoredAcademicProfile): Promise<void> {
  const parsed = storedAcademicProfileSchema.parse(profile);
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is unavailable.');
  const database = await openLocalDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(academicProfileStoreName, 'readwrite');
      transaction.objectStore(academicProfileStoreName).put(parsed, PROFILE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save local academic profile.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Academic-profile save was aborted.'));
    });
  } finally {
    database.close();
  }
}

export async function deleteAcademicProfile(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const database = await openLocalDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(academicProfileStoreName, 'readwrite');
      transaction.objectStore(academicProfileStoreName).delete(PROFILE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to delete local academic profile.'));
    });
  } finally {
    database.close();
  }
}

export const academicProfileDatabaseName = localDatabaseName;
