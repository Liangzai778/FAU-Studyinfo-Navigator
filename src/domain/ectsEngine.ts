import type { RequirementGroup, RuleVerificationStatus } from './academic';
import type {
  CourseAttempt,
  EctsEngineResult,
  EctsRisk,
  LocalCourse,
  RequirementGroupProgress,
} from './planner';

export type EctsEngineInput = {
  selectedPoVersionId: string | null;
  courses: readonly LocalCourse[];
  attempts: readonly CourseAttempt[];
  requirementGroups: readonly RequirementGroup[];
  sourceStatuses: Readonly<Record<string, RuleVerificationStatus | undefined>>;
};

type EffectiveCourse = {
  course: LocalCourse;
  attempt: CourseAttempt;
  identity: string;
};

function isSuccessful(attempt: CourseAttempt) {
  return attempt.status === 'passed' || (attempt.status === 'recognized' && attempt.recognitionConfirmed);
}

function isPlanned(attempt: CourseAttempt) {
  return attempt.status === 'planned' || attempt.status === 'in_progress';
}

function compareAttempts(left: CourseAttempt, right: CourseAttempt) {
  return left.updatedAt.localeCompare(right.updatedAt) || left.id.localeCompare(right.id);
}

function pushUniqueRisk(risks: EctsRisk[], risk: EctsRisk) {
  if (!risks.some((item) => item.code === risk.code && item.courseId === risk.courseId && item.groupId === risk.groupId)) {
    risks.push(risk);
  }
}

function selectEffectiveCourses(
  courses: readonly LocalCourse[],
  attempts: readonly CourseAttempt[],
  predicate: (attempt: CourseAttempt) => boolean,
  risks: EctsRisk[],
) {
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const attemptsByCourse = new Map<string, CourseAttempt[]>();
  attempts.forEach((attempt) => {
    if (!courseMap.has(attempt.courseId)) return;
    const current = attemptsByCourse.get(attempt.courseId) ?? [];
    current.push(attempt);
    attemptsByCourse.set(attempt.courseId, current);
  });

  const selected: EffectiveCourse[] = [];
  const identities = new Set<string>();
  courses.forEach((course) => {
    const eligibleAttempts = (attemptsByCourse.get(course.id) ?? []).filter(predicate).sort(compareAttempts);
    const attempt = eligibleAttempts.at(-1);
    if (!attempt) return;
    const identity = course.moduleVersionId ? `module-version:${course.moduleVersionId}` : `local-course:${course.id}`;
    if (identities.has(identity)) {
      pushUniqueRisk(risks, { code: 'duplicate_course', courseId: course.id });
      return;
    }
    identities.add(identity);
    selected.push({ course, attempt, identity });
  });
  return selected;
}

function isRuleEvidenceVerified(
  group: RequirementGroup,
  sourceStatuses: EctsEngineInput['sourceStatuses'],
  risks: EctsRisk[],
) {
  if (group.verificationStatus !== 'verified') {
    pushUniqueRisk(risks, { code: 'unverified_rule', groupId: group.id });
    return false;
  }
  if (group.sourceIds.some((sourceId) => sourceStatuses[sourceId] !== 'verified')) {
    pushUniqueRisk(risks, { code: 'unknown_source', groupId: group.id });
    return false;
  }
  return true;
}

function isEligibleForGroup(course: LocalCourse, group: RequirementGroup) {
  if (group.eligibleModuleVersionIds.length === 0) {
    return group.kind === 'free_elective' || group.kind === 'additional' || group.kind === 'internship';
  }
  return course.moduleVersionId !== null && group.eligibleModuleVersionIds.includes(course.moduleVersionId);
}

