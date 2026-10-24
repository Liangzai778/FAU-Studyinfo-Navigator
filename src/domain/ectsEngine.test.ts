import { describe, expect, it } from 'vitest';
import type { RequirementGroup } from './academic';
import { calculateEctsProgress } from './ectsEngine';
import type { CourseAttempt, LocalCourse } from './planner';

const poId = 'po-test';
const sourceStatuses = { 'src-1': 'verified' as const };

function group(
  id: string,
  minEcts: number | null,
  parentRequirementGroupId: string | null,
  eligibleModuleVersionIds: string[] = [],
  overrides: Partial<RequirementGroup> = {},
): RequirementGroup {
  return {
    id,
    examinationRegulationVersionId: poId,
    programmeTrackIds: [],
    parentRequirementGroupId,
    name: { 'zh-CN': id, en: id },
    kind: minEcts === null ? 'additional' : 'mandatory',
    ruleText: { 'zh-CN': id, en: id },
    minEcts,
    maxEcts: minEcts,
    eligibleModuleVersionIds,
    exclusiveCounting: false,
    sourceIds: ['src-1'],
    verificationStatus: 'verified',
    ...overrides,
  };
}

function course(id: string, ects: number | null, moduleVersionId: string): LocalCourse {
  return {
    id,
    title: id,
    ects,
    moduleId: `module-${id}`,
    moduleVersionId,
    isExtraCourse: false,
    countsTowardDegree: true,
    createdAt: '2026-10-24T10:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
  };
}

function attempt(courseId: string, overrides: Partial<CourseAttempt> = {}): CourseAttempt {
  return {
    id: `attempt-${courseId}`,
    courseId,
    semesterId: '2026-winter',
    status: 'passed',
    recognitionConfirmed: false,
    poVersionId: poId,
    requirementGroupId: null,
    location: '',
    meetings: [],
    days: [],
    notes: '',
    createdAt: '2026-10-24T10:00:00.000Z',
    updatedAt: '2026-10-24T10:00:00.000Z',
    ...overrides,
  };
}

function run(
  groups: RequirementGroup[],
  courses: LocalCourse[],
  attempts: CourseAttempt[],
  statuses: Record<string, 'verified' | 'unverified' | 'needs_review'> = sourceStatuses,
) {
  return calculateEctsProgress({
    selectedPoVersionId: poId,
    courses,
    attempts,
    requirementGroups: groups,
    sourceStatuses: statuses,
  });
}

/**
 * The 120-ECTS total of every programme is a container with no modules of its
 * own. These tests pin the roll-up: without it every parent group stayed at
 * 0/120 and a complete plan still reported "not satisfied".
 */
describe('ECTS progress rolls child groups up into their parent', () => {
  const groups = [
    group('root', 10, null),
    group('compulsory', 6, 'root', ['mv-a']),
    group('elective', 4, 'root', ['mv-b']),
  ];

  it('counts a child module towards the parent and the degree total', () => {
    const courses = [course('a', 6, 'mv-a'), course('b', 4, 'mv-b')];
    const result = run(groups, courses, [
      attempt('a', { requirementGroupId: 'compulsory' }),
      attempt('b', { requirementGroupId: 'elective' }),
    ]);

    expect(result.groups.find((item) => item.groupId === 'root')).toMatchObject({
      earnedEcts: 10,
      missingEcts: 0,
      status: 'satisfied',
    });
    expect(result.graduationStatus).toBe('satisfied');
    expect(result.risks).toHaveLength(0);
  });

  it('keeps the degree unsatisfied when one child group is short', () => {
    const courses = [course('a', 6, 'mv-a')];
    const result = run(groups, courses, [attempt('a', { requirementGroupId: 'compulsory' })]);

    expect(result.groups.find((item) => item.groupId === 'root')).toMatchObject({
      earnedEcts: 6,
      missingEcts: 4,
      status: 'not_satisfied',
    });
    expect(result.graduationStatus).toBe('not_satisfied');
  });

  it('does not count planned or in-progress courses as earned', () => {
    const courses = [course('a', 6, 'mv-a')];
    const result = run(groups, courses, [
      attempt('a', { requirementGroupId: 'compulsory', status: 'planned' }),
    ]);

    expect(result.groups.find((item) => item.groupId === 'compulsory')).toMatchObject({
      earnedEcts: 0,
      plannedEcts: 6,
      missingEcts: 6,
    });
    expect(result.graduationStatus).toBe('not_satisfied');
  });
});

describe('ECTS progress stays honest about unknown data', () => {
  it('reports a module with unknown ECTS instead of counting it as zero', () => {
    const groups = [group('root', 5, null), group('child', 5, 'root', ['mv-x'])];
    const result = run(groups, [course('x', null, 'mv-x')], [attempt('x', { requirementGroupId: 'child' })]);

    expect(result.risks.map((risk) => risk.code)).toContain('missing_course_ects');
    expect(result.groups.find((item) => item.groupId === 'child')?.earnedEcts).toBe(0);
    expect(result.graduationStatus).toBe('not_satisfied');
  });

  it('ignores a course recorded under another PO version', () => {
    const groups = [group('root', 5, null), group('child', 5, 'root', ['mv-x'])];
    const result = run(groups, [course('x', 5, 'mv-x')], [
      attempt('x', { requirementGroupId: 'child', poVersionId: 'po-other' }),
    ]);

    expect(result.risks.map((risk) => risk.code)).toContain('po_mismatch');
    expect(result.graduationStatus).toBe('not_satisfied');
  });

  it('keeps the result unknown when a rule source is not verified', () => {
    const groups = [
      group('root', 5, null),
      group('child', 5, 'root', ['mv-x'], { sourceIds: ['src-unverified'] }),
    ];
    const result = run(
      groups,
      [course('x', 5, 'mv-x')],
      [attempt('x', { requirementGroupId: 'child' })],
      { 'src-1': 'verified', 'src-unverified': 'needs_review' },
    );

    expect(result.risks.map((risk) => risk.code)).toContain('unknown_source');
    expect(result.graduationStatus).toBe('unknown');
  });

  it('returns unknown when the selection has no requirement groups', () => {
    const result = run([], [], []);
    expect(result.graduationStatus).toBe('unknown');
    expect(result.risks.map((risk) => risk.code)).toContain('no_verified_rules');
  });
});
