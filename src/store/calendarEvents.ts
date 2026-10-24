import { create } from 'zustand';
import {
  calendarEventInputSchema,
  type CalendarEvent,
  type CalendarEventInput,
} from '../domain/calendar';
import { readCalendarEvents, writeCalendarEvents } from '../storage/calendarStorage';

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
  /**
   * Waits for the stored list before mutating.
   *
   * Writing the in-memory list before hydration finishes would overwrite what
   * was on disk with an empty array — the exact "my plan disappeared" failure.
   * `hydrate` itself is idempotent, so calling it here is safe.
   */
  const ensureHydrated = async () => {
    if (!get().hydrated) await get().hydrate();
  };

  const persist = async (next: CalendarEvent[]) => {
    try {
      await writeCalendarEvents(next);
      set({ events: next, storageError: false, lastSavedAt: new Date().toISOString() });
      return true;
    } catch {
      set({ storageError: true });
      return false;
    }
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
      const saved = await persist([...get().events, event]);
      return saved ? event.id : null;
    },
    updateEvent: async (id, input) => {
      const parsed = calendarEventInputSchema.safeParse(input);
      if (!parsed.success) return false;
      await ensureHydrated();
      const now = new Date().toISOString();
      const next = get().events.map((event) =>
        event.id === id ? { ...event, ...parsed.data, updatedAt: now } : event,
      );
      if (!next.some((event) => event.id === id)) return false;
      return persist(next);
    },
    deleteEvent: async (id) => {
      await ensureHydrated();
      return persist(get().events.filter((event) => event.id !== id));
    },
  };
});