export function calculateEctsProgress(input: EctsEngineInput): EctsEngineResult {
  const risks: EctsRisk[] = [];
  if (!input.selectedPoVersionId) pushUniqueRisk(risks, { code: 'no_selected_po' });

  input.attempts.forEach((attempt) => {
    if (attempt.status === 'recognized' && !attempt.recognitionConfirmed) {
      pushUniqueRisk(risks, { code: 'unconfirmed_recognition', courseId: attempt.courseId });
    }
  });

  const successful = selectEffectiveCourses(input.courses, input.attempts, isSuccessful, risks);
  const successfulIdentities = new Set(successful.map((item) => item.identity));
  const planned = selectEffectiveCourses(input.courses, input.attempts, isPlanned, risks)
    .filter((item) => !successfulIdentities.has(item.identity));
  const completedEcts = successful.reduce((sum, item) => sum + (item.course.ects ?? 0), 0);

  const graduationEligible = successful.filter(({ course, attempt }) => {
    if (course.ects === null) {
      pushUniqueRisk(risks, { code: 'missing_course_ects', courseId: course.id });
      return false;
    }
    if (!course.countsTowardDegree) return false;
    if (!input.selectedPoVersionId || attempt.poVersionId === null) {
      pushUniqueRisk(risks, { code: 'unassigned_po', courseId: course.id });
      return false;
    }
    if (attempt.poVersionId !== input.selectedPoVersionId) {
      pushUniqueRisk(risks, { code: 'po_mismatch', courseId: course.id });
      return false;
    }
    return true;
  });

  const plannedEligible = planned.filter(({ course, attempt }) => {
    if (course.ects === null || !course.countsTowardDegree) return false;
    return Boolean(input.selectedPoVersionId && attempt.poVersionId === input.selectedPoVersionId);
  });

  const earnedEcts = graduationEligible.reduce((sum, item) => sum + (item.course.ects ?? 0), 0);
  const plannedEcts = plannedEligible.reduce((sum, item) => sum + (item.course.ects ?? 0), 0);
  const groupsForPo = input.selectedPoVersionId
    ? input.requirementGroups.filter((group) => group.examinationRegulationVersionId === input.selectedPoVersionId)
    : [];
  if (groupsForPo.length === 0) pushUniqueRisk(risks, { code: 'no_verified_rules' });
  const groupIdsForPo = new Set(groupsForPo.map((group) => group.id));
  [...graduationEligible, ...plannedEligible].forEach((item) => {
    if (item.attempt.requirementGroupId && !groupIdsForPo.has(item.attempt.requirementGroupId)) {
      pushUniqueRisk(risks, {
        code: 'unknown_requirement_group',
        courseId: item.course.id,
        groupId: item.attempt.requirementGroupId,
      });
    }
  });

  const allocation = new Map<string, { groupId: string; exclusive: boolean }>();
  const allocatedEarnedIdentities = new Set<string>();
  const groups: RequirementGroupProgress[] = groupsForPo.map((group) => {
    const evidenceVerified = isRuleEvidenceVerified(group, input.sourceStatuses, risks);
    if (group.minEcts === null) pushUniqueRisk(risks, { code: 'missing_group_ects', groupId: group.id });

    const sumForGroup = (items: readonly EffectiveCourse[], trackEarnedAllocation: boolean) => {
      let sum = 0;
      items.forEach((item) => {
        if (item.attempt.requirementGroupId !== group.id) return;
        if (!isEligibleForGroup(item.course, group)) {
          pushUniqueRisk(risks, { code: 'ineligible_module', courseId: item.course.id, groupId: group.id });
          return;
        }
        const previous = allocation.get(item.identity);
        if (previous && previous.groupId !== group.id && (previous.exclusive || group.exclusiveCounting)) {
          pushUniqueRisk(risks, { code: 'exclusive_double_count_prevented', courseId: item.course.id, groupId: group.id });
          return;
        }
        allocation.set(item.identity, { groupId: group.id, exclusive: group.exclusiveCounting });
        if (trackEarnedAllocation) allocatedEarnedIdentities.add(item.identity);
        sum += item.course.ects ?? 0;
      });
      return sum;
    };

    const groupEarned = sumForGroup(graduationEligible, true);
    const groupPlanned = sumForGroup(plannedEligible, false);
    const missingEcts = group.minEcts === null ? null : Math.max(0, group.minEcts - groupEarned);
    const status = !evidenceVerified || group.minEcts === null
      ? 'unknown'
      : groupEarned >= group.minEcts
        ? 'satisfied'
        : 'not_satisfied';
    return {
      groupId: group.id,
      earnedEcts: groupEarned,
      plannedEcts: groupPlanned,
      requiredEcts: group.minEcts,
      missingEcts,
      status,
      verificationStatus: group.verificationStatus,
    };
  });

  const allocatedEarnedEcts = graduationEligible
    .filter((item) => allocatedEarnedIdentities.has(item.identity))
    .reduce((sum, item) => sum + (item.course.ects ?? 0), 0);

  // A requirement group can be a container. The 120-ECTS total of every
  // programme has no modules of its own, only child groups. Counting only
  // modules assigned to the group itself left every parent at 0/120, so a
  // student who met every module-level requirement still saw "not satisfied"
  // forever. Child progress must roll up into the parent.
  const childrenByParent = new Map<string, string[]>();
  for (const group of groupsForPo) {
    if (!group.parentRequirementGroupId) continue;
    const siblings = childrenByParent.get(group.parentRequirementGroupId) ?? [];
    siblings.push(group.id);
    childrenByParent.set(group.parentRequirementGroupId, siblings);
  }

  const rolledUp = new Map<string, { earnedEcts: number; plannedEcts: number }>();
  const rollUp = (groupId: string, visiting: Set<string>): { earnedEcts: number; plannedEcts: number } => {
    const cached = rolledUp.get(groupId);
    if (cached) return cached;
    const own = groups.find((group) => group.groupId === groupId);
    // The visiting set also stops a malformed cycle from recursing forever.
    if (!own || visiting.has(groupId)) return { earnedEcts: 0, plannedEcts: 0 };
    visiting.add(groupId);
    let earnedEcts = own.earnedEcts;
    let plannedEcts = own.plannedEcts;
    for (const childId of childrenByParent.get(groupId) ?? []) {
      const child = rollUp(childId, visiting);
      earnedEcts += child.earnedEcts;
      plannedEcts += child.plannedEcts;
    }
    visiting.delete(groupId);
    const total = { earnedEcts, plannedEcts };
    rolledUp.set(groupId, total);
    return total;
  };

  const groupsWithChildren = groups.map((group) => {
    const total = rollUp(group.groupId, new Set());
    const missingEcts = group.requiredEcts === null ? null : Math.max(0, group.requiredEcts - total.earnedEcts);
    const status: RequirementGroupProgress['status'] =
      group.status === 'unknown' || group.requiredEcts === null
        ? 'unknown'
        : total.earnedEcts >= group.requiredEcts
          ? 'satisfied'
          : 'not_satisfied';
    return { ...group, earnedEcts: total.earnedEcts, plannedEcts: total.plannedEcts, missingEcts, status };
  });

  const graduationStatus = groupsWithChildren.length === 0 || groupsWithChildren.some((group) => group.status === 'unknown')
    ? 'unknown'
    : groupsWithChildren.every((group) => group.status === 'satisfied')
      ? 'satisfied'
      : 'not_satisfied';

  return {
    completedEcts,
    earnedEcts,
    plannedEcts,
    unallocatedEarnedEcts: Math.max(0, earnedEcts - allocatedEarnedEcts),
    groups: groupsWithChildren,
    graduationStatus,
    risks,
  };
}
