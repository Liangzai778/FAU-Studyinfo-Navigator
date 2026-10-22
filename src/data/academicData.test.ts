import { describe, expect, it } from 'vitest';
import { academicData, academicDataSummary } from './academicData';

describe('production academic data package', () => {
  it('contains the five faculties and no fabricated academic rules', () => {
    expect(academicData.faculties).toHaveLength(5);

    // Modules, credits and requirement groups are the parts that would encode
    // degree rules. The package must not invent any of them, so these stay
    // empty until each rule is transcribed from an official document.
    expect(academicData.examinationRegulationVersions).toEqual([]);
    expect(academicData.modules).toEqual([]);
    expect(academicData.moduleVersions).toEqual([]);
    expect(academicData.requirementGroups).toEqual([]);

    // Programme entries are allowed, but none may claim verified status and
    // every faculty reference must resolve.
    const facultyIds = new Set(academicData.faculties.map((faculty) => faculty.id));
    for (const programme of academicData.programmes) {
      expect(facultyIds.has(programme.facultyId)).toBe(true);
      expect(programme.dataStatus).not.toBe('verified');
    }
  });

  it('keeps every source official, traceable and HTTPS', () => {
    expect(academicData.academicSources.length).toBeGreaterThan(0);

    const sourceIds = new Set(academicData.academicSources.map((source) => source.id));
    for (const source of academicData.academicSources) {
      expect(source.url.startsWith('https://')).toBe(true);
      expect(source.publisher.length).toBeGreaterThan(0);
      expect(source.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }

    // Programme website links must point at known sources.
    for (const programme of academicData.programmes) {
      for (const sourceId of programme.websiteSourceIds) {
        expect(sourceIds.has(sourceId)).toBe(true);
      }
    }

    // A source claiming verification must record the verification date.
    for (const source of academicData.academicSources) {
      if (source.verificationStatus === 'verified') {
        expect(source.lastVerifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }

    expect(academicDataSummary.programmeCount).toBe(academicData.programmes.length);
  });
});
