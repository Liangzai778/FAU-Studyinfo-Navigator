import { z } from 'zod';
import { entrySemesterIdSchema, ruleVerificationStatusSchema } from './academic';

export const studyStatusSchema = z.enum(['planned', 'in_progress', 'passed', 'failed', 'recognized']);
export type StudyStatus = z.infer<typeof studyStatusSchema>;

export const localCourseSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().trim().min(1).max(120),
  ects: z.number().positive().max(300).nullable(),
  moduleId: z.string().min(1).nullable(),
  moduleVersionId: z.string().min(1).nullable(),
  isExtraCourse: z.boolean(),
  countsTowardDegree: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LocalCourse = z.infer<typeof localCourseSchema>;

export const courseAttemptSchema = z.object({
  id: z.string().min(1).max(160),
  courseId: z.string().min(1),
  semesterId: entrySemesterIdSchema,
  status: studyStatusSchema,
  recognitionConfirmed: z.boolean(),
  poVersionId: z.string().min(1).nullable(),
  requirementGroupId: z.string().min(1).nullable(),
  notes: z.string().max(500),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CourseAttempt = z.infer<typeof courseAttemptSchema>;

export const plannerSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    courses: z.array(localCourseSchema).max(2_000),
    attempts: z.array(courseAttemptSchema).max(10_000),
  })
  .superRefine((snapshot, context) => {
    const courseIds = new Set(snapshot.courses.map((course) => course.id));
    const ids = new Set<string>();
    [...snapshot.courses, ...snapshot.attempts].forEach((item) => {
      if (ids.has(item.id)) context.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate planner id: ${item.id}` });
      ids.add(item.id);
    });
    snapshot.attempts.forEach((attempt, index) => {
      if (!courseIds.has(attempt.courseId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Attempt references an unknown course: ${attempt.courseId}`,
          path: ['attempts', index, 'courseId'],
        });
      }
    });
  });
export type PlannerSnapshot = z.infer<typeof plannerSnapshotSchema>;

export const localCourseInputSchema = localCourseSchema.pick({
  title: true,
  ects: true,
  moduleId: true,
  moduleVersionId: true,
  isExtraCourse: true,
  countsTowardDegree: true,
});
export type LocalCourseInput = z.infer<typeof localCourseInputSchema>;

export const courseAttemptInputSchema = courseAttemptSchema.pick({
  courseId: true,
  semesterId: true,
  status: true,
  recognitionConfirmed: true,
  poVersionId: true,
  requirementGroupId: true,
  notes: true,
});
export type CourseAttemptInput = z.infer<typeof courseAttemptInputSchema>;

export const ectsRiskCodeSchema = z.enum([
  'no_selected_po',
  'no_verified_rules',
  'unverified_rule',
  'unknown_source',
  'missing_group_ects',
  'missing_course_ects',
  'unconfirmed_recognition',
  'po_mismatch',
  'unassigned_po',
  'unknown_requirement_group',
  'ineligible_module',
  'duplicate_course',
  'exclusive_double_count_prevented',
]);
export type EctsRiskCode = z.infer<typeof ectsRiskCodeSchema>;

export type EctsRisk = {
  code: EctsRiskCode;
  courseId?: string;
  groupId?: string;
};

export type RequirementGroupProgress = {
  groupId: string;
  earnedEcts: number;
  plannedEcts: number;
  requiredEcts: number | null;
  missingEcts: number | null;
  status: 'satisfied' | 'not_satisfied' | 'unknown';
  verificationStatus: z.infer<typeof ruleVerificationStatusSchema>;
};

export type EctsEngineResult = {
  completedEcts: number;
  earnedEcts: number;
  plannedEcts: number;
  unallocatedEarnedEcts: number;
  groups: RequirementGroupProgress[];
  graduationStatus: 'satisfied' | 'not_satisfied' | 'unknown';
  risks: EctsRisk[];
};
