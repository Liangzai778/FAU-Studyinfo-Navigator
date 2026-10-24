import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CalendarEvent } from '../domain/calendar';
import { readCalendarEvents, writeCalendarEvents } from './calendarStorage';
import { localDatabaseName } from './database';

const event: CalendarEvent = {
  id: 'synthetic-test-only-event',
  title: 'Synthetic test-only plan',
  date: '2026-10-05',
  startMinutes: 600,
  endMinutes: 660,
  notes: '',
  createdAt: '2026-10-24T10:00:00.000Z',
  updatedAt: '2026-10-24T10:00:00.000Z',
};

describe('calendar IndexedDB storage', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(localDatabaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Synthetic test database deletion was blocked.'));
    });
  });

  it('returns an empty list before anything was saved', async () => {
    await expect(readCalendarEvents()).resolves.toEqual([]);
  });

  it('round-trips events through IndexedDB', async () => {
    await writeCalendarEvents([event]);
    await expect(readCalendarEvents()).resolves.toEqual([event]);
  });

  it('replaces the stored list on write instead of appending duplicates', async () => {
    await writeCalendarEvents([event]);
    await writeCalendarEvents([{ ...event, id: 'second', title: 'Second' }]);
    const stored = await readCalendarEvents();
    expect(stored.map((item) => item.id)).toEqual(['second']);
  });

  it('refuses to persist an invalid event', async () => {
    await expect(writeCalendarEvents([{ ...event, title: '' }])).rejects.toThrow();
  });
});
