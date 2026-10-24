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
import {
  deleteExamRow,
  deleteTaskRow,
  emptyExamsTasksSnapshot,
  putExam,
  putTask,
  readExamsTasksResult,
} from '../storage/examsTasksStorage';
import { broadcastSync, subscribeSync } from '../storage/crossTab';

type ExamsTasksState = ExamsTasksSnapshot & {
  hydrated: boolean;
  storageError: boolean;
  unreadableRows: number;
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

export const useExamsTasksStore = create<ExamsTasksState>((set, get) => {
  const ensureHydrated = async () => {
    if (!get().hydrated) await get().hydrate();
  };
  const saved = () => {
    set({ storageError: false });
    broadcastSync('exams');
  };
  const failed = () => set({ storageError: true });

  return {
    ...emptyExamsTasksSnapshot,
    hydrated: false,
    storageError: false,
    unreadableRows: 0,
    hydrate: async (force = false) => {
      if (get().hydrated && !force) return;
      try {
        const result = await readExamsTasksResult();
        set({ ...result.snapshot, hydrated: true, storageError: false, unreadableRows: result.rejected });
      } catch {
        set({ hydrated: true, storageError: true });
      }
    },
    addExam: async (input) => {
      await ensureHydrated();
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
      try {
        await putExam(exam);
        set({ exams: [...get().exams, exam] });
        saved();
        return id;
      } catch {
        failed();
        return null;
      }
    },
    updateExam: async (id, input) => {
      await ensureHydrated();
      const parsed = personalExamInputSchema.safeParse(input);
      if (!parsed.success) return false;
      const current = get().exams.find((exam) => exam.id === id);
      if (!current) return false;
      const updated: PersonalExam = { ...current, ...parsed.data, updatedAt: new Date().toISOString() };
      try {
        await putExam(updated);
        set({ exams: get().exams.map((exam) => (exam.id === id ? updated : exam)) });
        saved();
        return true;
      } catch {
        failed();
        return false;
      }
    },
    deleteExam: async (id) => {
      await ensureHydrated();
      try {
        await deleteExamRow(id);
        set({ exams: get().exams.filter((exam) => exam.id !== id) });
        saved();
        return true;
      } catch {
        failed();
        return false;
      }
    },
    addTask: async (input) => {
      await ensureHydrated();
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
      try {
        await putTask(task);
        set({ tasks: [...get().tasks, task] });
        saved();
        return id;
      } catch {
        failed();
        return null;
      }
    },
    updateTask: async (id, input) => {
      await ensureHydrated();
      const parsed = studyTaskInputSchema.safeParse(input);
      if (!parsed.success) return false;
      const current = get().tasks.find((task) => task.id === id);
      if (!current) return false;
      const updated: StudyTask = { ...current, ...parsed.data, updatedAt: new Date().toISOString() };
      try {
        await putTask(updated);
        set({ tasks: get().tasks.map((task) => (task.id === id ? updated : task)) });
        saved();
        return true;
      } catch {
        failed();
        return false;
      }
    },
    deleteTask: async (id) => {
      await ensureHydrated();
      try {
        await deleteTaskRow(id);
        set({ tasks: get().tasks.filter((task) => task.id !== id) });
        saved();
        return true;
      } catch {
        failed();
        return false;
      }
    },
  };
});

subscribeSync((area) => {
  if (area === 'exams') void useExamsTasksStore.getState().hydrate(true);
});
