export const localDatabaseName = 'fau-study-navigator';
export const localDatabaseVersion = 3;
export const academicProfileStoreName = 'academic-profile';
export const plannerCoursesStoreName = 'planner-courses';
export const plannerAttemptsStoreName = 'planner-attempts';
export const personalExamsStoreName = 'personal-exams';
export const studyTasksStoreName = 'study-tasks';

export function openLocalDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(localDatabaseName, localDatabaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(academicProfileStoreName)) {
        database.createObjectStore(academicProfileStoreName);
      }
      if (!database.objectStoreNames.contains(plannerCoursesStoreName)) {
        database.createObjectStore(plannerCoursesStoreName, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(plannerAttemptsStoreName)) {
        database.createObjectStore(plannerAttemptsStoreName, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(personalExamsStoreName)) {
        database.createObjectStore(personalExamsStoreName, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(studyTasksStoreName)) {
        database.createObjectStore(studyTasksStoreName, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open local database.'));
    request.onblocked = () => reject(new Error('Local database upgrade is blocked by another tab.'));
  });
}
