import { create } from 'zustand';
import {
  calendarEventInputSchema,
  type CalendarEvent,
  type CalendarEventInput,
} from '../domain/calendar';
import {
  deleteCalendarEventRow,
  putCalendarEvent,
  readCalendarEvents,
} from '../storage/calendarStorage';
import { broadcastSync, subscribeSync } from '../storage/crossTab';

type CalendarEventsState = {
  events: CalendarEvent[];
  hydrated: boolean;
  storageError: boolean;
  lastSavedAt: string | null;
  hydrate: (force?: boolean) => Promise<void>;
  addEvent: (input: CalendarEventInput) => Promise<string | null>;
  updateEvent: (id: string, input: CalendarEventInput) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
};

function createLocalId() {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `event-${suffix}`;
}

export const useCalendarEventsStore = create<CalendarEventsState>((set, get) => {
  const ensureHydrated = async () => {
    if (!get().hydrated) await get().hydrate();
  };

  const saved = () => {
    set({ storageError: false, lastSavedAt: new Date().toISOString() });
    broadcastSync('calendar');
  };

  return {
    events: [],
    hydrated: false,
    storageError: false,
    lastSavedAt: null,
    hydrate: async (force = false) => {
      if (get().hydrated && !force) return;
      try {
        const events = await readCalendarEvents();
        set({ events, hydrated: true, storageError: false });
      } catch {
        set({ hydrated: true, storageError: true });
      }
    },
    addEvent: async (input) => {
      const parsed = calendarEventInputSchema.safeParse(input);
      if (!parsed.success) return null;
      await ensureHydrated();
      const now = new Date().toISOString();
      const event: CalendarEvent = { id: createLocalId(), ...parsed.data, createdAt: now, updatedAt: now };
      try {
        await putCalendarEvent(event);
        set({ events: [...get().events, event] });
        saved();
        return event.id;
      } catch {
        set({ storageError: true });
        return null;
      }
    },
    updateEvent: async (id, input) => {
      const parsed = calendarEventInputSchema.safeParse(input);
      if (!parsed.success) return false;
      await ensureHydrated();
      const current = get().events.find((event) => event.id === id);
      if (!current) return false;
      const updated: CalendarEvent = { ...current, ...parsed.data, updatedAt: new Date().toISOString() };
      try {
        await putCalendarEvent(updated);
        set({ events: get().events.map((event) => (event.id === id ? updated : event)) });
        saved();
        return true;
      } catch {
        set({ storageError: true });
        return false;
      }
    },
    deleteEvent: async (id) => {
      await ensureHydrated();
      try {
        await deleteCalendarEventRow(id);
        set({ events: get().events.filter((event) => event.id !== id) });
        saved();
        return true;
      } catch {
        set({ storageError: true });
        return false;
      }
    },
  };
});

// A second tab added or removed a plan: re-read it.
subscribeSync((area) => {
  if (area === 'calendar') void useCalendarEventsStore.getState().hydrate(true);
});
