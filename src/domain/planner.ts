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
   * One block per weekday the course meets on, each with its own clock time.
   *
   * A lecture can sit on Monday 09:00 and Wednesday 14:00, so weekday and time
   * belong together in one record rather than two loose lists. A course that
   * meets twice is still one attempt with one ECTS count; the grid just draws
   * two blocks.
   */
  meetings: z
    .array(
      z.object({
        day: timetableDaySchema,
        startMinutes: z
          .number()
          .int()
          .min(GRID_START_MINUTES)
          .max(GRID_END_MINUTES - SLOT_MINUTES)
          .multipleOf(SLOT_MINUTES),
        durationMinutes: z
          .number()
          .int()
          .min(SLOT_MINUTES)
          .max(GRID_END_MINUTES - GRID_START_MINUTES)
          .multipleOf(SLOT_MINUTES)
          .nullable()
          .default(null),
      }),
    )
    .max(5)
    .default([])
    .superRefine((meetings, context) => {
      const seen = new Set<string>();
      meetings.forEach((meeting, index) => {
        if (seen.has(meeting.day)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Two blocks on the same weekday: ${meeting.day}`,
            path: [index, 'day'],
          });
        }
        seen.add(meeting.day);
      });
    }),
  /**
   * Weekdays the course meets on that have no clock time yet.
   *
   * Older attempts saved the day and the time in separate fields; students may
   * also know the weekday before they learn the time. These days are kept here
   * until a time is filled in, so nothing typed is ever thrown away.
   */
  days: z.array(timetableDaySchema).max(5).default([]),
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
  /** Blocks with a real clock time. Each weekday carries its own time. */
  meetings: CourseMeeting[];
  /** Weekdays known without a time yet; shown so nothing typed is lost. */
  daysWithoutTime: TimetableDay[];
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

export type CourseMeeting = {
  day: TimetableDay;
  startMinutes: number;
  durationMinutes: number | null;
};

/**
 * Anything carrying a schedule: a stored attempt, or a derived timetable entry.
 * Deriving entries from entries must work, so the fields are all optional here.
 */
export type AttemptLike = {
  id?: string;
  attemptId?: string;
  courseId?: string;
  semesterId?: string;
  location?: string;
  meetings?: CourseMeeting[];
  /** Weekdays without a time yet. */
  days?: TimetableDay[];
  /** Older builds kept weekday and time in separate fields; still readable. */
  day?: TimetableDay | null;
  startMinutes?: number | null;
  durationMinutes?: number | null;
  status?: StudyStatus;
};

function isValidDay(value: unknown): value is TimetableDay {
  return timetableDaySchema.safeParse(value).success;
}

function isValidClock(startMinutes: unknown, durationMinutes: unknown): startMinutes is number {
  if (typeof startMinutes !== 'number' || !Number.isInteger(startMinutes)) return false;
  if (startMinutes < GRID_START_MINUTES || startMinutes > GRID_END_MINUTES - SLOT_MINUTES) return false;
  if (startMinutes % SLOT_MINUTES !== 0) return false;
  return typeof durationMinutes !== 'number' || (Number.isInteger(durationMinutes) && durationMinutes >= SLOT_MINUTES);
}

/**
 * Turns whatever is stored into one ordered list of blocks plus the weekdays
 * that still need a time.
 *
 * Three shapes exist in the wild: the current one (a meeting list), the
 * previous one (a weekday list with one shared time), and the first one
 * (a single weekday, optionally with a time). All three are read here rather
 * than in the storage layer, so the component and the tests see one shape.
 */
export function normaliseMeetings(attempt: AttemptLike): { meetings: CourseMeeting[]; daysWithoutTime: TimetableDay[] } {
  const meetings: CourseMeeting[] = [];
  const withoutTime: TimetableDay[] = [];
  const seen = new Set<TimetableDay>();

  (attempt.meetings ?? []).forEach((meeting) => {
    if (!isValidDay(meeting.day) || seen.has(meeting.day)) return;
    if (!isValidClock(meeting.startMinutes, meeting.durationMinutes)) return;
    seen.add(meeting.day);
    meetings.push({
      day: meeting.day,
      startMinutes: meeting.startMinutes,
      durationMinutes: typeof meeting.durationMinutes === 'number' ? meeting.durationMinutes : null,
    });
  });

  const looseDays = [...(attempt.days ?? []), ...(attempt.day ? [attempt.day] : [])].filter(isValidDay);
  const sharedStart = isValidClock(attempt.startMinutes, attempt.durationMinutes) ? attempt.startMinutes : null;
  const sharedDuration = typeof attempt.durationMinutes === 'number' ? attempt.durationMinutes : null;

  for (const day of looseDays) {
    if (seen.has(day)) continue;
    seen.add(day);
    // The previous build shared one time across days; reuse it so a plan saved
    // yesterday still shows up on the grid instead of needing to be re-entered.
    if (sharedStart !== null) {
      meetings.push({ day, startMinutes: sharedStart, durationMinutes: sharedDuration });
    } else {
      withoutTime.push(day);
    }
  }

  const order = (day: TimetableDay) => timetableDaySchema.options.indexOf(day);
  meetings.sort((left, right) => order(left.day) - order(right.day));
  withoutTime.sort((left, right) => order(left) - order(right));
  return { meetings, daysWithoutTime: withoutTime };
}

/** Every weekday a course touches, with or without a time. */
export function attemptDays(attempt: AttemptLike): TimetableDay[] {
  const { meetings, daysWithoutTime } = normaliseMeetings(attempt);
  const merged = [...meetings.map((meeting) => meeting.day), ...daysWithoutTime];
  return TIMETABLE_DAYS.filter((day) => merged.includes(day));
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
    if (!attempt.id || !attempt.courseId || !attempt.semesterId) return;
    const course = courseById.get(attempt.courseId);
    if (!course) return;
    const { meetings, daysWithoutTime } = normaliseMeetings(attempt);
    const entries = bySemester.get(attempt.semesterId) ?? [];
    entries.push({
      attemptId: attempt.id,
      courseId: course.id,
      title: course.title,
      ects: course.ects,
      semesterId: attempt.semesterId,
      location: attempt.location ?? '',
      meetings,
      daysWithoutTime,
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

function earliestStart(entry: TimetableEntry) {
  if (entry.meetings.length === 0) return Number.MAX_SAFE_INTEGER;
  return Math.min(...entry.meetings.map((meeting) => meeting.startMinutes));
}

function compareEntries(left: TimetableEntry, right: TimetableEntry) {
  const leftDay = earliestDayIndex(left);
  const rightDay = earliestDayIndex(right);
  if (leftDay !== rightDay) return leftDay - rightDay;
  const leftStart = earliestStart(left);
  const rightStart = earliestStart(right);
  if (leftStart !== rightStart) return leftStart - rightStart;
  if (left.location !== right.location) return left.location.localeCompare(right.location, 'de');
  return left.title.localeCompare(right.title, 'de');
}

/** Index of the first weekday a course meets; 5 means "no day set". */
function earliestDayIndex(entry: { meetings?: CourseMeeting[]; days?: TimetableDay[]; startMinutes?: number | null; durationMinutes?: number | null }) {
  const days = attemptDays(entry);
  if (days.length === 0) return timetableDaySchema.options.length;
  return timetableDaySchema.options.indexOf(days[0]!);
}

/** Every block the grid draws, one per meeting. */
export function timetableOccurrences(entry: TimetableEntry): TimetableOccurrence[] {
  return entry.meetings.map((meeting) => ({
    day: meeting.day,
    startMinutes: meeting.startMinutes,
    durationMinutes: meeting.durationMinutes,
  }));
}

function blockEnd(meeting: CourseMeeting) {
  return meeting.startMinutes + (meeting.durationMinutes ?? DEFAULT_BLOCK_MINUTES);
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
  taken: readonly (AttemptLike | TimetableEntry)[],
): number | null {
  const blocked = taken
    .flatMap((attempt) => normaliseMeetings(attempt).meetings)
    .filter((meeting) => meeting.day === day)
    .map((meeting) => ({ start: meeting.startMinutes, end: blockEnd(meeting) }));

  for (let start = snapToSlot(requestedStart); start + SLOT_MINUTES <= GRID_END_MINUTES; start += SLOT_MINUTES) {
    const end = start + clampDuration(start, duration);
    const overlaps = blocked.some((slot) => start < slot.end && slot.start < end);
    if (!overlaps) return start;
  }
  return null;
}

export type TimetableClash = { day: TimetableDay; first: TimetableEntry; second: TimetableEntry };

/** Course blocks that clash in a semester, so the page can warn about them. */
export function findClashes(entries: readonly TimetableEntry[]): TimetableClash[] {
  const clashes: TimetableClash[] = [];
  for (const day of TIMETABLE_DAYS) {
    const blocks = entries
      .flatMap((entry) => entry.meetings.filter((meeting) => meeting.day === day).map((meeting) => ({ entry, meeting })))
      .sort((left, right) => left.meeting.startMinutes - right.meeting.startMinutes);

    for (let index = 1; index < blocks.length; index += 1) {
      const previous = blocks[index - 1]!;
      const current = blocks[index]!;
      // Half-open intervals: a lecture ending at 10:30 and one starting at
      // 10:30 are back to back, not a clash.
      if (current.meeting.startMinutes < blockEnd(previous.meeting)) {
        clashes.push({ day, first: previous.entry, second: current.entry });
      }
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
