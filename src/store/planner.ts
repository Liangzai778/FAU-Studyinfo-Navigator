import { create } from 'zustand';
import {
  courseAttemptInputSchema,
  localCourseInputSchema,
  type CourseAttempt,
  type CourseAttemptInput,
  type LocalCourse,
  type LocalCourseInput,
  type PlannerSnapshot,
} from '../domain/planner';
import {
  deletePlannerAttemptRow,
  deletePlannerCourse,
  emptyPlannerSnapshot,
  putPlannerAttempt,
  putPlannerCourse,
  readPlannerSnapshotResult,
} from '../storage/plannerStorage';
import { broadcastSync, subscribeSync } from '../storage/crossTab';

type PlannerState = PlannerSnapshot & {
  hydrated: boolean;
  storageError: boolean;
  lastSavedAt: string | null;
  /** Rows that could not be read but are still stored in the browser. */
  unreadableRows: number;
  hydrate: (force?: boolean) => Promise<void>;
  addCourseWithAttempt: (course: LocalCourseInput, attempt: Omit<CourseAttemptInput, 'courseId'>) => Promise<string | null>;
  updateCourse: (courseId: string, input: LocalCourseInput) => Promise<boolean>;
  deleteCourse: (courseId: string) => Promise<boolean>;
  addAttempt: (input: CourseAttemptInput) => Promise<string | null>;
  updateAttempt: (attemptId: string, input: CourseAttemptInput) => Promise<boolean>;
  deleteAttempt: (attemptId: string) => Promise<boolean>;
};

function createLocalId(prefix: string) {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

async function ensureHydrated(get: () => PlannerState, hydrate: (force?: boolean) => Promise<void>) {
  if (!get().hydrated) await hydrate();
}

export const usePlannerStore = create<PlannerState>((set, get) => {
  const saved = () => {
    set({ storageError: false, lastSavedAt: new Date().toISOString() });
    broadcastSync('planner');
  };
  const failed = () => set({ storageError: true });

  return {
    ...emptyPlannerSnapshot,
    hydrated: false,
    storageError: false,
    lastSavedAt: null,
    unreadableRows: 0,
    hydrate: async (force = false) => {
      if (get().hydrated && !force) return;
      try {
        const result = await readPlannerSnapshotResult();
        set({ ...result.snapshot, hydrated: true, storageError: false, unreadableRows: result.rejected });
      } catch {
        set({ hydrated: true, storageError: true });
      }
    },
    addCourseWithAttempt: async (courseInput, attemptInput) => {
      await ensureHydrated(get, get().hydrate);
      const parsedCourse = localCourseInputSchema.safeParse(courseInput);
      if (!parsedCourse.success) return null;
      const courseId = createLocalId('course');
      const attemptId = createLocalId('attempt');
      const now = new Date().toISOString();
      const course: LocalCourse = { id: courseId, ...parsedCourse.data, createdAt: now, updatedAt: now };
      const parsedAttempt = courseAttemptInputSchema.safeParse({ ...attemptInput, courseId });
      if (!parsedAttempt.success) return null;
      const attempt: CourseAttempt = { id: attemptId, ...parsedAttempt.data, createdAt: now, updatedAt: now };
      try {
        await putPlannerCourse(course, attempt);
        set({ courses: [...get().courses, course], attempts: [...get().attempts, attempt] });
        saved();
        return courseId;
      } catch {
        failed();
        return null;
      }
    },
    updateCourse: async (courseId, input) => {
      await ensureHydrated(get, get().hydrate);
      const parsed = localCourseInputSchema.safeParse(input);
      if (!parsed.success) return false;
      const current = get().courses.find((course) => course.id === courseId);
      if (!current) return false;
      const updated: LocalCourse = { ...current, ...parsed.data, updatedAt: new Date().toISOString() };
      try {
        await putPlannerCourse(updated);
        set({ courses: get().courses.map((course) => (course.id === courseId ? updated : course)) });
        saved();
        return true;
      } catch {
        failed();
        return false;
      }
    },
    deleteCourse: async (courseId) => {
      await ensureHydrated(get, get().hydrate);
      try {
        await deletePlannerCourse(courseId);
        set({
          courses: get().courses.filter((course) => course.id !== courseId),
          attempts: get().attempts.filter((attempt) => attempt.courseId !== courseId),
        });
        saved();
        return true;
      } catch {
        failed();
        return false;
      }
    },
    addAttempt: async (input) => {
      await ensureHydrated(get, get().hydrate);
      const parsed = courseAttemptInputSchema.safeParse(input);
      if (!parsed.success || !get().courses.some((course) => course.id === parsed.data.courseId)) return null;
      const id = createLocalId('attempt');
      const now = new Date().toISOString();
      const attempt: CourseAttempt = { id, ...parsed.data, createdAt: now, updatedAt: now };
      try {
        await putPlannerAttempt(attempt);
        set({ attempts: [...get().attempts, attempt] });
        saved();
        return id;
      } catch {
        failed();
        return null;
      }
    },
    updateAttempt: async (attemptId, input) => {
      await ensureHydrated(get, get().hydrate);
      const parsed = courseAttemptInputSchema.safeParse(input);
      if (!parsed.success) return false;
      const current = get().attempts.find((attempt) => attempt.id === attemptId);
      if (!current) return false;
      const updated: CourseAttempt = { ...current, ...parsed.data, updatedAt: new Date().toISOString() };
      try {
        await putPlannerAttempt(updated);
        set({ attempts: get().attempts.map((attempt) => (attempt.id === attemptId ? updated : attempt)) });
        saved();
        return true;
      } catch {
        failed();
        return false;
      }
    },
    deleteAttempt: async (attemptId) => {
      await ensureHydrated(get, get().hydrate);
      try {
        await deletePlannerAttemptRow(attemptId);
        set({ attempts: get().attempts.filter((attempt) => attempt.id !== attemptId) });
        saved();
        return true;
      } catch {
        failed();
        return false;
      }
    },
  };
});

// Another tab changed the plan: re-read instead of showing a stale list.
subscribeSync((area) => {
  if (area === 'planner') void usePlannerStore.getState().hydrate(true);
});
