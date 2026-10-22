import { create } from 'zustand';
import {
  personalExamInputSchema,
  studyTaskInputSchema,
  type ExamsTasksSnapshot,
  type PersonalExam,
  type PersonalExamInput,
  type StudyTask,
  type StudyTaskInput,
} from '../domain/exams';
import { BERLIN_TIMEZONE } from '../domain/berlinDateTime';
import { emptyExamsTasksSnapshot, readExamsTasksSnapshot, writeExamsTasksSnapshot } from '../storage/examsTasksStorage';

type ExamsTasksState = ExamsTasksSnapshot & {
  hydrated: boolean;
  storageError: boolean;
  hydrate: (force?: boolean) => Promise<void>;
  addExam: (input: PersonalExamInput) => Promise<string | null>;
  updateExam: (id: string, input: PersonalExamInput) => Promise<boolean>;
  deleteExam: (id: string) => Promise<boolean>;
  addTask: (input: StudyTaskInput) => Promise<string | null>;
  updateTask: (id: string, input: StudyTaskInput) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
};

function createLocalId(prefix: string) {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function snapshotFromState(state: ExamsTasksState, patch: Partial<ExamsTasksSnapshot>): ExamsTasksSnapshot {
  return {
    schemaVersion: 1,
    exams: patch.exams ?? state.exams,
    tasks: patch.tasks ?? state.tasks,
  };
}

async function persistPatch(
  state: ExamsTasksState,
  patch: Partial<ExamsTasksSnapshot>,
  set: (patch: Partial<ExamsTasksState>) => void,
) {
  try {
    await writeExamsTasksSnapshot(snapshotFromState(state, patch));
    set({ ...patch, storageError: false });
    return true;
  } catch {
    set({ storageError: true });
    return false;
  }
}

export const useExamsTasksStore = create<ExamsTasksState>((set, get) => ({
  ...emptyExamsTasksSnapshot,
  hydrated: false,
  storageError: false,
  hydrate: async (force = false) => {
    if (get().hydrated && !force) return;
    try {
      const snapshot = await readExamsTasksSnapshot();
      set({ ...snapshot, hydrated: true, storageError: false });
    } catch {
      set({ hydrated: true, storageError: true });
    }
  },
  addExam: async (input) => {
    const parsed = personalExamInputSchema.safeParse(input);
    if (!parsed.success) return null;
    const id = createLocalId('exam');
    const now = new Date().toISOString();
    const exam: PersonalExam = {
      id,
      ...parsed.data,
      timezone: BERLIN_TIMEZONE,
      origin: 'personal',
      dateStatus: 'user_entered',
      createdAt: now,
      updatedAt: now,
    };
    const state = get();
    const saved = await persistPatch(state, { exams: [...state.exams, exam] }, set);
    return saved ? id : null;
  },
  updateExam: async (id, input) => {
    const parsed = personalExamInputSchema.safeParse(input);
    if (!parsed.success) return false;
    const state = get();
    return persistPatch(state, {
      exams: state.exams.map((exam) => exam.id === id ? { ...exam, ...parsed.data, updatedAt: new Date().toISOString() } : exam),
    }, set);
  },
  deleteExam: async (id) => {
    const state = get();
    return persistPatch(state, { exams: state.exams.filter((exam) => exam.id !== id) }, set);
  },
  addTask: async (input) => {
    const parsed = studyTaskInputSchema.safeParse(input);
    if (!parsed.success) return null;
    const id = createLocalId('task');
    const now = new Date().toISOString();
    const task: StudyTask = {
      id,
      ...parsed.data,
      timezone: BERLIN_TIMEZONE,
      origin: 'personal',
      createdAt: now,
      updatedAt: now,
    };
    const state = get();
    const saved = await persistPatch(state, { tasks: [...state.tasks, task] }, set);
    return saved ? id : null;
  },
  updateTask: async (id, input) => {
    const parsed = studyTaskInputSchema.safeParse(input);
    if (!parsed.success) return false;
    const state = get();
    return persistPatch(state, {
      tasks: state.tasks.map((task) => task.id === id ? { ...task, ...parsed.data, updatedAt: new Date().toISOString() } : task),
    }, set);
  },
  deleteTask: async (id) => {
    const state = get();
    return persistPatch(state, { tasks: state.tasks.filter((task) => task.id !== id) }, set);
  },
}));
