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

/**
 * These tests are written so that adding another faculty is a data change, not
 * a test change.
 *
 * They pin two different things:
 *
 *  1. invariants that must hold for any data package, however many faculties
 *     are filled in (every faculty reported once, a faculty is "covered" only
 *     when a programme has a group-backed PO, summaries match the data);
 *  2. the current focus — the three biology master programmes and their module
 *     counts — so a refactor cannot silently drop or duplicate them.
 *
 * They deliberately do NOT assert "only nat is covered" or a total module
 * count. Those were true on 2026-10-24 and would have failed the first
 * contributor from another faculty, which is the opposite of what the
 * contribution guide promises.
 */
describe('data coverage report', () => {
  it('reports every faculty in the data package exactly once', () => {
    expect(facultyCoverage.map((faculty) => faculty.facultyId)).toEqual(
      academicData.faculties.map((faculty) => faculty.id),
    );
  });

  it('keeps the three biology master programmes covered', () => {
    const nat = getFacultyCoverage('nat');
    expect(nat?.status).toBe('covered');
    expect(nat?.programmes.map((programme) => programme.programmeId)).toEqual(
      expect.arrayContaining([
        'nat-biologie-zell-molekularbiologie-msc',
        'nat-biologie-integrated-life-sciences-msc',
        'nat-biologie-integrated-immunology-msc',
      ]),
    );
  });

  it('keeps the transcribed module counts of those three programmes', () => {
    const counts = Object.fromEntries(
      facultyCoverage.flatMap((faculty) =>
        faculty.programmes.map((programme) => [programme.programmeId, programme.moduleCount]),
      ),
    );
    expect(counts['nat-biologie-zell-molekularbiologie-msc']).toBe(13);
    expect(counts['nat-biologie-integrated-life-sciences-msc']).toBe(32);
    expect(counts['nat-biologie-integrated-immunology-msc']).toBe(11);
  });

  it('derives the status of a faculty from its programmes, not from a list', () => {
    for (const faculty of facultyCoverage) {
      const hasTranscribedProgramme = faculty.programmes.some((programme) => programme.moduleCount > 0);
      expect(faculty.status).toBe(hasTranscribedProgramme ? 'covered' : 'none');
    }
  });

  it('never lists a faculty as covered without a group-backed PO', () => {
    for (const programme of coveredFaculties.flatMap((faculty) => faculty.programmes)) {
      expect(programme.poVersionIds.length).toBeGreaterThan(0);
      expect(programme.requirementGroupCount).toBeGreaterThan(0);
      expect(programme.moduleCount).toBeGreaterThan(0);
    }
  });

  it('keeps the summary counts equal to the underlying data', () => {
    expect(coverageSummary.facultyCount).toBe(facultyCoverage.length);
    expect(coverageSummary.coveredFacultyCount).toBe(coveredFaculties.length);
    expect(coverageSummary.pendingFacultyCount).toBe(pendingFaculties.length);
    expect(coverageSummary.coveredFacultyCount + coverageSummary.pendingFacultyCount).toBe(
      coverageSummary.facultyCount,
    );
    expect(coverageSummary.coveredProgrammeCount).toBe(
      coveredFaculties.reduce((sum, faculty) => sum + faculty.programmes.length, 0),
    );
  });

  it('offers only degree types that have at least one programme', () => {
    expect(availableDegreeTypes.length).toBeGreaterThan(0);
    for (const degreeType of availableDegreeTypes) {
      expect(academicData.programmes.some((programme) => programme.degreeType === degreeType)).toBe(true);
    }
  });

  it('points contributors at HTTPS destinations only', () => {
    for (const url of Object.values(projectLinks)) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });
});
