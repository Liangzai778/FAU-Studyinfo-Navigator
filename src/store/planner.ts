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
import { emptyPlannerSnapshot, readPlannerSnapshot, writePlannerSnapshot } from '../storage/plannerStorage';

type PlannerState = PlannerSnapshot & {
  hydrated: boolean;
  storageError: boolean;
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

function snapshotFromState(state: PlannerState, patch: Partial<PlannerSnapshot>): PlannerSnapshot {
  return {
    schemaVersion: 1,
    courses: patch.courses ?? state.courses,
    attempts: patch.attempts ?? state.attempts,
  };
}

async function persistPatch(
  state: PlannerState,
  patch: Partial<PlannerSnapshot>,
  set: (patch: Partial<PlannerState>) => void,
) {
  const snapshot = snapshotFromState(state, patch);
  try {
    await writePlannerSnapshot(snapshot);
    set({ ...patch, storageError: false });
    return true;
  } catch {
    set({ storageError: true });
    return false;
  }
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  ...emptyPlannerSnapshot,
  hydrated: false,
  storageError: false,
  hydrate: async (force = false) => {
    if (get().hydrated && !force) return;
    try {
      const snapshot = await readPlannerSnapshot();
      set({ ...snapshot, hydrated: true, storageError: false });
    } catch {
      set({ hydrated: true, storageError: true });
    }
  },
  addCourseWithAttempt: async (courseInput, attemptInput) => {
    const parsedCourse = localCourseInputSchema.safeParse(courseInput);
    if (!parsedCourse.success) return null;
    const courseId = createLocalId('course');
    const attemptId = createLocalId('attempt');
    const now = new Date().toISOString();
    const course: LocalCourse = { id: courseId, ...parsedCourse.data, createdAt: now, updatedAt: now };
    const parsedAttempt = courseAttemptInputSchema.safeParse({ ...attemptInput, courseId });
    if (!parsedAttempt.success) return null;
    const attempt: CourseAttempt = { id: attemptId, ...parsedAttempt.data, createdAt: now, updatedAt: now };
    const state = get();
    const saved = await persistPatch(state, {
      courses: [...state.courses, course],
      attempts: [...state.attempts, attempt],
    }, set);
    return saved ? courseId : null;
  },
  updateCourse: async (courseId, input) => {
    const parsed = localCourseInputSchema.safeParse(input);
    if (!parsed.success) return false;
    const state = get();
    const now = new Date().toISOString();
    return persistPatch(state, {
      courses: state.courses.map((course) => course.id === courseId ? { ...course, ...parsed.data, updatedAt: now } : course),
    }, set);
  },
  deleteCourse: async (courseId) => {
    const state = get();
    return persistPatch(state, {
      courses: state.courses.filter((course) => course.id !== courseId),
      attempts: state.attempts.filter((attempt) => attempt.courseId !== courseId),
    }, set);
  },
  addAttempt: async (input) => {
    const parsed = courseAttemptInputSchema.safeParse(input);
    if (!parsed.success || !get().courses.some((course) => course.id === parsed.data.courseId)) return null;
    const id = createLocalId('attempt');
    const now = new Date().toISOString();
    const attempt: CourseAttempt = { id, ...parsed.data, createdAt: now, updatedAt: now };
    const state = get();
    const saved = await persistPatch(state, { attempts: [...state.attempts, attempt] }, set);
    return saved ? id : null;
  },
  updateAttempt: async (attemptId, input) => {
    const parsed = courseAttemptInputSchema.safeParse(input);
    if (!parsed.success) return false;
    const state = get();
    const now = new Date().toISOString();
    return persistPatch(state, {
      attempts: state.attempts.map((attempt) => attempt.id === attemptId ? { ...attempt, ...parsed.data, updatedAt: now } : attempt),
    }, set);
  },
  deleteAttempt: async (attemptId) => {
    const state = get();
    return persistPatch(state, { attempts: state.attempts.filter((attempt) => attempt.id !== attemptId) }, set);
  },
}));
