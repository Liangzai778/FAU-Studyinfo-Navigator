import {
  academicProfileStoreName,
  calendarEventsStoreName,
  openLocalDatabase,
  personalExamsStoreName,
  plannerAttemptsStoreName,
  plannerCoursesStoreName,
  studyTasksStoreName,
} from './database';

const personalStoreNames = [
  academicProfileStoreName,
  plannerCoursesStoreName,
  plannerAttemptsStoreName,
  personalExamsStoreName,
  studyTasksStoreName,
  calendarEventsStoreName,
] as const;

export async function clearIndexedDbPersonalData(): Promise<void> {
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is unavailable.');
  const database = await openLocalDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([...personalStoreNames], 'readwrite');
      personalStoreNames.forEach((storeName) => transaction.objectStore(storeName).clear());
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to clear local personal data.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Local personal-data clear was aborted.'));
    });
  } finally {
    database.close();
  }
}
