import { describe, expect, it } from 'vitest';
import { academicData, academicDataSummary } from './academicData';

describe('production academic data package', () => {
  it('contains the five faculties but no fabricated academic rules', () => {
    expect(academicData.faculties).toHaveLength(5);
    expect(academicData.programmes).toEqual([]);
    expect(academicData.examinationRegulationVersions).toEqual([]);
    expect(academicData.modules).toEqual([]);
    expect(academicData.moduleVersions).toEqual([]);
    expect(academicData.requirementGroups).toEqual([]);
  });

  it('exposes only an unverified navigation source', () => {
    expect(academicData.academicSources).toHaveLength(1);
    expect(academicData.academicSources[0]).toMatchObject({
      id: 'fau-po-official-index',
      verificationStatus: 'unverified',
      lastVerifiedAt: null,
    });
    expect(academicDataSummary.programmeCount).toBe(0);
  });
});
