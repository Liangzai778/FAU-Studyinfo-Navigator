import { describe, expect, it } from 'vitest';
import { academicData } from './academicData';
import { getRequirementGroupsForSelection, type AcademicSelection } from '../domain/academic';
import { calculateEctsProgress } from '../domain/ectsEngine';
import type { CourseAttempt, LocalCourse } from '../domain/planner';

/**
 * A plan that satisfies the real ILS regulation must be judged "satisfied".
 *
 * This is an integration guard over the real data package, not a fixture: it
 * walks the actual requirement groups, takes modules from the actual catalogue,
 * and asserts that a student who follows § 51 (2) of the ILS regulation
 * (statistics 5 + one group 30 + another 35 + advanced module 20 + thesis 30)
 * reaches 120 ECTS. It would have caught two real defects:
 *
 *  - the parent group never receiving its children's credits,
 *  - `rg-ils-abschluss` demanding 60 ECTS while only offering 55.
 */
const ilsSelection: AcademicSelection = {
  degreeType: 'master',
  facultyId: 'nat',
  programmeId: 'nat-biologie-integrated-life-sciences-msc',
  programmeTrackIds: ['ils-track-mg1', 'ils-track-mg2'],
  entrySemesterId: '2026-winter',
  examinationRegulationVersionId: 'po-ils-2026',
  poConfirmedByUser: true,
};

const sourceStatuses = Object.fromEntries(
  academicData.academicSources.map((source) => [source.id, source.verificationStatus]),
);

const moduleVersionById = new Map(academicData.moduleVersions.map((version) => [version.id, version]));
const moduleById = new Map(academicData.modules.map((module) => [module.id, module]));

function coursesFor(targets: Array<{ groupId: string; ects: number }>) {
  const courses: LocalCourse[] = [];
  const attempts: CourseAttempt[] = [];
  const used = new Set<string>();

  for (const target of targets) {
    const group = academicData.requirementGroups.find((item) => item.id === target.groupId);
    if (!group) throw new Error(`missing group ${target.groupId}`);

    let earned = 0;
    for (const versionId of group.eligibleModuleVersionIds) {
      if (earned >= target.ects) break;
      if (used.has(versionId)) continue;
      const version = moduleVersionById.get(versionId);
      if (!version || version.ects === null) continue;
      const module = moduleById.get(version.moduleId);
      used.add(versionId);

      const courseId = `course-${versionId}`;
      courses.push({
        id: courseId,
        title: module?.name.en ?? versionId,
        ects: version.ects,
        moduleId: version.moduleId,
        moduleVersionId: versionId,
        isExtraCourse: false,
        countsTowardDegree: true,
        createdAt: '2026-10-24T10:00:00.000Z',
        updatedAt: '2026-10-24T10:00:00.000Z',
      });
      attempts.push({
        id: `attempt-${versionId}`,
        courseId,
        semesterId: '2026-winter',
        status: 'passed',
        recognitionConfirmed: false,
        poVersionId: ilsSelection.examinationRegulationVersionId,
        requirementGroupId: group.id,
        location: '',
        meetings: [],
        days: [],
        notes: '',
        createdAt: '2026-10-24T10:00:00.000Z',
        updatedAt: '2026-10-24T10:00:00.000Z',
      });
      earned += version.ects;
    }

    if (earned < target.ects) {
      throw new Error(`${target.groupId} could only reach ${earned} of ${target.ects} ECTS`);
    }
  }

  return { courses, attempts };
}

describe('a complete ILS plan reaches the degree total', () => {
  it('satisfies every group once the credits are where the regulation puts them', () => {
    const groups = getRequirementGroupsForSelection(academicData, ilsSelection);
    const { courses, attempts } = coursesFor([
      // § 51 (2): one module group 30 ECTS, another 35 ECTS, advanced module
      // 20 ECTS and thesis 30 ECTS, statistics 5 ECTS.
      { groupId: 'rg-ils-mg1-wahlpflicht', ects: 35 },
      { groupId: 'rg-ils-mg2-wahlpflicht', ects: 30 },
      { groupId: 'rg-ils-abschluss', ects: 55 },
    ]);

    const result = calculateEctsProgress({
      selectedPoVersionId: ilsSelection.examinationRegulationVersionId,
      courses,
      attempts,
      requirementGroups: groups,
      sourceStatuses,
    });

    const progress = (groupId: string) => {
      const group = result.groups.find((item) => item.groupId === groupId);
      if (!group) throw new Error(`no progress recorded for ${groupId}`);
      return group;
    };

    expect(progress('rg-ils-mg1-wahlpflicht').earnedEcts).toBeGreaterThanOrEqual(30);
    expect(progress('rg-ils-modulgruppen').earnedEcts).toBeGreaterThanOrEqual(65);
    expect(progress('rg-ils-abschluss').earnedEcts).toBe(55);
    expect(progress('rg-ils-gesamt').earnedEcts).toBeGreaterThanOrEqual(120);
    expect(result.graduationStatus).toBe('satisfied');
    expect(result.risks).toHaveLength(0);
  });

  it('reports the shortfall when the two module groups do not add up to 65', () => {
    const groups = getRequirementGroupsForSelection(academicData, ilsSelection);
    const { courses, attempts } = coursesFor([
      { groupId: 'rg-ils-mg1-wahlpflicht', ects: 30 },
      { groupId: 'rg-ils-mg2-wahlpflicht', ects: 30 },
      { groupId: 'rg-ils-abschluss', ects: 55 },
    ]);

    const result = calculateEctsProgress({
      selectedPoVersionId: ilsSelection.examinationRegulationVersionId,
      courses,
      attempts,
      requirementGroups: groups,
      sourceStatuses,
    });

    const moduleGroups = result.groups.find((group) => group.groupId === 'rg-ils-modulgruppen');
    expect(moduleGroups?.earnedEcts).toBeLessThan(65);
    expect(moduleGroups?.missingEcts).toBe(65 - (moduleGroups?.earnedEcts ?? 0));
    expect(moduleGroups?.status).toBe('not_satisfied');
    expect(result.graduationStatus).toBe('not_satisfied');
  });
});
