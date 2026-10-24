import { calendarEventSchema, type CalendarEvent } from '../domain/calendar';
import { calendarEventsStoreName, openLocalDatabase } from './database';
import { migrateCalendarEvent, salvageRows } from './migrations';

export type CalendarReadResult = {
  events: CalendarEvent[];
  rejected: number;
};

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function dedupeById(items: readonly CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

/** Reads what it can; a malformed plan is counted, not allowed to hide the rest. */
export async function readCalendarEventsResult(): Promise<CalendarReadResult> {
  if (typeof indexedDB === 'undefined') return { events: [], rejected: 0 };
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(calendarEventsStoreName, 'readonly');
    const rows = await requestResult(transaction.objectStore(calendarEventsStoreName).getAll());
    const salvaged = salvageRows(rows as unknown[], calendarEventSchema, migrateCalendarEvent);
    const events = dedupeById(salvaged.items);
    return { events, rejected: salvaged.rejected + (salvaged.items.length - events.length) };
  } finally {
    database.close();
  }
}

export async function readCalendarEvents(): Promise<CalendarEvent[]> {
  return (await readCalendarEventsResult()).events;
}

export async function writeCalendarEvents(events: readonly CalendarEvent[]): Promise<void> {
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is unavailable.');
  const parsed = events.map((event) => calendarEventSchema.parse(event));
  const database = await openLocalDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(calendarEventsStoreName, 'readwrite');
      const store = transaction.objectStore(calendarEventsStoreName);
      store.clear();
      parsed.forEach((event) => store.put(event));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Calendar save failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Calendar save was aborted.'));
    });
  } finally {
    database.close();
  }
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Calendar save failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Calendar save was aborted.'));
  });
}

/** One row at a time, so a second tab cannot delete the first tab's plans. */
export async function putCalendarEvent(event: CalendarEvent): Promise<void> {
  const parsed = calendarEventSchema.parse(event);
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(calendarEventsStoreName, 'readwrite');
    transaction.objectStore(calendarEventsStoreName).put(parsed);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function deleteCalendarEventRow(id: string): Promise<void> {
  const database = await openLocalDatabase();
  try {
    const transaction = database.transaction(calendarEventsStoreName, 'readwrite');
    transaction.objectStore(calendarEventsStoreName).delete(id);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
