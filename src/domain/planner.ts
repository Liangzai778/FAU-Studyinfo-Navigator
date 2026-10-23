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

export const timetableDaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri']);
export type TimetableDay = z.infer<typeof timetableDaySchema>;

export const courseAttemptSchema = z.object({
  id: z.string().min(1).max(160),
  courseId: z.string().min(1),
  semesterId: entrySemesterIdSchema,
  status: studyStatusSchema,
  recognitionConfirmed: z.boolean(),
  poVersionId: z.string().min(1).nullable(),
  requirementGroupId: z.string().min(1).nullable(),
  // Room and weekday are personal timetable facts, recorded per attempt so a
  // course moved to another room next semester keeps both entries honest.
  location: z.string().max(160).default(''),
  day: timetableDaySchema.nullable().default(null),
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

export const courseAttemptInputSchema = courseAttemptSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
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

export type TimetableEntry = {
  attemptId: string;
  courseId: string;
  title: string;
  ects: number | null;
  semesterId: string;
  location: string;
  day: TimetableDay | null;
};

export type SemesterTimetable = {
  semesterId: string;
  entries: TimetableEntry[];
  /** Sum of ECTS of the courses listed, independent of pass/fail or PO. */
  totalEcts: number;
  missingLocations: number;
};

type AttemptLike = {
  id: string;
  courseId: string;
  semesterId: string;
  location: string;
  day: TimetableDay | null;
};

/**
 * Groups course attempts into a per-semester timetable.
 *
 * Locations live on the attempt, not on the course: a course that moves room
 * next semester must not make the old semester look like it moved too.
 */
export function buildTimetable(
  attempts: readonly AttemptLike[],
  courses: readonly LocalCourse[],
): SemesterTimetable[] {
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const bySemester = new Map<string, TimetableEntry[]>();

  attempts.forEach((attempt) => {
    const course = courseById.get(attempt.courseId);
    if (!course) return;
    const entries = bySemester.get(attempt.semesterId) ?? [];
    entries.push({
      attemptId: attempt.id,
      courseId: course.id,
      title: course.title,
      ects: course.ects,
      semesterId: attempt.semesterId,
      location: attempt.location,
      day: attempt.day,
    });
    bySemester.set(attempt.semesterId, entries);
  });

  return [...bySemester.entries()]
    .sort(([left], [right]) => semesterSortKey(left) - semesterSortKey(right))
    .map(([semesterId, entries]) => {
      const ordered = [...entries].sort(compareEntries);
      return {
        semesterId,
        entries: ordered,
        totalEcts: ordered.reduce((sum, entry) => sum + (entry.ects ?? 0), 0),
        missingLocations: ordered.filter((entry) => entry.location.trim() === '').length,
      };
    });
}

function semesterSortKey(semesterId: string) {
  const [yearText, term] = semesterId.split('-');
  return Number(yearText) * 2 + (term === 'winter' ? 1 : 0);
}

function compareEntries(left: TimetableEntry, right: TimetableEntry) {
  const leftDay = left.day ? timetableDaySchema.options.indexOf(left.day) : 5;
  const rightDay = right.day ? timetableDaySchema.options.indexOf(right.day) : 5;
  if (leftDay !== rightDay) return leftDay - rightDay;
  if (left.location !== right.location) return left.location.localeCompare(right.location, 'de');
  return left.title.localeCompare(right.title, 'de');
}



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
