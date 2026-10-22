import { z } from 'zod';
import { academicScopeSchema } from './academic';
import { BERLIN_TIMEZONE, resolveBerlinLocalDateTime } from './berlinDateTime';

export const berlinLocalDateTimeSchema = z.string().superRefine((value, context) => {
  const resolution = resolveBerlinLocalDateTime(value);
  if (!resolution.valid) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid or nonexistent Europe/Berlin local date-time.' });
});

export const examRegistrationStatusSchema = z.enum([
  'unknown',
  'not_registered',
  'user_marked_registered',
  'attended',
  'cancelled',
]);
export type ExamRegistrationStatus = z.infer<typeof examRegistrationStatusSchema>;

const personalExamObjectSchema = z.object({
    id: z.string().min(1).max(160),
    title: z.string().trim().min(1).max(120),
    courseId: z.string().min(1).nullable(),
    startsAt: berlinLocalDateTimeSchema,
    endsAt: berlinLocalDateTimeSchema.nullable(),
    timezone: z.literal(BERLIN_TIMEZONE),
    location: z.string().trim().max(200),
    notes: z.string().trim().max(1_000),
    registrationStatus: examRegistrationStatusSchema,
    origin: z.literal('personal'),
    dateStatus: z.literal('user_entered'),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

function validateExamRange(exam: { startsAt: string; endsAt: string | null }, context: z.RefinementCtx) {
  if (exam.endsAt !== null && exam.endsAt <= exam.startsAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Exam end must be after its start.', path: ['endsAt'] });
  }
}

export const personalExamSchema = personalExamObjectSchema.superRefine(validateExamRange);
export type PersonalExam = z.infer<typeof personalExamSchema>;

export const personalExamInputSchema = personalExamObjectSchema.pick({
  title: true,
  courseId: true,
  startsAt: true,
  endsAt: true,
  location: true,
  notes: true,
  registrationStatus: true,
}).superRefine(validateExamRange);
export type PersonalExamInput = z.infer<typeof personalExamInputSchema>;

export const studyTaskSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().trim().min(1).max(160),
  courseId: z.string().min(1).nullable(),
  deadline: berlinLocalDateTimeSchema,
  timezone: z.literal(BERLIN_TIMEZONE),
  notes: z.string().trim().max(1_000),
  completed: z.boolean(),
  origin: z.literal('personal'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type StudyTask = z.infer<typeof studyTaskSchema>;

export const studyTaskInputSchema = studyTaskSchema.pick({
  title: true,
  courseId: true,
  deadline: true,
  notes: true,
  completed: true,
});
export type StudyTaskInput = z.infer<typeof studyTaskInputSchema>;

export const officialAcademicDateSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.object({ 'zh-CN': z.string().min(1), en: z.string().min(1) }),
  startsAt: berlinLocalDateTimeSchema.nullable(),
  endsAt: berlinLocalDateTimeSchema.nullable(),
  timezone: z.literal(BERLIN_TIMEZONE),
  status: z.enum(['confirmed', 'tentative', 'unknown']),
  scope: academicScopeSchema,
  sourceIds: z.array(z.string().min(1)).min(1),
  lastVerifiedAt: z.string().date().nullable(),
});
export type OfficialAcademicDate = z.infer<typeof officialAcademicDateSchema>;

export const examsTasksSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    exams: z.array(personalExamSchema).max(2_000),
    tasks: z.array(studyTaskSchema).max(5_000),
  })
  .superRefine((snapshot, context) => {
    const ids = new Set<string>();
    [...snapshot.exams, ...snapshot.tasks].forEach((item) => {
      if (ids.has(item.id)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate exam/task id: ${item.id}` });
      ids.add(item.id);
    });
  });
export type ExamsTasksSnapshot = z.infer<typeof examsTasksSnapshotSchema>;
