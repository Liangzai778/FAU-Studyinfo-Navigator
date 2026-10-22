import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateEctsProgress } from '../src/domain/ectsEngine.ts';

const now = '2026-10-22T00:00:00.000Z';

function syntheticCourse(overrides = {}) {
  return {
    id: 'synthetic-test-only-course',
    title: 'Synthetic test-only course',
    ects: 6,
    moduleId: 'synthetic-test-only-module',
    moduleVersionId: 'synthetic-test-only-module-v1',
    isExtraCourse: false,
    countsTowardDegree: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function syntheticAttempt(overrides = {}) {
  return {
    id: 'synthetic-test-only-attempt',
    courseId: 'synthetic-test-only-course',
    semesterId: '2026-winter',
    status: 'passed',
    recognitionConfirmed: false,
    poVersionId: 'synthetic-test-only-po-a',
    requirementGroupId: 'synthetic-test-only-mandatory',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function syntheticGroup(overrides = {}) {
  return {
    id: 'synthetic-test-only-mandatory',
    examinationRegulationVersionId: 'synthetic-test-only-po-a',
    programmeTrackIds: [],
    parentRequirementGroupId: null,
    name: { 'zh-CN': '仅测试要求组', en: 'Synthetic test-only group' },
    kind: 'mandatory',
    ruleText: { 'zh-CN': '无真实学术含义', en: 'No real academic meaning' },
    minEcts: 6,
    maxEcts: null,
    eligibleModuleVersionIds: ['synthetic-test-only-module-v1'],
    exclusiveCounting: true,
    sourceIds: ['synthetic-test-only-source'],
    verificationStatus: 'verified',
    ...overrides,
  };
}

function calculate(overrides = {}) {
  return calculateEctsProgress({
    selectedPoVersionId: 'synthetic-test-only-po-a',
    courses: [syntheticCourse()],
    attempts: [syntheticAttempt()],
    requirementGroups: [syntheticGroup()],
    sourceStatuses: { 'synthetic-test-only-source': 'verified' },
    ...overrides,
  });
}

test('keeps planned and earned credits separate and excludes failed courses', () => {
  assert.equal(calculate({ attempts: [syntheticAttempt({ status: 'planned' })] }).plannedEcts, 6);
  assert.equal(calculate({ attempts: [syntheticAttempt({ status: 'planned' })] }).earnedEcts, 0);
  assert.equal(calculate({ attempts: [syntheticAttempt({ status: 'failed' })] }).earnedEcts, 0);
});

test('counts recognized credits only after explicit confirmation', () => {
  const pending = calculate({ attempts: [syntheticAttempt({ status: 'recognized', recognitionConfirmed: false })] });
  assert.equal(pending.earnedEcts, 0);
  assert.ok(pending.risks.some((risk) => risk.code === 'unconfirmed_recognition'));
  assert.equal(calculate({ attempts: [syntheticAttempt({ status: 'recognized', recognitionConfirmed: true })] }).earnedEcts, 6);
});

test('does not count duplicate module versions twice', () => {
  const duplicate = syntheticCourse({ id: 'synthetic-test-only-course-copy' });
  const result = calculate({
    courses: [syntheticCourse(), duplicate],
    attempts: [syntheticAttempt(), syntheticAttempt({ id: 'synthetic-test-only-copy-attempt', courseId: duplicate.id })],
  });
  assert.equal(result.earnedEcts, 6);
  assert.ok(result.risks.some((risk) => risk.code === 'duplicate_course'));
});

test('does not double-count one module across mutually exclusive groups', () => {
  const secondCourse = syntheticCourse({ id: 'synthetic-test-only-course-copy' });
  const secondGroup = syntheticGroup({
    id: 'synthetic-test-only-elective',
    name: { 'zh-CN': '仅测试选修组', en: 'Synthetic test-only elective group' },
  });
  const result = calculate({
    courses: [syntheticCourse(), secondCourse],
    attempts: [
      syntheticAttempt(),
      syntheticAttempt({
        id: 'synthetic-test-only-copy-attempt',
        courseId: secondCourse.id,
        requirementGroupId: secondGroup.id,
      }),
    ],
    requirementGroups: [syntheticGroup(), secondGroup],
  });
  assert.equal(result.groups.reduce((sum, group) => sum + group.earnedEcts, 0), 6);
});

test('preserves retake history while counting a failed-then-passed course once', () => {
  const result = calculate({
    attempts: [
      syntheticAttempt({ id: 'synthetic-test-only-failed', status: 'failed', updatedAt: '2026-01-01T00:00:00.000Z' }),
      syntheticAttempt({ id: 'synthetic-test-only-passed', status: 'passed', updatedAt: '2026-10-22T00:00:00.000Z' }),
    ],
  });
  assert.equal(result.earnedEcts, 6);
  assert.equal(result.completedEcts, 6);
});

test('excludes a record assigned to another PO without mutating it', () => {
  const attempt = syntheticAttempt({ poVersionId: 'synthetic-test-only-po-b' });
  const frozen = structuredClone(attempt);
  const result = calculate({ attempts: [attempt] });
  assert.equal(result.earnedEcts, 0);
  assert.ok(result.risks.some((risk) => risk.code === 'po_mismatch'));
  assert.deepEqual(attempt, frozen);
});

test('returns unknown when group credits are missing or the source is unknown', () => {
  const missingCredits = calculate({ requirementGroups: [syntheticGroup({ minEcts: null })] });
  assert.equal(missingCredits.groups[0].status, 'unknown');
  assert.equal(missingCredits.graduationStatus, 'unknown');
  const unknownSource = calculate({ sourceStatuses: {} });
  assert.equal(unknownSource.groups[0].status, 'unknown');
  assert.ok(unknownSource.risks.some((risk) => risk.code === 'unknown_source'));
});

test('excludes extra courses marked as not counting toward the degree', () => {
  const result = calculate({ courses: [syntheticCourse({ isExtraCourse: true, countsTowardDegree: false })] });
  assert.equal(result.completedEcts, 6);
  assert.equal(result.earnedEcts, 0);
});
