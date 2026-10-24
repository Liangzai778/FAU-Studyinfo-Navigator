import { describe, expect, it } from 'vitest';
import { academicData } from './academicData';
import {
  availableDegreeTypes,
  coverageSummary,
  coveredFaculties,
  facultyCoverage,
  getFacultyCoverage,
  pendingFaculties,
  projectLinks,
} from './coverage';

describe('data coverage report', () => {
  it('covers every faculty in the data package exactly once', () => {
    expect(facultyCoverage.map((faculty) => faculty.facultyId)).toEqual(
      academicData.faculties.map((faculty) => faculty.id),
    );
  });

  it('reports the three biology master programmes as the only covered ones', () => {
    expect(coveredFaculties.map((faculty) => faculty.facultyId)).toEqual(['nat']);

    const nat = getFacultyCoverage('nat');
    expect(nat?.status).toBe('covered');
    expect(nat?.programmes.map((programme) => programme.programmeId)).toEqual([
      'nat-biologie-zell-molekularbiologie-msc',
      'nat-biologie-integrated-life-sciences-msc',
      'nat-biologie-integrated-immunology-msc',
    ]);
    expect(nat?.programmes.every((programme) => programme.degreeType === 'master')).toBe(true);
  });

  it('keeps the per-programme module counts at the transcribed values', () => {
    const counts = Object.fromEntries(
      facultyCoverage.flatMap((faculty) =>
        faculty.programmes.map((programme) => [programme.programmeId, programme.moduleCount]),
      ),
    );

    expect(counts).toEqual({
      'nat-biologie-zell-molekularbiologie-msc': 13,
      'nat-biologie-integrated-life-sciences-msc': 32,
      'nat-biologie-integrated-immunology-msc': 11,
    });
    expect(coverageSummary.coveredModuleCount).toBe(56);
  });

  it('leaves the other four faculties explicitly empty instead of guessing', () => {
    expect(pendingFaculties.map((faculty) => faculty.facultyId)).toEqual(['phil', 'wiso', 'med', 'tech']);
    for (const faculty of pendingFaculties) {
      expect(faculty.status).toBe('none');
      expect(faculty.programmes).toHaveLength(0);
    }
  });

  it('only marks a programme covered when its PO has transcribed requirement groups', () => {
    for (const programme of coveredFaculties.flatMap((faculty) => faculty.programmes)) {
      expect(programme.poVersionIds.length).toBeGreaterThan(0);
      expect(programme.requirementGroupCount).toBeGreaterThan(0);
      expect(programme.moduleCount).toBeGreaterThan(0);
    }
  });

  it('summarises the coverage counts consistently', () => {
    expect(coverageSummary.facultyCount).toBe(5);
    expect(coverageSummary.coveredFacultyCount).toBe(1);
    expect(coverageSummary.pendingFacultyCount).toBe(4);
    expect(coverageSummary.coveredProgrammeCount).toBe(3);
    expect(coverageSummary.coveredFacultyCount + coverageSummary.pendingFacultyCount).toBe(
      coverageSummary.facultyCount,
    );
  });

  it('starts the degree form on a degree type that has data', () => {
    expect(availableDegreeTypes[0]).toBe('master');
  });

  it('points contributors at HTTPS destinations only', () => {
    for (const url of Object.values(projectLinks)) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });
});
