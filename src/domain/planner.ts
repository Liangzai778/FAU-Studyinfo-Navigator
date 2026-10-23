import { z } from 'zod';
import { entrySemesterIdSchema, ruleVerificationStatusSchema } from './academic';
import { DEFAULT_BLOCK_MINUTES, GRID_END_MINUTES, GRID_START_MINUTES, SLOT_MINUTES, clampDuration, snapToSlot } from './timetableGrid';
import { TIMETABLE_DAYS } from './timetableLabels';

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
  /**
   * Every weekday this course meets on.
   *
   * A lecture can sit on Monday and Wednesday; keeping the list on one attempt
   * means one course stays one record instead of being duplicated per day.
   * The legacy single `day` column is still accepted in stored snapshots and
   * folded into this list on read, so old data keeps working.
   */
  days: z.array(timetableDaySchema).max(5).default([]),
  // Clock times turn the weekday list into a real schedule. Both are optional:
  // a student may know the weekday before the time, and older saved attempts
  // simply have no time yet.
  startMinutes: z
    .number()
    .int()
    .min(GRID_START_MINUTES)
    .max(GRID_END_MINUTES - SLOT_MINUTES)
    .multipleOf(SLOT_MINUTES)
    .nullable()
    .default(null),
  durationMinutes: z.number().int().min(SLOT_MINUTES).max(GRID_END_MINUTES - GRID_START_MINUTES).multipleOf(SLOT_MINUTES).nullable().default(null),
  notes: z.string().max(500),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CourseAttempt = z.infer<typeof courseAttemptSchema>;

/** One course meeting on one weekday. A twice-weekly lecture yields two. */
export type TimetableOccurrence = {
  day: TimetableDay;
  startMinutes: number | null;
  durationMinutes: number | null;
};

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
  /** Every weekday the course meets; empty when the student has not said yet. */
  days: TimetableDay[];
  startMinutes: number | null;
  durationMinutes: number | null;
  status: StudyStatus;
  /** True when the room/time was filled in by hand rather than read from a handbook. */
  isExtraCourse: boolean;
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
  days?: TimetableDay[];
  /** Legacy single weekday, still present in snapshots saved by older builds. */
  day?: TimetableDay | null;
  status?: StudyStatus;
  startMinutes?: number | null;
  durationMinutes?: number | null;
};

/** Reads the weekday list, falling back to the legacy single-day column. */
export function attemptDays(attempt: Pick<AttemptLike, 'days' | 'day'>): TimetableDay[] {
  const fromList = attempt.days ?? [];
  const legacy = attempt.day ? [attempt.day] : [];
  return [...new Set([...fromList, ...legacy])].filter((day): day is TimetableDay =>
    timetableDaySchema.safeParse(day).success,
  );
}

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
      days: attemptDays(attempt),
      startMinutes: attempt.startMinutes ?? null,
      durationMinutes: attempt.durationMinutes ?? null,
      status: attempt.status ?? 'planned',
      isExtraCourse: course.isExtraCourse,
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
  const leftDay = earliestDayIndex(left.days);
  const rightDay = earliestDayIndex(right.days);
  if (leftDay !== rightDay) return leftDay - rightDay;
  const leftStart = left.startMinutes ?? Number.MAX_SAFE_INTEGER;
  const rightStart = right.startMinutes ?? Number.MAX_SAFE_INTEGER;
  if (leftStart !== rightStart) return leftStart - rightStart;
  if (left.location !== right.location) return left.location.localeCompare(right.location, 'de');
  return left.title.localeCompare(right.title, 'de');
}

/** Index of the first weekday a course meets; 5 means "no day set". */
function earliestDayIndex(days: readonly TimetableDay[]) {
  if (days.length === 0) return timetableDaySchema.options.length;
  return Math.min(...days.map((day) => timetableDaySchema.options.indexOf(day)));
}

/** Expands courses into one block per meeting, which is what the grid draws. */
export function timetableOccurrences(entry: TimetableEntry): TimetableOccurrence[] {
  return entry.days.map((day) => ({
    day,
    startMinutes: entry.startMinutes,
    durationMinutes: entry.durationMinutes,
  }));
}

/**
 * Places a block on the grid without letting it overlap an existing one.
 *
 * Students pick a start time from the clock; when that slot is taken the block
 * moves down in quarter-hour steps. Returning the same value the caller asked
 * for means "free"; a different value is a conflict that must be shown.
 */
export function findFreeStart(
  day: TimetableDay,
  requestedStart: number,
  duration: number,
  taken: readonly { day?: TimetableDay | null; days?: readonly TimetableDay[]; startMinutes: number | null; durationMinutes: number | null }[],
): number | null {
  const blocked = taken
    .filter((entry) => (entry.days ?? (entry.day ? [entry.day] : [])).includes(day) && entry.startMinutes !== null)
    .map((entry) => ({
      start: entry.startMinutes as number,
      end: (entry.startMinutes as number) + (entry.durationMinutes ?? DEFAULT_BLOCK_MINUTES),
    }));

  for (let start = snapToSlot(requestedStart); start + SLOT_MINUTES <= GRID_END_MINUTES; start += SLOT_MINUTES) {
    const end = start + clampDuration(start, duration);
    const overlaps = blocked.some((slot) => start < slot.end && slot.start < end);
    if (!overlaps) return start;
  }
  return null;
}

/** Course blocks that clash in a semester, so the page can warn about them. */
export function findClashes(entries: readonly TimetableEntry[]): { day: TimetableDay; first: TimetableEntry; second: TimetableEntry }[] {
  const clashes: { day: TimetableDay; first: TimetableEntry; second: TimetableEntry }[] = [];
  for (const day of TIMETABLE_DAYS) {
    const blocks = entries
      .filter((entry) => entry.days.includes(day) && entry.startMinutes !== null)
      .map((entry) => ({
        entry,
        start: entry.startMinutes as number,
        end: (entry.startMinutes as number) + (entry.durationMinutes ?? DEFAULT_BLOCK_MINUTES),
      }))
      .sort((left, right) => left.start - right.start);
    for (let index = 1; index < blocks.length; index += 1) {
      const previous = blocks[index - 1]!;
      const current = blocks[index]!;
      if (current.start < previous.end) clashes.push({ day, first: previous.entry, second: current.entry });
    }
  }
  return clashes;
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
