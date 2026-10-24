import { academicData } from './academicData';
import type { DegreeType, FacultyId } from '../domain/academic';

/**
 * Where the project lives, in one place.
 *
 * The app itself never fetches these URLs. They are rendered as ordinary
 * external links that do nothing until the user clicks them, which keeps the
 * "no background network requests" rule intact.
 */
export const projectLinks = {
  repository: 'https://github.com/tommy2345-art/FAU-Studyinfo-Navigator',
  contributing: 'https://github.com/tommy2345-art/FAU-Studyinfo-Navigator/blob/main/CONTRIBUTING.md',
  facultyGuide: 'https://github.com/tommy2345-art/FAU-Studyinfo-Navigator/blob/main/docs/ADDING_A_FACULTY.md',
  newFacultyIssue: 'https://github.com/tommy2345-art/FAU-Studyinfo-Navigator/issues/new?template=faculty-data.yml',
  reportBug: 'https://github.com/tommy2345-art/FAU-Studyinfo-Navigator/issues/new?template=bug_report.yml',
  liveDemo: 'https://fau-studyinfo-navigator.pages.dev',
} as const;

export type LocalizedText = { 'zh-CN': string; en: string };

export type ProgrammeCoverage = {
  programmeId: string;
  name: LocalizedText;
  degreeType: DegreeType;
  dataStatus: 'verified' | 'partial' | 'unverified';
  poVersionIds: string[];
  requirementGroupCount: number;
  /** Distinct modules a student can actually reach through a requirement group. */
  moduleCount: number;
};

export type FacultyCoverage = {
  facultyId: FacultyId;
  name: LocalizedText;
  programmes: ProgrammeCoverage[];
  /** `covered` means at least one programme has a transcribed, group-backed PO. */
  status: 'covered' | 'none';
};

/**
 * Coverage is derived from the data package, never hand-written.
 *
 * That is deliberate: adding a faculty's programmes to `academic-data.json`
 * flips its status without touching this file, so a contributor from another
 * faculty only has to add data plus sources. The tests in
 * `coverage.test.ts` fail if the derived numbers drift from the package.
 */
function buildProgrammeCoverage(programmeId: string): ProgrammeCoverage | null {
  const programme = academicData.programmes.find((item) => item.id === programmeId);
  if (!programme) return null;

  const poVersionIds = academicData.examinationRegulationVersions
    .filter((po) => po.programmeId === programme.id)
    .map((po) => po.id);

  const poIdSet = new Set(poVersionIds);
  const groups = academicData.requirementGroups.filter((group) =>
    poIdSet.has(group.examinationRegulationVersionId),
  );

  const moduleVersionIds = new Set(groups.flatMap((group) => group.eligibleModuleVersionIds));
  const moduleIds = new Set(
    academicData.moduleVersions
      .filter((version) => moduleVersionIds.has(version.id))
      .map((version) => version.moduleId),
  );

  return {
    programmeId: programme.id,
    name: programme.name,
    degreeType: programme.degreeType,
    dataStatus: programme.dataStatus,
    poVersionIds,
    requirementGroupCount: groups.length,
    moduleCount: moduleIds.size,
  };
}

export const facultyCoverage: FacultyCoverage[] = academicData.faculties.map((faculty) => {
  const programmes = academicData.programmes
    .filter((programme) => programme.facultyId === faculty.id)
    .map((programme) => buildProgrammeCoverage(programme.id))
    .filter((programme): programme is ProgrammeCoverage => programme !== null);

  return {
    facultyId: faculty.id,
    name: faculty.name,
    programmes,
    status: programmes.some((programme) => programme.moduleCount > 0) ? 'covered' : 'none',
  };
});

export const coveredFaculties = facultyCoverage.filter((faculty) => faculty.status === 'covered');
export const pendingFaculties = facultyCoverage.filter((faculty) => faculty.status === 'none');

export const coverageSummary = {
  facultyCount: facultyCoverage.length,
  coveredFacultyCount: coveredFaculties.length,
  pendingFacultyCount: pendingFaculties.length,
  coveredProgrammeCount: coveredFaculties.reduce((sum, faculty) => sum + faculty.programmes.length, 0),
  coveredModuleCount: coveredFaculties.reduce(
    (sum, faculty) => sum + faculty.programmes.reduce((inner, programme) => inner + programme.moduleCount, 0),
    0,
  ),
};

export function getFacultyCoverage(facultyId: FacultyId | ''): FacultyCoverage | null {
  if (!facultyId) return null;
  return facultyCoverage.find((faculty) => faculty.facultyId === facultyId) ?? null;
}

/** Degree types that actually have data, so the form can start on a useful tab. */
export const availableDegreeTypes: DegreeType[] = (
  ['master', 'bachelor'] as const
).filter((degreeType) => academicData.programmes.some((programme) => programme.degreeType === degreeType));
